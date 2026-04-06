#backend/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from database import SessionLocal
from jose import jwt, JWTError
from models.auth import User
from models.auditlog import Auditlog
from schemas.auth import UserCreate, UserLogin, UserResponse, EmailCheck, EmailCheckResponse, UserWithCompany, ForgotPasswordRequest, ForgotPasswordResponse, VerifyOtpRequest, VerifyOtpResponse, ResetPasswordRequest, ResetPasswordResponse
from .auth_utils import hash_password, verify_password, create_access_token, get_default_avatar
from .aws_ses_utils import send_otp_email
import requests, os
from datetime import datetime, timezone, timedelta
import random
import time

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "defaultsecretkey")

# 🔐 In-memory OTP store with expiration (email -> {otp, timestamp})
otp_store = {}

def generate_otp() -> str:
    """Generate a random 6-digit OTP"""
    return "".join([str(random.randint(0, 9)) for _ in range(6)])

def store_otp(email: str, otp: str, expiration_minutes: int = 1):
    """Store OTP with expiration timestamp"""
    otp_store[email] = {
        "otp": otp,
        "timestamp": time.time(),
        "expiration_minutes": expiration_minutes
    }

def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP and check if it's expired"""
    if email not in otp_store:
        return False
    
    stored = otp_store[email]
    elapsed_minutes = (time.time() - stored["timestamp"]) / 60
    
    # Check if expired
    if elapsed_minutes > stored["expiration_minutes"]:
        del otp_store[email]
        return False
    
    # Check if OTP matches
    if stored["otp"] == otp:
        del otp_store[email]  # Delete after successful verification
        return True
    
    return False

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def log_login_event(db: Session, db_user: User, request: Request):
    login_log = Auditlog(
        description=f"LOGIN User (ID: {db_user.id})",
        user_id=db_user.id,
        name=f"{db_user.first_name} {db_user.last_name}",
        action="LOGIN",
        entity_type="User",
        entity_id=str(db_user.id),
        ip_address=request.client.host if request and request.client else None,
        success=True,
    )
    db.add(login_log)

from fastapi import Request
from sqlalchemy.orm import joinedload

@router.get("/me", response_model=UserResponse)
def get_me(request: Request, db: Session = Depends(get_db)):
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).options(joinedload(User.company)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact your administrator.")
    
    # Check if company subscription is active
    if user.company and not user.company.is_subscription_active:
        raise HTTPException(status_code=403, detail="Company subscription has been suspended. Please contact support or your administrator.")
    
    return user



@router.post("/email-check", response_model=EmailCheckResponse)
def emailcheck(user: EmailCheck, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Account with this email already exists. Please enter another email.")
    else:
        return JSONResponse(content={"detail": "No existing email"})

# Manual signup
@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Account with this email already exists. Please enter another email.")

    # Pick default avatar based on first letter
    profile_pic_url = get_default_avatar(user.first_name)

    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        profile_picture=profile_pic_url,
        role=user.role,
        phone_number=user.phone_number,
        auth_provider="manual",
        related_to_company=user.company_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 🔑 Auto login after signup
    token = create_access_token({"sub": str(new_user.id)})

    cookie_secure = os.getenv("COOKIE_SECURE", "False") == "True"
    samesite_mode = os.getenv("COOKIE_SAMESITE", "lax")  

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=cookie_secure,
        samesite=samesite_mode,
        max_age=60 * 60 * 24 * 7,
        path="/"
    )

    return new_user

# Manual login
@router.post("/login", response_model=UserResponse)
def login(user: UserLogin, response: Response, request: Request, db: Session = Depends(get_db)):
    db_user = db.query(User).options(joinedload(User.company)).filter(User.email == user.email).first()
    if not db_user or not db_user.hashed_password:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # Check if user is active
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact your administrator.")
    
    # Check if company subscription is active
    if db_user.company and not db_user.company.is_subscription_active:
        raise HTTPException(status_code=403, detail="Company subscription has been suspended. Please contact support or your administrator.")
    
    db_user.last_login = datetime.now(timezone.utc)
    log_login_event(db, db_user, request)
    db.commit()
    db.refresh(db_user)

    token = create_access_token({"sub": str(db_user.id)})

    cookie_secure = os.getenv("COOKIE_SECURE", "False") == "True"
    samesite_mode = os.getenv("COOKIE_SAMESITE", "lax")  

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=cookie_secure,
        samesite=samesite_mode,
        max_age=60 * 60 * 24 * 7,
        path="/"
    )

    return db_user

