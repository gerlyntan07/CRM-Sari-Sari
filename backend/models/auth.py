#backend/models/auth.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

class UserRole(str, Enum):
    CEO = "CEO"
    MARKETING = "marketing"
    MANAGER = "manager"
    SALES = "sales"

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
    related_to_CEO = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Self-referential foreign key
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    manager = relationship("User", remote_side=[id])
    company = relationship("Company", back_populates="owner", uselist=False, cascade="all, delete-orphan")