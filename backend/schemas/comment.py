from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr


RelatedType = Literal[
    "account",
    "contact",
    "deal",
    "task",
    "meeting",
    "call",
    "quote",
]


class CommentCreate(BaseModel):
    related_type: RelatedType
    related_id: int
    comment: str
    is_private: bool = False


class CommentCreator(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    profile_picture: Optional[str] = None

    class Config:
        orm_mode = True


class CommentResponse(BaseModel):
    id: int
    comment: Optional[str] = None
    is_private: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    comment_creator: Optional[CommentCreator] = None

    class Config:
        orm_mode = True
