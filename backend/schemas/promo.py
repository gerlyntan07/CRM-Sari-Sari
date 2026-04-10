from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field


class PromoCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = None
    purpose: str = Field(default="CUSTOM")
    target_scope: str = Field(default="company")

    code_length: int = Field(default=8)
    manual_code: Optional[str] = None

    extend_days: int = Field(default=0, ge=0)
    discount_percent: Optional[float] = Field(default=None, ge=0)
    discount_amount: Optional[float] = Field(default=None, ge=0)

    max_total_redemptions: Optional[int] = Field(default=None, ge=1)
    max_redemptions_per_company: Optional[int] = Field(default=1, ge=1)
    max_redemptions_per_user: Optional[int] = Field(default=1, ge=1)

    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    extra_data: Optional[Dict[str, Any]] = None
    is_active: bool = True
    is_public: bool = True


class PromoUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = None
    purpose: Optional[str] = None
    target_scope: Optional[str] = None

    new_code: Optional[str] = None

    extend_days: Optional[int] = Field(default=None, ge=0)
    discount_percent: Optional[float] = Field(default=None, ge=0)
    discount_amount: Optional[float] = Field(default=None, ge=0)

    max_total_redemptions: Optional[int] = Field(default=None, ge=1)
    max_redemptions_per_company: Optional[int] = Field(default=None, ge=1)
    max_redemptions_per_user: Optional[int] = Field(default=None, ge=1)

    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    extra_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None


class PromoRedeemRequest(BaseModel):
    code: str
    company_id: Optional[int] = None
    redemption_channel: str = "account"
