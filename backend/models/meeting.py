# backend/models/company.py
from sqlalchemy import Column, Integer, String, Enum, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import enum

class MeetingStatus(str, enum.Enum):
    PLANNED = 'Planned'
    HELD = 'Held'
    NOT_HELD = 'Not held'
    INACTIVE = 'Inactive'

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(255), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    location = Column(String(255), nullable=True)
    status = Column(Enum(MeetingStatus), default=MeetingStatus.PLANNED, nullable=True)
    notes = Column(String, nullable=True)
    related_to_account = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True)
    related_to_contact = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=True)
    related_to_lead = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=True)
    related_to_deal = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="meetings")
    contact = relationship("Contact", back_populates="meetings")
    lead = relationship("Lead", back_populates="meetings")
    deal = relationship("Deal", back_populates="meetings")
    meet_creator = relationship("User", back_populates="meetings_created", foreign_keys=[created_by])
    meet_assign_to = relationship("User", back_populates="meetings_assigned", foreign_keys=[assigned_to])
    comments = relationship("Comment", back_populates="meeting", cascade="all, delete-orphan")
