# backend/schemas/territory.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class TerritoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class TerritoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[int] = None # Made optional to be safe
    user_ids: List[int] = [] 
    company_id: int

class UserBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    profile_picture: Optional[str] = None
    
    class Config:
        from_attributes = True

class CompanyBase(BaseModel):
    id: int
    company_name: str
    company_number: Optional[str] = None # Often safe to make optional
    company_logo: Optional[str] = None   # ✅ FIXED: Handles None values

    class Config:
        from_attributes = True

class LeadBase(BaseModel):
    id: int
    title: Optional[str] = None
    first_name: str
    last_name: str
    
    class Config:
        from_attributes = True

class AccountBase(BaseModel):
    id: int
    name: str
    phone_number: Optional[str] = None

    class Config:
        from_attributes = True

class TerritoryResponse(TerritoryBase):
    id: int
    # ✅ FIXED: Renamed to match DB model and made a List
    assigned_to: Optional[UserBase] = None
    managed_by: Optional[UserBase] = None
    under_company: Optional[CompanyBase] = None
    
    # ✅ FIXED: Changed from Optional[LeadBase] to List
    leads: List[LeadBase] = []       
    
    # ✅ FIXED: Changed from Optional[AccountBase] to List
    accounts: List[AccountBase] = [] 
    
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Required for SQLAlchemy mapping