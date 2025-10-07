# backend/schemas/auth.py
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class CompanyBase(BaseModel):    
    company_name: str
    company_number: str
    company_website: Optional[HttpUrl] = None
    company_logo: Optional[str] = None

class CompanyCreate(CompanyBase):
    CEO_id: Optional[int] = None

class CompanyResponse(CompanyBase):
    id: int
    CEO_id: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True
