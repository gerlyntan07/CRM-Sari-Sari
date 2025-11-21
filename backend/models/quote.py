from sqlalchemy import (
    Column, Integer, String, DateTime, func,
    ForeignKey, Numeric, Date
)
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

class QuoteStatus(str, Enum):
    DRAFT = 'Draft'
    PRESENTED = 'Presented'
    ACCEPTED = 'Accepted'
    REJECTED = 'Rejected'


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    # Example format: Q-2025-001
    quote_id = Column(String(20), unique=True, index=True, nullable=True)
    deal_name = Column(String, index=True, nullable=False)

    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)

    amount = Column(Numeric(10, 2), nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    presented_date = Column(Date, nullable=True)
    validity_date = Column(Date, nullable=True)
    status = Column(String, default=QuoteStatus.DRAFT.value, nullable=False)

    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)

    notes = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    contact = relationship("Contact", foreign_keys=[contact_id])
    account = relationship("Account", foreign_keys=[account_id])
    assigned_user = relationship("User", back_populates="assigned_quotes", foreign_keys=[assigned_to])
    creator = relationship("User", back_populates="created_quotes", foreign_keys=[created_by])

    def generate_quote_id(self, year_prefix: str = None):
        """Generates a unique quote ID like Q-2025-001"""
        if not self.id:
            raise ValueError("Quote must be committed before generating quote_id (requires ID).")

        from datetime import datetime
        year = year_prefix or datetime.now().strftime("%Y")
        formatted_id = f"Q-{year}-{self.id:03d}"
        self.quote_id = formatted_id
        return self.quote_id

