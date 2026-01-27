from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from .auth import UserBase


# ==================== QUOTE ITEM SCHEMAS ====================

class QuoteItemBase(BaseModel):
    """Base schema for quote line items (products/services)"""
    item_type: str = "Product"              # 'Product' or 'Service'
    name: str                                # Product/Service name
    description: Optional[str] = None        # Detailed description
    sku: Optional[str] = None               # Stock Keeping Unit / Item code
    variant: Optional[str] = None           # Size, color, version, etc.
    unit: Optional[str] = None              # Unit of measure (pcs, kg, hours, etc.)
    
    quantity: Decimal = Decimal("1")
    unit_price: Decimal
    discount_percent: Optional[Decimal] = Decimal("0")
    
    sort_order: Optional[int] = 0


class QuoteItemCreate(QuoteItemBase):
    """Schema for creating a new quote item"""
    pass


class QuoteItemUpdate(BaseModel):
    """Schema for updating an existing quote item"""
    item_type: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    variant: Optional[str] = None
    unit: Optional[str] = None
    
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    discount_percent: Optional[Decimal] = None
    
    sort_order: Optional[int] = None


class QuoteItemResponse(QuoteItemBase):
    """Schema for quote item response"""
    id: int
    quote_id: int
    discount_amount: Optional[Decimal] = Decimal("0")
    line_total: Decimal
    
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== QUOTE SCHEMAS ====================

class QuoteBase(BaseModel):
    deal_id: Optional[int] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None

    presented_date: Optional[date] = None
    validity_days: Optional[int] = None

    status: str = "Draft"
    
    # Pricing fields
    subtotal: Optional[Decimal] = Decimal("0")
    tax_rate: Optional[Decimal] = Decimal("0")
    tax_amount: Optional[Decimal] = Decimal("0")
    discount_type: Optional[str] = None       # 'percentage' or 'fixed'
    discount_value: Optional[Decimal] = Decimal("0")
    discount_amount: Optional[Decimal] = Decimal("0")
    total_amount: Decimal
    
    currency: str = "PHP"
    assigned_to: Optional[int] = None
    notes: Optional[str] = None


class QuoteCreate(QuoteBase):
    created_by_id: int
    items: Optional[List[QuoteItemCreate]] = []  # Optional: create quote with items


class QuoteUpdate(BaseModel):
    deal_id: Optional[int] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None

    presented_date: Optional[date] = None
    validity_days: Optional[int] = None

    status: Optional[str] = None
    
    # Pricing fields
    subtotal: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    
    currency: Optional[str] = None
    assigned_to: Optional[int] = None
    notes: Optional[str] = None
    
    # Line items (optional - if provided, replaces all existing items)
    items: Optional[List[QuoteItemCreate]] = None


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
    
    # Include line items
    items: List[QuoteItemResponse] = []

    class Config:
        from_attributes = True
