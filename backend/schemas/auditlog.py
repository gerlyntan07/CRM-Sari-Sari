# backend/schemas/auth.py
from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional
from datetime import datetime
from .auth import UserBase

class LogBase(BaseModel):    
    description: str
    name: str
    action: str
    entity_type: str
    entity_id: str
    old_data: Optional[dict] = None
    new_data: Optional[dict] = None
    ip_address: str
    success: bool    

class UserBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    profile_picture: Optional[str] = None

    class Config:
        orm_mode = True

class LeadResponse(LogBase):
    id: int
    logger: Optional[UserBase] = None
    timestamp: datetime

    class Config:
        orm_mode = True
