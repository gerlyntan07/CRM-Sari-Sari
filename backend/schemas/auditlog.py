# backend/schemas/auth.py
from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional
from datetime import datetime
from .auth import UserBase

class LogBase(BaseModel):    
    description: Optional[str] = None
    name: Optional[str] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    old_data: Optional[dict] = None
    new_data: Optional[dict] = None
    ip_address: Optional[str] = None
    success: Optional[bool] = True    

class UserBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    role: str
    profile_picture: Optional[str] = None

    class Config:
        orm_mode = True

class LeadResponse(LogBase):
    id: int
    logger: Optional[UserBase] = None
    timestamp: Optional[datetime] = None
    is_read: Optional[bool] = None

    class Config:
        orm_mode = True