# Google OAuth login
@router.post("/google/login", response_model=UserResponse)
def google_login(token: dict, response: Response, request: Request, db: Session = Depends(get_db)):
    id_token = token.get("id_token")
    company_id = token.get("company_id")
    if not id_token:
        raise HTTPException(status_code=400, detail="No id_token provided")

    google_verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    res = requests.get(google_verify_url)
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    user_info = res.json()
    email = user_info["email"]
    first_name = user_info.get("given_name", "")
    last_name = user_info.get("family_name", "")
    picture = user_info.get("picture")  # 👈 fetch Google profile picture

    db_user = db.query(User).options(joinedload(User.company)).filter(User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="No account found. Please sign up first.")

    db_user = db.query(User).options(joinedload(User.company)).filter(User.email == email).first()
    if not db_user:
        db_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            profile_picture=picture,   # 👈 save picture
            auth_provider="google",
            hashed_password=None,
            related_to_company=company_id,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    
    # Check if user is active
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact your administrator.")

    # Check if company subscription is active
    if db_user.company and not db_user.company.is_subscription_active:
        raise HTTPException(status_code=403, detail="Company subscription has been suspended. Please contact support or your administrator.")

    db_user.last_login = datetime.now(timezone.utc)
    log_login_event(db, db_user, request)
    db.commit()
    db.refresh(db_user)

    token = create_access_token({"sub": str(db_user.id)})

    cookie_secure = os.getenv("COOKIE_SECURE", "False") == "True"
    samesite_mode = os.getenv("COOKIE_SAMESITE", "lax")  

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite=samesite_mode,
        secure=cookie_secure,
        max_age=60 * 60 * 24 * 7,
        path="/"
    )

    return db_user

# Google OAuth signup
@router.post("/google/signup", response_model=UserResponse)
def google_signup(token: dict, response: Response, db: Session = Depends(get_db)):
    id_token = token.get("id_token")
    company_id = token.get("company_id")
    if not id_token:
        raise HTTPException(status_code=400, detail="No id_token provided")

    google_verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    res = requests.get(google_verify_url)
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    user_info = res.json()
    email = user_info["email"]
    first_name = user_info.get("given_name", "")
    last_name = user_info.get("family_name", "")
    picture = user_info.get("picture")  # 👈 fetch Google profile picture

    db_user = db.query(User).filter(User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already exists. Please enter another.")

    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        db_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            profile_picture=picture,   # 👈 save picture
            auth_provider="google",
            hashed_password=None,
            related_to_company=company_id,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    
    # Check if user is active
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact your administrator.")

    token = create_access_token({"sub": str(db_user.id)})

    cookie_secure = os.getenv("COOKIE_SECURE", "False") == "True"
    samesite_mode = os.getenv("COOKIE_SAMESITE", "lax")  

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite=samesite_mode,
        secure=cookie_secure,
        max_age=60 * 60 * 24 * 7,
        path="/"
    )

    return db_user

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/",
    )
    return {"detail": "Logged out successfully"}


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Step 1: Request password reset with email.
    Generates a 6-digit OTP and sends it via AWS SES email.
    OTP expires in 1 minute. Returns generic message for security.
    """
    # Validate email format
    if not request.email or "@" not in request.email:
        return {
            "detail": "If that email address is in our system, a verification code will be sent to it."
        }
    
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Return generic message for security (don't reveal if email exists)
        return {
            "detail": "If that email address is in our system, a verification code will be sent to it."
        }
    
    # Check if user has a password (manual auth) - can't reset OAuth accounts
    if not user.hashed_password:
        raise HTTPException(
            status_code=400, 
            detail="This account uses social login. Please reset your password through your social provider."
        )
    
    # Generate 6-digit OTP
    otp = generate_otp()
    store_otp(request.email, otp, expiration_minutes=1)
    
    # Send OTP via AWS SES
    email_sent = send_otp_email(request.email, otp)
    
    if email_sent:
        return {
            "detail": "If that email address is in our system, a verification code will be sent to it."
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to send verification email. Please try again.")


@router.post("/verify-otp", response_model=VerifyOtpResponse)
def verify_otp_endpoint(request: VerifyOtpRequest, db: Session = Depends(get_db)):
    """
    Step 2: Verify the OTP received via email.
    Returns a reset token if OTP is valid.
    """
    # Validate OTP format
    if not request.otp or len(request.otp) != 6:
        raise HTTPException(status_code=400, detail="Verification code must be 6 digits.")
    
    if not request.otp.isdigit():
        raise HTTPException(status_code=400, detail="Verification code must contain only numbers.")
    
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found. Please request a new verification code.")
    
    # Verify OTP
    if not verify_otp(request.email, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired verification code. Please check and try again or request a new code.")
    
    # Create reset token with 15 minute expiration
    reset_token = create_access_token(
        {"sub": str(user.id), "email": request.email, "type": "password_reset"},
        expires_delta=timedelta(minutes=15)
    )
    
    return {
        "detail": "Verification code accepted. Please reset your password.",
        "reset_token": reset_token
    }


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Step 3: Reset password using the reset token from OTP verification.
    """
    # Validate password format before processing token
    if not request.new_password or len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    
    try:
        # Decode the reset token
        payload = jwt.decode(request.reset_token, SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload.get("sub"))
        token_type = payload.get("type")
        
        # Verify token is a password reset token
        if token_type != "password_reset":
            raise JWTError("Invalid token type")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token. Please request a new verification code.")
    
    # Find user and verify email matches
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found. Please try again.")
    
    if user.email != request.email:
        raise HTTPException(status_code=400, detail="Email does not match. Please try again.")
    
    # Update password
    user.hashed_password = hash_password(request.new_password)
    db.commit()
    db.refresh(user)
    
    return {"detail": "Password reset successfully. You can now log in with your new password."}
