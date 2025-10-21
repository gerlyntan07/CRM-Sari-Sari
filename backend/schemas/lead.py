# backend/schemas/auth.py
from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional
from datetime import datetime
from .auth import UserBase

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

class LeadCreate(LeadBase):
    status: str
    territory_id: Optional[int]
    lead_owner: int    


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
    role: str
    profile_picture: Optional[str] = None
    territory: Optional[TerritoryBase] = None

    class Config:
        orm_mode = True

class LeadResponse(LeadBase):
    id: int    
    assigned_to: Optional[UserWithTerritories] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    status: str
    creator: Optional[UserBase] = None

    class Config:
        orm_mode = True
