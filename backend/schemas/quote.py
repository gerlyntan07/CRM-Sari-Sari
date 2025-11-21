# backend/schemas/quote.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from .auth import UserBase

class QuoteBase(BaseModel):
    deal_name: str
    contact_id: Optional[int] = None
    account_id: Optional[int] = None
    amount: Optional[float] = None
    total_amount: float
    presented_date: Optional[date] = None
    validity_date: Optional[date] = None
    status: str = "Draft"
    assigned_to: Optional[int] = None
    notes: Optional[str] = None

class QuoteCreate(QuoteBase):
    created_by_id: int

class QuoteUpdate(BaseModel):
    deal_name: Optional[str] = None
    contact_id: Optional[int] = None
    account_id: Optional[int] = None
    amount: Optional[float] = None
    total_amount: Optional[float] = None
    presented_date: Optional[date] = None
    validity_date: Optional[date] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    notes: Optional[str] = None

class AccountBase(BaseModel):
    id: int
    name: str
    status: Optional[str] = None

    class Config:
        orm_mode = True

class ContactBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str] = None

    class Config:
        orm_mode = True

class QuoteResponse(QuoteBase):
    id: int
    quote_id: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    contact: Optional[ContactBase] = None
    account: Optional[AccountBase] = None
    assigned_user: Optional[UserBase] = None
    creator: Optional[UserBase] = None

    class Config:
        orm_mode = True

