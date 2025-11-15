from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MeetingCreate(BaseModel):
    subject: str
    location: Optional[str] = None
    duration: Optional[int] = None  # in minutes
    meeting_link: Optional[str] = None
    agenda: Optional[str] = None
    due_date: str  # ISO format date string
    assigned_to: Optional[int] = None  # user ID
    related_type: Optional[str] = None  # Client, Project, Internal, etc.
    related_to: Optional[str] = None  # name or ID of related entity
    priority: Optional[str] = "Low"
    status: Optional[str] = "PENDING"

class MeetingUpdate(BaseModel):
    subject: Optional[str] = None
    location: Optional[str] = None
    duration: Optional[int] = None
    meeting_link: Optional[str] = None
    agenda: Optional[str] = None
    due_date: Optional[str] = None
    assigned_to: Optional[int] = None
    related_type: Optional[str] = None
    related_to: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class MeetingResponse(BaseModel):
    id: int
    activity: str  # alias for subject
    subject: str
    location: Optional[str] = None
    duration: Optional[int] = None
    meetingLink: Optional[str] = None
    description: Optional[str] = None  # alias for agenda
    agenda: Optional[str] = None
    dueDate: Optional[str] = None
    assignedTo: Optional[str] = None  # full name
    relatedType: Optional[str] = None
    relatedTo: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True

