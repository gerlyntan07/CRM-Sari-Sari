from pydantic import BaseModel
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
    created_by: int
    assigned_to: int

class CallCreate(CallBase):
    pass

class CallResponse(CallBase):
    id: int
    subject: str
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