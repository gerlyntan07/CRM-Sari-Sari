from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class CallBase(BaseModel):
    subject: str
    call_time: datetime
    duration_minutes: Optional[int] = None
    direction: str
    status: str
    related_to_account: Optional[int] = None
    related_to_contact: Optional[int] = None
    related_to_lead: Optional[int] = None
    related_to_deal: Optional[int] = None
    assigned_to: int
    notes: str

class CallCreate(CallBase):
    relatedType1: str
    relatedType2: Optional[str] = None
    relatedTo1: int
    relatedTo2: Optional[int] = None

class AssignToBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    class Config:
        from_attributes = True        

class AccountBase(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class LeadBase(BaseModel):
    id: int
    title: str
    class Config:
        from_attributes = True

class DealBase(BaseModel):
    id: int
    deal_id: str
    name: str
    class Config:
        from_attributes = True
    
class CallResponse(CallBase):
    id: int
    subject: str
    account: Optional[AccountBase] = None
    lead: Optional[LeadBase] = None
    deal: Optional[DealBase] = None
    contact: Optional[ContactBase] = None
    call_assign_to: Optional[AssignToBase] = None
    duration_minutes: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None    

    class Config:
        from_attributes = True

# class CallBase(BaseModel):
#     subject: str
#     primary_contact: Optional[str] = None
#     primary_contact_id: Optional[int] = None
#     phone_number: Optional[str] = None
#     call_time: Optional[str] = None
#     call_duration: Optional[str] = None
#     notes: Optional[str] = None
#     due_date: Optional[str] = None
#     assigned_to: Optional[str] = None
#     assigned_to_id: Optional[int] = None
#     related_type: Optional[str] = None
#     related_to: Optional[str] = None
#     related_to_id: Optional[int] = None
#     priority: Optional[str] = "LOW"
#     status: Optional[str] = "PENDING"

# class CallCreate(CallBase):
#     pass

# class CallUpdate(BaseModel):
#     status: Optional[str] = None

# class CallResponse(CallBase):
#     id: int
#     call_duration: Optional[int] = None  # Override to int for response
#     created_at: Optional[datetime] = None
#     updated_at: Optional[datetime] = None

#     class Config:
#         from_attributes = True