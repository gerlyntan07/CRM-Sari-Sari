#backend/models/auth.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

class ContactStatus(str, Enum):
    ACTIVE = 'Active'
    INACTIVE = 'Inactive'

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True, nullable=True)
    last_name = Column(String, index=True, nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    email = Column(String, nullable=True)    
    work_phone = Column(String(20), nullable=True)
    mobile_phone_1 = Column(String(20), nullable=True)
    mobile_phone_2 = Column(String(20), nullable=True)
    notes = Column(String, nullable=True)
    status = Column(String, default=ContactStatus.ACTIVE.value, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())         

    account = relationship("Account", back_populates="contacts")
    assigned_contact = relationship("User", back_populates="contacts", foreign_keys=[assigned_to])
    contact_creator = relationship("User", back_populates="created_contact", foreign_keys=[created_by])

    deals = relationship("Deal", back_populates="contact", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="contact", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="contact", cascade="all, delete-orphan")
    calls = relationship("Call", back_populates="contact", cascade="all, delete-orphan")

    quotes = relationship("Quote", back_populates="contact", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="contact", cascade="all, delete-orphan")
