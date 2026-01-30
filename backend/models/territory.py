# backend/models/territory.py
from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

class TerritoryStatus(str, Enum):
    ACTIVE = 'Active'
    INACTIVE = 'Inactive'

class Territory(Base):
    __tablename__ = "territories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # Name is NOT unique anymore
    description = Column(String, nullable=True)
    
    # Manager is stored in every row
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # User is stored in every row (One user per row)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default=TerritoryStatus.ACTIVE.value, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ✅ UPDATED CONSTRAINT: 
    # Allow "Mindanao" to exist multiple times, but prevent assigning the SAME User to "Mindanao" twice.
    __table_args__ = (
        UniqueConstraint("company_id", "name", "user_id", name="uq_territory_user_assignment"),
    )
    
    # Relationships
    assigned_to = relationship("User", back_populates="assigned_territory", foreign_keys=[user_id])
    managed_by = relationship("User", back_populates="managed_territory", foreign_keys=[manager_id])
    under_company = relationship("Company", back_populates="territory")
    
    # Note: When a lead is assigned to territory.id = 101, it effectively belongs to User 7
    leads = relationship("Lead", back_populates="territory", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="territory", cascade="all, delete-orphan")