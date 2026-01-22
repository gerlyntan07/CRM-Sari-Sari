from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from .auth import UserBase


class QuoteBase(BaseModel):
    deal_id: Optional[int] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None

    presented_date: Optional[date] = None
    validity_days: Optional[int] = None

    status: str = "Draft"
    total_amount: Decimal

    assigned_to: Optional[int] = None
    notes: Optional[str] = None


class QuoteCreate(QuoteBase):
    created_by_id: int


class QuoteUpdate(BaseModel):
    deal_id: Optional[int] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None

    presented_date: Optional[date] = None
    validity_days: Optional[int] = None

    status: Optional[str] = None
    total_amount: Optional[Decimal] = None

    assigned_to: Optional[int] = None
    notes: Optional[str] = None

class QuoteBulkDelete(BaseModel):
    quote_ids: list[int]


class DealBase(BaseModel):
    id: int
    # support either Deal.name or Deal.deal_name depending on your Deal model
    name: Optional[str] = None
    deal_name: Optional[str] = None

    class Config:
        from_attributes = True


class AccountBase(BaseModel):
    id: int
    name: str
    status: Optional[str] = None

    class Config:
        from_attributes = True


class ContactBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str] = None

    class Config:
        from_attributes = True


class QuoteResponse(QuoteBase):
    id: int
    quote_id: Optional[str] = None

    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    deal: Optional[DealBase] = None
    contact: Optional[ContactBase] = None
    account: Optional[AccountBase] = None

    assigned_user: Optional[UserBase] = None
    creator: Optional[UserBase] = None

    class Config:
        from_attributes = True
