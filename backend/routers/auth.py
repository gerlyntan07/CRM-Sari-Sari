#backend/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from database import SessionLocal
from jose import jwt, JWTError
from models.auth import User
from schemas.auth import UserCreate, UserLogin, UserResponse, EmailCheck, EmailCheckResponse, UserWithCompany
from .auth_utils import hash_password, verify_password, create_access_token, get_default_avatar
import requests, os
from datetime import datetime, timezone
import string

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "defaultsecretkey")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact your administrator.")
    
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
def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not db_user.hashed_password:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # Check if user is active
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact your administrator.")
    
    db_user.last_login = datetime.now(timezone.utc)
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
@router.post("/google", response_model=UserResponse)
def google_login(token: dict, response: Response, db: Session = Depends(get_db)):
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
