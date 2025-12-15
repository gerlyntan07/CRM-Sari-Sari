from pydantic import BaseModel, EmailStr
from typing import Optional, Union
from datetime import datetime


# ------------------------------
# BASE (what the UI expects)
# ------------------------------
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None

    # used for related-to logic (Account/Contact/Lead/Deal) but not stored in DB
    type: Optional[str] = None

    priority: str
    status: str

    dueDate: Optional[datetime] = None
    dateAssigned: Optional[datetime] = None

    assignedTo: Optional[int] = None
    assignedToName: Optional[str] = None   # ✅ for UI dropdown + table display

    createdById: Optional[int] = None      # ✅ for UI filters/display
    createdBy: Optional[str] = None        # ✅ "First Last" or "System"

    relatedTo: Optional[Union[int, str]] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ------------------------------
# CREATE (what frontend POST sends)
# ------------------------------
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None

    priority: str
    status: str

    # ✅ allow null, because frontend can send null
    dueDate: Optional[datetime] = None

    assignedTo: Optional[int] = None
    relatedTo: Optional[int] = None

    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ------------------------------
# UPDATE (partial updates allowed)
# ------------------------------
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None

    # ✅ optional so PUT can update just one field if needed
    priority: Optional[str] = None
    status: Optional[str] = None

    dueDate: Optional[datetime] = None
    assignedTo: Optional[int] = None
    relatedTo: Optional[int] = None

    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ------------------------------
# RESPONSE (what backend returns)
# ------------------------------
class TaskResponse(TaskBase):
    id: int
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# ------------------------------
# OPTIONAL: Fetch format if you still need relational payloads
# (you can keep this if other endpoints use it)
# ------------------------------
class UserBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    profile_picture: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


class AccountBase(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ContactBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str

    class Config:
        from_attributes = True


class LeadBase(BaseModel):
    id: int
    title: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class DealBase(BaseModel):
    id: int
    deal_id: str
    name: str

    class Config:
        from_attributes = True


class TaskFetch(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    priority: str
    status: str
    due_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

    task_creator: Optional[UserBase] = None
    task_assign_to: Optional[UserBase] = None

    account: Optional[AccountBase] = None
    contact: Optional[ContactBase] = None
    lead: Optional[LeadBase] = None
    deal: Optional[DealBase] = None

    class Config:
        from_attributes = True
