#backend/models/auth.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship
from backend.database import Base
from enum import Enum

class DealStage(str, Enum):
    PROSPECTING = 'Prospecting'
    QUALIFICATION = 'Qualification'
    PROPOSAL = 'Proposal'
    NEGOTIATION = 'Negotiation'
    CLOSED_WON = 'Closed Won'
    CLOSED_LOST = 'Closed Lost'

class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    primary_contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    stage = Column(String, default=DealStage.PROSPECTING.value, nullable=False)
    amount = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(3), nullable=True, default='PHP')
    close_date = Column(DateTime, nullable=True)
    probability = Column(Integer, default=10, nullable=True)
    description = Column(String, nullable=True)    
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())         
    

    account = relationship("Account", back_populates="deals")
    contact = relationship("Contact", back_populates="deals", foreign_keys=[primary_contact_id])

    assigned_deals = relationship("User", back_populates="deals", foreign_keys=[assigned_to])
    deal_creator = relationship("User", back_populates="created_deals", foreign_keys=[created_by])
