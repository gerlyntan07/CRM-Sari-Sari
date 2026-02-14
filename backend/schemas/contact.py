# backend/schemas/auth.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from .auth import UserBase

class ContactBase(BaseModel):    
    first_name: Optional[str] = None
    last_name: str
    account_id: int
    title: Optional[str] = None
    department: Optional[str] = None
    email: EmailStr
    work_phone: Optional[str] = None
    mobile_phone_1: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    assigned_to: int
    created_by: Optional[int] = None    

class ContactCreate(ContactBase):
    """Payload for creating a contact via admin panel."""
    pass

class ContactUpdate(BaseModel):
    """Payload for updating a contact (all fields optional)."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    account_id: Optional[int] = None
    title: Optional[str] = None
    department: Optional[str] = None
    email: Optional[EmailStr] = None
    work_phone: Optional[str] = None
    mobile_phone_1: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None

class ContactBulkDelete(BaseModel):
    contact_ids: List[int]

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
