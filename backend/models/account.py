#backend/models/auth.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

class AccountStatus(str, Enum):
    ACTIVE = 'Active'
    INACTIVE = 'Inactive'
    PROSPECT = 'Prospect'
    CUSTOMER = 'Customer'
    PARTNER = "Partner"
    FORMER = 'Former'

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    website = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    billing_address = Column(String, nullable=True)
    shipping_address = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    status = Column(String, default=AccountStatus.PROSPECT.value, nullable=True)
    territory_id = Column(Integer, ForeignKey("territories.id", ondelete="SET NULL"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())    
        
    territory = relationship("Territory", back_populates="accounts")

    assigned_accs = relationship("User", back_populates="accounts", foreign_keys=[assigned_to])
    acc_creator = relationship("User", back_populates="created_acc", foreign_keys=[created_by])
    contact = relationship("Contact", uselist=False, back_populates="account", cascade="all, delete-orphan")