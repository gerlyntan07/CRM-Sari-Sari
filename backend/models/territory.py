#backend/models/territory.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.database import Base
from enum import Enum

class Territory(Base):
    __tablename__ = "territories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ✅ Enforce uniqueness per company
    __table_args__ = (
        UniqueConstraint("company_id", "name", name="uq_territory_company_name"),
    )
    
    managed_by = relationship("User", back_populates="territory")
    under_company = relationship("Company", back_populates="territory")
    leads = relationship("Lead", back_populates="territory", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="territory", cascade="all, delete-orphan")
