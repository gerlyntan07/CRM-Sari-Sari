from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import relationship

from database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True)

    payment_date = Column(Date, nullable=False, default=date.today)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="PHP", nullable=False)

    reference_number = Column(String(100), nullable=True)
    method = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")
    creator = relationship("User", foreign_keys=[created_by])

    def amount_decimal(self) -> Decimal:
        return Decimal(str(self.amount or 0))
