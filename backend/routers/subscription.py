#backend/routers/subscription.py
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from database import SessionLocal
from jose import jwt, JWTError
from models.subscription import Subscription
from schemas.subscription import SubscriptionCreate, SubscriptionResponse
from .auth_utils import hash_password, verify_password, create_access_token, get_default_avatar
import requests, os
from datetime import datetime, timezone
import string

router = APIRouter(prefix="/subscription", tags=["Subscription"])

SECRET_KEY = os.getenv("SECRET_KEY", "defaultsecretkey")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from fastapi import Request
from sqlalchemy.orm import joinedload

@router.post("/subscribe", response_model=SubscriptionResponse)
def subscribe(user: SubscriptionCreate, response: Response, db: Session = Depends(get_db)):    
    new_subscriber = Subscription(
        company_id=user.company_id,
        plan_name=user.plan_name,
        price=user.price,
        status="Active",        
    )
    db.add(new_subscriber)
    db.commit()
    db.refresh(new_subscriber)    
    return new_subscriber
