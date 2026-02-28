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
    probability: Optional[int] = None  # ✅ Changed to Optional (Backend auto-fills this)
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
    email: Optional[EmailStr] = None
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
    email: Optional[EmailStr] = None
    work_phone: Optional[str] = None

    class Config:
        orm_mode = True


class DealCreate(BaseModel):
    name: str
    account_id: int
    primary_contact_id: Optional[int] = None
    stage: str
    # ✅ Added probability here as optional override
    probability: Optional[int] = None 
    amount: Optional[float] = None
    currency: Optional[str] = 'PHP'
    close_date: Optional[datetime] = None
    description: Optional[str] = None
    assigned_to: Optional[int] = None

class DealUpdate(BaseModel):
    name: Optional[str] = None
    account_id: Optional[int] = None
    primary_contact_id: Optional[int] = None
    stage: Optional[str] = None
    # ✅ Added probability update support
    probability: Optional[int] = None 
    amount: Optional[float] = None
    currency: Optional[str] = None
    close_date: Optional[datetime] = None
    description: Optional[str] = None
    assigned_to: Optional[int] = None

class DealBulkDelete(BaseModel):
    deal_ids: list[int]

class DealResponse(DealBase):
    id: int
    deal_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None    
    status: Optional[str] = None
    
    # ✅ 🆕 The Missing Link for your "Bottleneck" view
    stage_updated_at: Optional[datetime] = None 

    account: Optional[AccountBase] = None
    contact: Optional[ContactBase] = None
    assigned_deals: Optional[UserBase] = None
    deal_creator: Optional[UserBase] = None    

    class Config:
        orm_mode = True