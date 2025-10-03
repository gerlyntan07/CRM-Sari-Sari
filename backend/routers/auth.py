from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models.auth import User
from schemas.auth import UserCreate, UserLogin, UserResponse
from .auth_utils import hash_password, verify_password, create_access_token
import requests, os

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Manual signup
@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(email=user.email, hashed_password=hash_password(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# Manual login
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not db_user.hashed_password:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}

# Google OAuth login
@router.post("/google")
def google_login(token: dict, db: Session = Depends(get_db)):
    access_token = token.get("access_token")
    google_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    response = requests.get(google_url, headers={"Authorization": f"Bearer {access_token}"})
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    user_info = response.json()
    email = user_info["email"]

    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        db_user = User(email=email, auth_provider="google")
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    token = create_access_token({"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}
