# backend/models/support.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum


class TicketStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class TicketPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class TicketCategory(str, Enum):
    TECHNICAL_ISSUE = "Technical Issue"
    LOGIN_PROBLEM = "Login Problem"
    DATA_ISSUE = "Data Issue"
    FEATURE_REQUEST = "Feature Request"
    PERFORMANCE_ISSUE = "Performance Issue"
    SUBSCRIPTION = "Subscription"
    OTHER = "Other"


class SupportTicket(Base):
    """Model for support tickets/issues reported by users"""
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default=TicketCategory.OTHER.value, nullable=False)
    priority = Column(String(20), default=TicketPriority.MEDIUM.value, nullable=False)
    status = Column(String(20), default=TicketStatus.OPEN.value, nullable=False)
    
    # User who created the ticket
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Support team member assigned to the ticket
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # Company the ticket is related to
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by], backref="created_tickets")
    assignee = relationship("User", foreign_keys=[assigned_to], backref="assigned_tickets")
    company = relationship("Company", backref="support_tickets")
    messages = relationship("ChatMessage", back_populates="ticket", cascade="all, delete-orphan")


class ChatSession(str, Enum):
    ACTIVE = "Active"
    CLOSED = "Closed"


class SupportChatSession(Base):
    """Model for live chat sessions between users and support team"""
    __tablename__ = "support_chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    # User who initiated the chat
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Support team member handling the chat
    support_agent_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # Company the chat is related to
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    # Optional ticket reference
    ticket_id = Column(Integer, ForeignKey("support_tickets.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(20), default=ChatSession.ACTIVE.value, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="chat_sessions")
    support_agent = relationship("User", foreign_keys=[support_agent_id], backref="handled_sessions")
    company = relationship("Company", backref="chat_sessions")
    ticket = relationship("SupportTicket", backref="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    """Model for chat messages in support sessions"""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("support_chat_sessions.id", ondelete="CASCADE"), nullable=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("SupportChatSession", back_populates="messages")
    ticket = relationship("SupportTicket", back_populates="messages")
    sender = relationship("User", backref="sent_messages")
