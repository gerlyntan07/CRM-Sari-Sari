# backend/schemas/support.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ==================== Support Ticket Schemas ====================

class SupportTicketBase(BaseModel):
    subject: str
    description: str
    category: str
    priority: str = "Medium"


class SupportTicketCreate(SupportTicketBase):
    pass


class SupportTicketUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None


class UserInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    profile_picture: Optional[str] = None

    class Config:
        orm_mode = True


class SupportTicketResponse(SupportTicketBase):
    id: int
    status: str
    created_by: int
    assigned_to: Optional[int] = None
    company_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    creator: Optional[UserInfo] = None
    assignee: Optional[UserInfo] = None

    class Config:
        orm_mode = True


class SupportTicketBulkDelete(BaseModel):
    ticket_ids: List[int]


# ==================== Chat Session Schemas ====================

class ChatSessionCreate(BaseModel):
    ticket_id: Optional[int] = None


class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    support_agent_id: Optional[int] = None
    company_id: Optional[int] = None
    ticket_id: Optional[int] = None
    status: str
    created_at: datetime
    ended_at: Optional[datetime] = None
    user: Optional[UserInfo] = None
    support_agent: Optional[UserInfo] = None

    class Config:
        orm_mode = True


# ==================== Chat Message Schemas ====================

class ChatMessageCreate(BaseModel):
    session_id: Optional[int] = None
    ticket_id: Optional[int] = None
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    session_id: Optional[int] = None
    ticket_id: Optional[int] = None
    sender_id: int
    message: str
    is_read: bool
    created_at: datetime
    sender: Optional[UserInfo] = None

    class Config:
        orm_mode = True


# ==================== Subscription Email Schemas ====================

class SubscriptionOverdueEmail(BaseModel):
    company_id: int
    to_email: str
    company_name: str
    plan_name: str
    end_date: datetime


class SubscriptionEmailResponse(BaseModel):
    success: bool
    message: str
    company_id: int


# ==================== Admin Team Stats Schemas ====================

class SupportStats(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    active_chats: int
    overdue_subscriptions: int
