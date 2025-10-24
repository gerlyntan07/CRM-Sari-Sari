# schemas/task.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None                      # 👈 add this field
    status: Optional[str] = "To Do"
    priority: Optional[str] = "Medium"
    assigned_to: Optional[str] = Field(default=None, alias="assignedTo")
    due_date: Optional[datetime] = Field(default=None, alias="dueDate")
    related_to: Optional[str] = Field(default=None, alias="relatedTo")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True                     # allows camelCase + snake_case


class TaskCreate(TaskBase):
    pass


class TaskUpdate(TaskBase):
    pass


class TaskResponse(TaskBase):
    id: int
    date_assigned: Optional[datetime] = Field(default=None, alias="dateAssigned")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")

    class Config:
        orm_mode = True
