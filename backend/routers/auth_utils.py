from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from backend.database import SessionLocal, SECRET_KEY
from datetime import datetime, timedelta
import os
from fastapi import Depends, HTTPException, Request
from models.auth import User
import string

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ Use Argon2 instead of bcrypt (no 72-byte limit)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(password: str) -> str:
    """Hash password safely using Argon2"""
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password) -> bool:
    """Verify password using Argon2"""
    return pwd_context.verify(plain_password, hashed_password)

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
