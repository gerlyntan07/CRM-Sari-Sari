from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, func,
    ForeignKey, UniqueConstraint, Numeric
)
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

class DealStage(str, Enum):
    PROSPECTING = 'PROSPECTING'
    QUALIFICATION = 'QUALIFICATION'
    PROPOSAL = 'PROPOSAL'
    NEGOTIATION = 'NEGOTIATION'
    CLOSED_WON = 'CLOSED_WON'
    CLOSED_LOST = 'CLOSED_LOST'


# Mapping probabilities similar to Django's STAGE_PROBABILITY_MAP
STAGE_PROBABILITY_MAP = {
    DealStage.PROSPECTING: 10,
    DealStage.QUALIFICATION: 25,
    DealStage.PROPOSAL: 60,
    DealStage.NEGOTIATION: 80,
    DealStage.CLOSED_WON: 100,
    DealStage.CLOSED_LOST: 0,
}


class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    # Example format: D25-00001
    deal_id = Column(String(20), unique=True, index=True, nullable=True)
    name = Column(String, index=True, nullable=False)

    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    primary_contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)

    stage = Column(String, default=DealStage.PROSPECTING.value, nullable=False)
    amount = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(3), default='PHP', nullable=True)
    close_date = Column(DateTime, nullable=True)
    probability = Column(Integer, default=STAGE_PROBABILITY_MAP[DealStage.PROSPECTING], nullable=True)
    description = Column(String, nullable=True)

    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    account = relationship("Account", back_populates="deals")
    contact = relationship("Contact", back_populates="deals", foreign_keys=[primary_contact_id])
    assigned_deals = relationship("User", back_populates="deals", foreign_keys=[assigned_to])
    deal_creator = relationship("User", back_populates="created_deals", foreign_keys=[created_by])
    meetings = relationship("Meeting", back_populates="deal", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="deal", cascade="all, delete-orphan")
    calls = relationship("Call", back_populates="deal", cascade="all, delete-orphan")

    def generate_deal_id(self, year_prefix: str = None):
        """Generates a unique deal ID like D25-00001"""
        if not self.id:
            raise ValueError("Deal must be committed before generating deal_id (requires ID).")

        from datetime import datetime
        year = year_prefix or datetime.now().strftime("%y")
        formatted_id = f"D{year}-{self.id:05d}"
        self.deal_id = formatted_id
        return self.deal_id
