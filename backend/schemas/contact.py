# backend/schemas/auth.py
from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional
from datetime import datetime
from .auth import UserBase

class ContactBase(BaseModel):    
    first_name: str
    last_name: str
    account_id: int
    title: Optional[str] = None
    department: Optional[str] = None
    email: Optional[EmailStr] = None
    work_phone: Optional[str] = None
    mobile_phone_1: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[int] = None
    created_by: Optional[int] = None    

class UserBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    profile_picture: Optional[str] = None

    class Config:
        orm_mode = True

class AccountBase(BaseModel):
    id: int
    name: str    
    phone_number: Optional[str] = None    
    status: str    

    class Config:
        orm_mode = True


class ContactResponse(ContactBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    assigned_contact: Optional[UserBase] = None
    contact_creator: Optional[UserBase] = None
    account: Optional[AccountBase] = None

    class Config:
        orm_mode = True
