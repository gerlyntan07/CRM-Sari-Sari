# backend/schemas/company.py
from pydantic import BaseModel, HttpUrl, constr
from typing import Optional
from datetime import datetime

class CompanyBase(BaseModel):
    company_name: constr(min_length=2, max_length=100)
    company_number: constr(min_length=2, max_length=50)
    slug: Optional[str] = None
    company_website: Optional[HttpUrl] = None
    company_logo: Optional[str] = None
    address: Optional[str] = None
    tenant_number: Optional[str] = None  # 12-digit tenant number

class CompanyCreate(CompanyBase):
    pass

# ✅ NEW: Add this class to handle the update request from AdminCompanyDetails
class CompanyUpdate(BaseModel):
    company_name: str
    slug: Optional[str] = None
    currency: Optional[str] = "PHP"       # e.g., "PHP" or "USD"
    quota_period: Optional[str] = "January" # e.g., "April"
    tax_rate: Optional[float] = 0       # Default tax rate percentage
    vat_registration_number: Optional[str] = None
    tax_id_number: Optional[str] = None
    company_logo: Optional[str] = None  # Base64 encoded logo image
    address: Optional[str] = None
    calendar_start_day: Optional[str] = None  # NEW: Calendar start day (e.g. 'Monday')
    backup_reminder: Optional[str] = None  # NEW: Backup reminder frequency

    class Config:
        orm_mode = True

class CompanyResponse(CompanyBase):
    id: int
    tenant_number: str
    # ✅ UPDATE: Add these so the Frontend can read the saved settings
    currency: Optional[str] = "PHP"
    quota_period: Optional[str] = "January"
    tax_rate: Optional[float] = 0
    vat_registration_number: Optional[str] = None
    tax_id_number: Optional[str] = None
    calendar_start_day: Optional[str] = None  # NEW: Calendar start day
    backup_reminder: Optional[str] = None  # NEW: Backup reminder frequency
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True


class CompanyInvoiceInfo(BaseModel):
    """Minimal payload needed to print quote invoice."""

    company_name: str
    company_number: str
    company_logo: Optional[str] = None
    company_website: Optional[str] = None
    vat_registration_number: Optional[str] = None
    tax_id_number: Optional[str] = None
    ceo_name: Optional[str] = None
    ceo_email: Optional[str] = None
    address: Optional[str] = None

    class Config:
        orm_mode = True