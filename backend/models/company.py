# backend/models/company.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    company_number = Column(String, nullable=False)
    company_website = Column(String, nullable=True)
    company_logo = Column(String, nullable=True)    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Add this line to link back to User
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    plan = relationship("Subscription", back_populates="subscriber")