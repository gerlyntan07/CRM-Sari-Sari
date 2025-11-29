from pydantic import BaseModel
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
