from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class AnnouncementPublishRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=300)
    target_role: str = Field(default="ALL", min_length=1, max_length=50)
    starts_at: datetime
    ends_at: Optional[datetime] = None


class AnnouncementResponse(BaseModel):
    message: str = ""
    target_role: str = "ALL"
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AnnouncementMutationResponse(BaseModel):
    message: str
    announcement: AnnouncementResponse


class AnnouncementClearResponse(BaseModel):
    message: str
