# backend/schemas/auth.py
from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional
from datetime import datetime

class LeadBase(BaseModel):    
    first_name: str
    last_name: str
    company_name: str
    title: str
    department: str
    email: EmailStr
    work_phone: str
    mobile_phone_1: str
    mobile_phone_2: str
    address: str
    notes: str    

class LeadCreate(LeadBase):
    status: str
    territory_id: int
    lead_owner: int
    created_by: int

class LeadResponse(LeadBase):
    id: int    

    class Config:
        orm_mode = True
