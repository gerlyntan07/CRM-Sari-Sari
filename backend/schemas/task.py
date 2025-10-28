from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    REVIEW = "Review"
    COMPLETED = "Completed"

class TaskPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    status: Optional[TaskStatus] = TaskStatus.TODO
    dueDate: Optional[datetime] = None
    dateAssigned: Optional[datetime] = None
    assignedTo: Optional[str] = None   # full name string from response
    relatedTo: Optional[str] = None
    notes: Optional[str] = None

class TaskCreate(TaskBase):
    # These should match your POST request body (snake_case)
    due_date: Optional[datetime] = None
    assigned_to: Optional[int] = None
    related_to: Optional[str] = None
    date_assigned: Optional[datetime] = None

class TaskUpdate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True
