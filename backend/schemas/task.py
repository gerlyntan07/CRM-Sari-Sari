from pydantic import BaseModel, EmailStr
from typing import Optional, Union
from datetime import datetime


# ------------------------------
# BASE
# ------------------------------
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None    
    priority: str
    status: str
    due_date: Optional[datetime] = None
    created_by: int    


# ------------------------------
# CREATE
# ------------------------------
class TaskCreate(BaseModel):
    title: str
    due_date: Optional[datetime] = None
    status: str
    priority: str
    description: Optional[str] = None
    related_type_1: str
    related_type_2: Optional[str] = None
    related_to_1: int
    related_to_2: Optional[int] = None
    assigned_to: int


# ------------------------------
# UPDATE
# ------------------------------
class TaskUpdate(BaseModel):
    title: str
    due_date: Optional[datetime] = None
    status: str
    priority: str
    description: Optional[str] = None
    related_type_1: str
    related_type_2: Optional[str] = None
    related_to_1: int
    related_to_2: Optional[int] = None
    assigned_to: int


class TaskBulkDelete(BaseModel):
    task_ids: list[int]


# ------------------------------
# RESPONSE
# ------------------------------
class TaskResponse(TaskBase):
    id: int
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    profile_picture: str
    role: str

class AccountBase(BaseModel):
    id: int
    name: str

class ContactBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str

class LeadBase(BaseModel):
    id: int
    title: str
    first_name: str
    last_name: str

class DealBase(BaseModel):
    id: int
    deal_id: str
    name: str

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
