from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from database import Base
from .auth import User


class InvoiceStatus(str, Enum):
    DRAFT = "Draft"
    SENT = "Sent"
    PAID = "Paid"
    VOID = "Void"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(String(30), unique=True, index=True, nullable=True)

    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    quote_id = Column(Integer, ForeignKey("quotes.id", ondelete="SET NULL"), nullable=True)

    purchase_order_number = Column(String(100), nullable=True)
    invoice_date = Column(Date, nullable=False, default=date.today)
    due_date = Column(Date, nullable=True)
    terms_of_payment = Column(String(100), nullable=True)

    status = Column(String(20), default=InvoiceStatus.DRAFT.value, nullable=False)

    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)

    currency = Column(String(3), default="PHP", nullable=False)
    notes = Column(Text, nullable=True)

    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="invoices")
    quote = relationship("Quote")
    items = relationship(
        "InvoiceItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="InvoiceItem.sort_order",
    )

    assigned_user = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])

    payments = relationship("Payment", back_populates="invoice")

    def calculate_totals(self) -> Decimal:
        self.subtotal = sum((item.line_total or Decimal("0")) for item in self.items) if self.items else Decimal("0")

        tax_rate = Decimal(str(self.tax_rate or 0))
        self.tax_amount = (self.subtotal * (tax_rate / Decimal("100"))) if tax_rate else Decimal("0")
        self.total_amount = self.subtotal + (self.tax_amount or Decimal("0"))
        return Decimal(str(self.total_amount or 0))

    def open_balance(self) -> Decimal:
        paid = sum((p.amount or Decimal("0")) for p in self.payments) if self.payments else Decimal("0")
        total = Decimal(str(self.total_amount or 0))
        return total - paid


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)

    item_type = Column(String(20), nullable=False, default="Product")
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sku = Column(String(50), nullable=True)
    variant = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)

    quantity = Column(Numeric(10, 2), nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0)
    discount_percent = Column(Numeric(5, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(12, 2), nullable=False, default=0)
    line_total = Column(Numeric(12, 2), nullable=False, default=0)

    sort_order = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    invoice = relationship("Invoice", back_populates="items")

    def calculate_line_total(self) -> Decimal:
        qty = Decimal(str(self.quantity or 0))
        unit_price = Decimal(str(self.unit_price or 0))
        subtotal = qty * unit_price

        discount_percent = Decimal(str(self.discount_percent or 0))
        if discount_percent > 0:
            self.discount_amount = subtotal * (discount_percent / Decimal("100"))
        else:
            self.discount_amount = Decimal("0")

        self.line_total = subtotal - Decimal(str(self.discount_amount or 0))
        return Decimal(str(self.line_total or 0))
