from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum
from models.task import TaskStatus, TaskPriority
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[TaskPriority]
    status: Optional[TaskStatus]
    dueDate: Optional[datetime] = None
    dateAssigned: Optional[datetime] = None
    assignedTo: Optional[str] = None   # full name string from response
    relatedTo: Optional[str] = None
    notes: Optional[str] = None

class TaskCreate(TaskBase):
    assignedTo: int
    description: Optional[str] = None
    dueDate: datetime
    priority: TaskPriority
    relatedTo: int
    status: TaskStatus
    title: str
    type: str

class TaskUpdate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True
