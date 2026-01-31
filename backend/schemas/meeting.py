from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MeetingBase(BaseModel):
    subject: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    status: str
    notes: Optional[str] = None

class MeetingCreate(BaseModel):
    subject: str    
    startTime: datetime
    endTime: datetime
    location: Optional[str] = None
    status: str
    notes: Optional[str] = None
    relatedType1: str
    relatedType2: Optional[str] = None
    relatedTo1: int
    relatedTo2: Optional[int] = None
    assignedTo: int

class MeetingUpdate(BaseModel):
    subject: Optional[str] = None    
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    relatedType1: Optional[str] = None
    relatedType2: Optional[str] = None
    relatedTo1: Optional[int] = None
    relatedTo2: Optional[int] = None
    assignedTo: Optional[int] = None

class MeetingBulkDelete(BaseModel):
    meeting_ids: list[int]

class AccountBase(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    id:int
    first_name: str
    last_name: str
    class Config:
        from_attributes = True

class LeadBase(BaseModel):
    id:int
    title: str
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    id:int
    first_name: str
    last_name: str
    class Config:
        from_attributes = True

class DealBase(BaseModel):
    id:int
    name: str
    deal_id: str

    class Config:
        from_attributes = True

class QuoteBase(BaseModel):
    id: int
    quote_id: str

    class Config:
        from_attributes = True

class MeetingResponse(MeetingBase):
    id: int        
    account: Optional[AccountBase] = None
    contact: Optional[ContactBase] = None
    lead: Optional[LeadBase] = None
    deal: Optional[DealBase] = None
    quote: Optional[QuoteBase] = None
    meet_creator: Optional[UserBase] = None
    meet_assign_to: Optional[UserBase] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

