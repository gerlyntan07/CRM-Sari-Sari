#backend/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import SessionLocal
from models.auth import User
from schemas.auth import UserCreate, UserLogin, UserResponse
from .auth_utils import hash_password, verify_password, create_access_token, get_default_avatar
import requests, os
import string

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DEFAULT_PROFILE_PIC = "https://cdn-icons-png.flaticon.com/512/149/149071.png"

# Manual signup
@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

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
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 🔑 Auto login after signup
    token = create_access_token({"sub": str(new_user.id)})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=bool(os.getenv("COOKIE_SECURE", "False") == "True"),
        samesite="lax",
        max_age=60 * 60,  # 1 hour
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

    token = create_access_token({"sub": str(db_user.id)})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=bool(os.getenv("COOKIE_SECURE", "False") == "True"),
        samesite="lax",
        max_age=60 * 60,
        path="/"
    )

    return db_user

# Google OAuth login
@router.post("/google", response_model=UserResponse)
def google_login(token: dict, response: Response, db: Session = Depends(get_db)):
    id_token = token.get("id_token")
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
            hashed_password=None
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    token = create_access_token({"sub": str(db_user.id)})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=bool(os.getenv("COOKIE_SECURE", "False") == "True"),
        max_age=60 * 60,
        path="/"
    )

    return db_user