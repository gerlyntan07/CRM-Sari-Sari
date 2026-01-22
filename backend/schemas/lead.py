# backend/schemas/auth.py
from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional, List
from datetime import datetime

class LeadBase(BaseModel):    
    first_name: str
    last_name: str
    company_name: str
    title: str
    department: str
    email: EmailStr
    work_phone: str
    mobile_phone_1: Optional[str]
    mobile_phone_2: Optional[str]
    address: str
    notes: str    
    source: Optional[str]    

class LeadStatusUpdate(BaseModel):
    status: str

class LeadUpdate(BaseModel):
    """Payload for updating a lead (all fields optional)."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    email: Optional[EmailStr] = None
    work_phone: Optional[str] = None
    mobile_phone_1: Optional[str] = None
    mobile_phone_2: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    territory_id: Optional[int] = None
    lead_owner: Optional[int] = None

class LeadCreate(LeadBase):
    status: str
    territory_id: Optional[int]
    lead_owner: int    


class LeadBulkDelete(BaseModel):
    lead_ids: List[int]


class TerritoryBase(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class UserWithTerritories(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    related_to_company: int
    role: str
    profile_picture: Optional[str] = None
    assigned_territory: List[TerritoryBase] = []

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    phone_number: Optional[str] = None

class LeadResponse(LeadBase):
    id: int    
    assigned_to: Optional[UserWithTerritories] = None
    territory: Optional[TerritoryBase] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    status: str
    creator: Optional[UserBase] = None

    class Config:
        orm_mode = True
