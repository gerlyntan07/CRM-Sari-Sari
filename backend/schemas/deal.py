# backend/schemas/deal.py
from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional
from datetime import datetime
from .auth import UserBase

class DealBase(BaseModel):    
    name: str
    account_id: Optional[int] = None
    primary_contact_id: Optional[int] = None
    stage: str
    amount: float
    currency: Optional[str] = 'PHP'
    close_date: Optional[datetime] = None
    description: Optional[str] = None
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

class ContactBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    work_phone: Optional[str] = None

    class Config:
        orm_mode = True


class DealResponse(DealBase):
    id: int
    deal_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None    
    account: Optional[AccountBase] = None
    contact: Optional[ContactBase] = None
    assigned_deal: Optional[UserBase] = None
    deal_creator: Optional[UserBase] = None    

    class Config:
        orm_mode = True