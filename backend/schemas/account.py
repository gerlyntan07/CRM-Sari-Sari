# backend/schemas/account.py
from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional, List
from datetime import datetime
from .auth import UserBase

class AccountBase(BaseModel):
    name: str
    website: Optional[str] = None
    phone_number: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    industry: Optional[str] = None
    status: str
    parent_company: Optional[str] = None
    territory_id: Optional[int] = None
    assigned_to: Optional[int] = None
    created_by: Optional[int] = None


class AccountCreate(AccountBase):
    """Payload for creating an account."""
    pass


class AccountUpdate(BaseModel):
    """Payload for updating an account (all fields optional)."""
    name: Optional[str] = None
    website: Optional[str] = None
    phone_number: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    industry: Optional[str] = None
    status: Optional[str] = None
    parent_company: Optional[str] = None
    territory_id: Optional[int] = None
    assigned_to: Optional[int] = None

class UserBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    profile_picture: Optional[str] = None

    class Config:
        orm_mode = True

class TerritoryBase(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class AccountBulkDelete(BaseModel):
    account_ids: List[int]

class AccountResponse(AccountBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    assigned_accs: Optional[UserBase] = None
    acc_creator: Optional[UserBase] = None
    territory: Optional[TerritoryBase] = None

    class Config:
        orm_mode = True