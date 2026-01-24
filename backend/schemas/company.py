# backend/schemas/company.py
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class CompanyBase(BaseModel):    
    company_name: str
    company_number: str
    company_website: Optional[HttpUrl] = None
    company_logo: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

# ✅ NEW: Add this class to handle the update request from AdminCompanyDetails
class CompanyUpdate(BaseModel):
    company_name: str
    currency: Optional[str] = "₱"       # e.g., "₱" or "$"
    quota_period: Optional[str] = "January" # e.g., "April"

    class Config:
        orm_mode = True

class CompanyResponse(CompanyBase):
    id: int
    # ✅ UPDATE: Add these so the Frontend can read the saved settings
    currency: Optional[str] = "₱"
    quota_period: Optional[str] = "January"
    
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True