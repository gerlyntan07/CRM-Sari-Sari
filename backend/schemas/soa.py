from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel

from .auth import UserBase


class SoaItemBase(BaseModel):
    item_type: str = "Product"
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    variant: Optional[str] = None
    unit: Optional[str] = None

    quantity: Decimal = Decimal("1")
    unit_price: Decimal
    discount_percent: Optional[Decimal] = Decimal("0")

    sort_order: Optional[int] = 0


class SoaItemCreate(SoaItemBase):
    pass


class SoaItemResponse(SoaItemBase):
    id: int
    soa_id: int

    discount_amount: Optional[Decimal] = Decimal("0")
    line_total: Decimal

    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccountBase(BaseModel):
    id: int
    name: str
    status: Optional[str] = None

    class Config:
        from_attributes = True


class SoaBase(BaseModel):
    account_id: int

    purchase_order_number: Optional[str] = None
    quote_number: Optional[str] = None

    soa_date: Optional[date] = None
    terms_of_payment: Optional[str] = None
    due_date: Optional[date] = None

    full_payment: bool = True

    status: str = "Draft"
    presented_date: Optional[date] = None
    paid_date: Optional[date] = None

    subtotal: Optional[Decimal] = Decimal("0")
    tax_rate: Optional[Decimal] = Decimal("0")
    tax_amount: Optional[Decimal] = Decimal("0")
    total_amount: Optional[Decimal] = Decimal("0")

    currency: str = "PHP"

    notes: Optional[str] = None

    prepared_by: Optional[str] = None
    approved_by: Optional[str] = None
    received_by: Optional[str] = None

    assigned_to: Optional[int] = None


class SoaCreate(SoaBase):
    created_by_id: int
    items: Optional[List[SoaItemCreate]] = []


class SoaUpdate(BaseModel):
    account_id: Optional[int] = None

    purchase_order_number: Optional[str] = None
    quote_number: Optional[str] = None

    soa_date: Optional[date] = None
    terms_of_payment: Optional[str] = None
    due_date: Optional[date] = None

    full_payment: Optional[bool] = None

    status: Optional[str] = None
    presented_date: Optional[date] = None
    paid_date: Optional[date] = None

    subtotal: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None

    currency: Optional[str] = None

    notes: Optional[str] = None

    prepared_by: Optional[str] = None
    approved_by: Optional[str] = None
    received_by: Optional[str] = None

    assigned_to: Optional[int] = None

    items: Optional[List[SoaItemCreate]] = None


class SoaResponse(SoaBase):
    id: int
    soa_id: Optional[str] = None

    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    account: Optional[AccountBase] = None

    assigned_user: Optional[UserBase] = None
    creator: Optional[UserBase] = None

    items: List[SoaItemResponse] = []

    class Config:
        from_attributes = True
