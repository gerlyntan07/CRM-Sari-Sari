from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, func,
    ForeignKey, UniqueConstraint, Numeric
)
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum
from .auth import User

class DealStage(str, Enum):
    PROSPECTING = 'PROSPECTING'
    QUALIFICATION = 'QUALIFICATION'
    PROPOSAL = 'PROPOSAL'
    NEGOTIATION = 'NEGOTIATION'
    CLOSED_WON = 'CLOSED_WON'
    CLOSED_LOST = 'CLOSED_LOST'
    CLOSED_CANCELLED ='CLOSED_CANCELLED'


# Mapping probabilities similar to Django's STAGE_PROBABILITY_MAP
STAGE_PROBABILITY_MAP = {
    DealStage.PROSPECTING: 10,
    DealStage.QUALIFICATION: 25,
    DealStage.PROPOSAL: 60,
    DealStage.NEGOTIATION: 80,
    DealStage.CLOSED_WON: 100,
    DealStage.CLOSED_LOST: 0,
    DealStage.CLOSED_CANCELLED: 0, 

}

class DealStatus(str, Enum):
    ACTIVE = 'Active'
    INACTIVE = 'Inactive'


class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(String(20), unique=True, index=True, nullable=True)
    name = Column(String, index=True, nullable=False)

    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    primary_contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)

    stage = Column(String, default=DealStage.PROSPECTING.value, nullable=False)
    amount = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(3), default='PHP', nullable=True)
    close_date = Column(DateTime, nullable=True)
    probability = Column(Integer, default=STAGE_PROBABILITY_MAP[DealStage.PROSPECTING], nullable=True)
    stage_updated_at = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(String, nullable=True)

    status = Column(String, default=DealStatus.ACTIVE.value, nullable=True)
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
    quotes = relationship("Quote", back_populates="deal", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="deal", cascade="all, delete-orphan")

    def generate_deal_id(self, db, year_prefix: str = None):
        """
        Generates deal ID: DYY-companyID-00001
        Increment resets per company.
        """
        from datetime import datetime

        if not self.id:
            raise ValueError("Deal must be committed before generating deal_id (requires ID).")

        # Determine year
        year = year_prefix or datetime.now().strftime("%y")

        # Get company ID of the creator
        creator = db.query(User).filter(User.id == self.created_by).first()
        if not creator or not creator.related_to_company:
            raise ValueError("Creator must belong to a company to generate deal_id.")

        company_id = creator.related_to_company

        # Get last deal for this company
        last_deal = (
            db.query(Deal)
            .join(User, Deal.created_by == User.id)
            .filter(User.related_to_company == company_id)
            .filter(Deal.deal_id.like(f"D{year}-{company_id}-%"))
            .order_by(Deal.deal_id.desc())
            .first()
        )

        if last_deal and last_deal.deal_id:
            last_number = int(last_deal.deal_id.split("-")[-1])
            next_number = last_number + 1
        else:
            next_number = 1

        # Format: D25-3-00001
        self.deal_id = f"D{year}-{company_id}-{next_number:05d}"

        return self.deal_id
