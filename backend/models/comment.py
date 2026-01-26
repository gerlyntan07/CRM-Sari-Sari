#backend/models/auth.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    comment = Column(String, nullable=True)
    comment_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  

    related_to_account = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True)
    related_to_contact = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=True)
    related_to_deal = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=True)    
    related_to_task = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    related_to_meeting = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=True)
    related_to_call = Column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), nullable=True)
    related_to_quote = Column(Integer, ForeignKey("quotes.id", ondelete="CASCADE"), nullable=True)
    is_private = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="comments")
    contact = relationship("Contact", back_populates="comments")
    deal = relationship("Deal", back_populates="comments")
    task = relationship("Task", back_populates="comments")
    meeting = relationship("Meeting", back_populates="comments")
    call = relationship("Call", back_populates="comments")
    quote = relationship("Quote", back_populates="comments")
    comment_creator = relationship("User", back_populates="comments_created", foreign_keys=[comment_by])


