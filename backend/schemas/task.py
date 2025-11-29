from pydantic import BaseModel, EmailStr
from typing import Optional, Union
from datetime import datetime
from models.task import TaskStatus, TaskPriority


# ------------------------------
# BASE
# ------------------------------
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None

    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None

    dueDate: Optional[datetime] = None
    dateAssigned: Optional[datetime] = None

    # IDs must be INT, not string
    assignedTo: Optional[int] = None      # <-- FIXED
    relatedTo: Optional[int] = None       # <-- FIXED

    notes: Optional[str] = None


# ------------------------------
# CREATE
# ------------------------------
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str

    priority: TaskPriority
    status: TaskStatus

    dueDate: datetime
    assignedTo: Optional[int] = None      # <-- FIXED
    relatedTo: Optional[int] = None       # <-- FIXED


# ------------------------------
# UPDATE
# ------------------------------
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None

    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None

    dueDate: Optional[datetime] = None
    assignedTo: Optional[int] = None      # <-- FIXED
    relatedTo: Optional[int] = None       # <-- FIXED

    notes: Optional[str] = None


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
    priority: Optional[TaskPriority]
    status: Optional[TaskStatus]
    due_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    task_creator: Optional[UserBase] = None
    task_assign_to: Optional[UserBase] = None
    account: Optional[AccountBase] = None
    contact: Optional[ContactBase] = None
    lead: Optional[LeadBase] = None
    deal: Optional[DealBase] = None
