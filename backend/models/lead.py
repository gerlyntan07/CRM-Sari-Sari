#backend/models/auth.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

class LeadStatus(str, Enum):
    NEW = 'New'
    CONTACTED = 'Contacted'
    QUALIFIED = 'Qualified'
    LOST = 'Lost'
    CONVERTED = 'Converted'

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True, nullable=False)
    last_name = Column(String, index=True, nullable=False)
    company_name = Column(String, index=True, nullable=False)
    title = Column(String)
    department = Column(String)
    email = Column(String)
    work_phone = Column(String(20), nullable=True)
    mobile_phone_1 = Column(String(20), nullable=True)
    mobile_phone_2 = Column(String(20), nullable=True)
    address = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    status = Column(String, default=LeadStatus.NEW.value, nullable=True)
    source = Column(String, nullable=True)
    territory_id = Column(Integer, ForeignKey("territories.id", ondelete="SET NULL"), nullable=True)
    lead_owner = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())    
        
    territory = relationship("Territory", back_populates="leads")

    assigned_to = relationship("User", back_populates="leads", foreign_keys=[lead_owner])
    creator = relationship("User", back_populates="created_leads", foreign_keys=[created_by])