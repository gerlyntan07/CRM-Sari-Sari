#backend/models/auth.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

class UserRole(str, Enum):
    CEO = "CEO"
    ADMIN = "Admin"
    GROUP_MANAGER = "Group Manager"
    MANAGER = "Manager"
    MARKETING = "Marketing"
    SALES = "Sales"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # nullable for Google users    
    profile_picture = Column(String, nullable=True)
    role = Column(String, default=UserRole.CEO.value, nullable=False)
    phone_number = Column(String, nullable=True)
    auth_provider = Column(String, default="manual")  # "manual" or "google"
    related_to_CEO = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Self-referential foreign key
    related_to_company = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True) 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)  # tracks last login


    manager = relationship("User", remote_side=[id])
    company = relationship("Company", back_populates="users")
    audit_logs = relationship("Auditlog", back_populates="logger", cascade="all, delete-orphan")
    territory = relationship("Territory", back_populates="managed_by", uselist=False, cascade="all, delete-orphan")

    leads = relationship("Lead", back_populates="assigned_to", foreign_keys="[Lead.lead_owner]", cascade="all, delete-orphan")
    created_leads = relationship("Lead", back_populates="creator", foreign_keys="[Lead.created_by]", cascade="all, delete-orphan")

    accounts = relationship("Account", back_populates="assigned_accs", foreign_keys="[Account.assigned_to]", cascade="all, delete-orphan")
    created_acc = relationship("Account", back_populates="acc_creator", foreign_keys="[Account.created_by]", cascade="all, delete-orphan")

    contacts = relationship("Contact", back_populates="assigned_contact", foreign_keys="[Contact.assigned_to]", cascade="all, delete-orphan")
    created_contact = relationship("Contact", back_populates="contact_creator", foreign_keys="[Contact.created_by]", cascade="all, delete-orphan")

    deals = relationship("Deal", back_populates="assigned_deals", foreign_keys="[Deal.assigned_to]", cascade="all, delete-orphan")
    created_deals = relationship("Deal", back_populates="deal_creator", foreign_keys="[Deal.created_by]", cascade="all, delete-orphan")
    
    tasks_assigned = relationship("Task", back_populates="assigned_user")

    meetings_created = relationship("Meeting", back_populates="meet_creator", foreign_keys="[Meeting.created_by]", cascade="all, delete-orphan")
    meetings_assigned = relationship("Meeting", back_populates="meet_assign_to", foreign_keys="[Meeting.assigned_to]", cascade="all, delete-orphan")

    tasks_created = relationship("Task", back_populates="task_creator", foreign_keys="[Task.created_by]", cascade="all, delete-orphan")
    tasks_assigned = relationship("Task", back_populates="task_assign_to", foreign_keys="[Task.assigned_to]", cascade="all, delete-orphan")

    calls_created = relationship("Call", back_populates="call_creator", foreign_keys="[Call.created_by]", cascade="all, delete-orphan")
    calls_assigned = relationship("Call", back_populates="call_assign_to", foreign_keys="[Call.assigned_to]", cascade="all, delete-orphan")

    assigned_quotes = relationship("Quote", back_populates="assigned_user", foreign_keys="[Quote.assigned_to]", cascade="all, delete-orphan")
    created_quotes = relationship("Quote", back_populates="creator", foreign_keys="[Quote.created_by]", cascade="all, delete-orphan")

