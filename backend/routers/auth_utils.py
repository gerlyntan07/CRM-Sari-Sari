from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from database import SessionLocal, SECRET_KEY
from datetime import datetime, timedelta
import os
from fastapi import Depends, HTTPException, Request
from models.auth import User
import string
from services.subscription_lifecycle import apply_trial_lifecycle

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Support legacy bcrypt hashes and new argon2 hashes.
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def hash_password(password: str) -> str:
    """Hash password safely using Argon2"""
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password) -> bool:
    """Verify password using configured hash schemes."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (UnknownHashError, ValueError, TypeError):
        return False

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact your administrator.")

    # Trial lifecycle / plan enforcement
    if user.related_to_company:
        subscription_status = apply_trial_lifecycle(db, user.related_to_company)

        # Free tier: only the tenant (CEO) can access the account
        if subscription_status.get("is_free_tier") and (user.role or "").strip().upper() != "CEO":
            raise HTTPException(
                status_code=403,
                detail="This organization is currently on the Free tier. Only the tenant (CEO) can log in."
            )

        # Attach dynamic subscription status for downstream handlers
        setattr(user, "subscription_status", subscription_status)

    return user


# Avatar based on first letter of first name
DEFAULT_AVATAR_BASE = "https://ik.imagekit.io/cafedejur/avatars"

def get_default_avatar(first_name: str) -> str:
    if not first_name:
        return f"{DEFAULT_AVATAR_BASE}/default.png"
    
    first_letter = first_name[0].upper()
    if first_letter not in string.ascii_uppercase:
        return f"{DEFAULT_AVATAR_BASE}/default.png"

    return f"{DEFAULT_AVATAR_BASE}/{first_letter}.png"
