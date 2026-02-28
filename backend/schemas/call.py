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
    related_to_quote: Optional[int] = None
    notes: str

class CallCreate(CallBase):
    assigned_to: int
    relatedType1: str
    relatedType2: Optional[str] = None
    relatedTo1: int
    relatedTo2: Optional[int] = None

class AssignToBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
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

class QuoteBase(BaseModel):
    id: int
    quote_id: str

    class Config:
        from_attributes = True
    
class CallResponse(CallBase):
    id: int
    subject: str
    account: Optional[AccountBase] = None
    lead: Optional[LeadBase] = None
    deal: Optional[DealBase] = None
    contact: Optional[ContactBase] = None
    quote: Optional[QuoteBase] = None
    call_assign_to: Optional[AssignToBase] = None
    call_creator: Optional[AssignToBase] = None
    duration_minutes: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None    

    class Config:
        from_attributes = True

class CallUpdate(BaseModel):
    subject: Optional[str] = None
    call_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    direction: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[int] = None
    relatedType1: Optional[str] = None
    relatedType2: Optional[str] = None
    relatedTo1: Optional[int] = None
    relatedTo2: Optional[int] = None

class CallBulkDelete(BaseModel):
    call_ids: list[int]

