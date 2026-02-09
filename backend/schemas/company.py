# backend/schemas/company.py
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class CompanyBase(BaseModel):    
    company_name: str
    company_number: str
    company_website: Optional[HttpUrl] = None
    company_logo: Optional[str] = None
    address: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

# ✅ NEW: Add this class to handle the update request from AdminCompanyDetails
class CompanyUpdate(BaseModel):
    company_name: str
    currency: Optional[str] = "₱"       # e.g., "₱" or "$"
    quota_period: Optional[str] = "January" # e.g., "April"
    tax_rate: Optional[float] = 0       # Default tax rate percentage
    company_logo: Optional[str] = None  # Base64 encoded logo image
    address: Optional[str] = None

    class Config:
        orm_mode = True

class CompanyResponse(CompanyBase):
    id: int
    # ✅ UPDATE: Add these so the Frontend can read the saved settings
    currency: Optional[str] = "₱"
    quota_period: Optional[str] = "January"
    tax_rate: Optional[float] = 0
    
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
    ceo_email: Optional[str] = None
    address: Optional[str] = None

    class Config:
        orm_mode = True