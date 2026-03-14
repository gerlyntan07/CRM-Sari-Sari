# backend/models/company.py
from enum import Enum

from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from database import Base

class CalendarStartCategory(str, Enum):
    MONDAY = "Monday"
    SUNDAY = "Sunday"

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    slug = Column(String, nullable=True)
    company_number = Column(String, nullable=False)
    company_website = Column(String, nullable=True)
    company_logo = Column(String, nullable=True) 
    address=Column(String, nullable=True)
    currency = Column(String, default="₱", nullable=True)  
    quota_period = Column(String, default="January", nullable=True)
    tax_rate = Column(Numeric(5, 2), default=0, nullable=True)  # Default tax rate percentage
    vat_registration_number = Column(String, nullable=True)
    tax_id_number = Column(String, nullable=True)
    is_subscription_active = Column(Boolean, default=True, nullable=False)  # New field for subscription status
    calendar_start_day = Column(String, default=CalendarStartCategory.MONDAY.value, nullable=True)

    # Backup reminder frequency (Daily, Weekly, Monthly, etc.)
    backup_reminder = Column(String, default="Daily", nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Add this line to link back to User
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    plan = relationship("Subscription", back_populates="subscriber")
    territory = relationship("Territory", back_populates="under_company", cascade="all, delete-orphan")
