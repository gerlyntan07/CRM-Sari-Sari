from __future__ import annotations

from enum import Enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import relationship

from database import Base
from .auth import User


class SoaStatus(str, Enum):
    DRAFT = "Draft"
    PRESENTED = "Presented"
    PAID = "Paid"


class SoaItemType(str, Enum):
    PRODUCT = "Product"
    SERVICE = "Service"


class StatementOfAccount(Base):
    __tablename__ = "statements_of_account"

    id = Column(Integer, primary_key=True, index=True)
    soa_id = Column(String(24), unique=True, index=True, nullable=True)

    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)

    purchase_order_number = Column(String(100), nullable=True)
    quote_number = Column(String(50), nullable=True)

    soa_date = Column(Date, nullable=True)
    terms_of_payment = Column(String(100), nullable=True)
    due_date = Column(Date, nullable=True)

    full_payment = Column(Boolean, default=True, nullable=False)

    status = Column(String(20), default=SoaStatus.DRAFT.value, nullable=False)
    presented_date = Column(Date, nullable=True)
    paid_date = Column(Date, nullable=True)

    # Pricing summary (calculated from items)
    subtotal = Column(Numeric(12, 2), nullable=True, default=0)
    tax_rate = Column(Numeric(5, 2), nullable=True, default=0)
    tax_amount = Column(Numeric(12, 2), nullable=True, default=0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)

    currency = Column(String(3), default="PHP", nullable=False)

    notes = Column(Text, nullable=True)

    prepared_by = Column(String(100), nullable=True)
    approved_by = Column(String(100), nullable=True)
    received_by = Column(String(100), nullable=True)

    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="soas")
    assigned_user = relationship("User", back_populates="soas_assigned", foreign_keys=[assigned_to])
    creator = relationship("User", back_populates="soas_created", foreign_keys=[created_by])

    items = relationship(
        "SoaItem",
        back_populates="soa",
        cascade="all, delete-orphan",
        order_by="SoaItem.sort_order",
    )

    def calculate_totals(self):
        from decimal import Decimal

        self.subtotal = (
            sum((item.line_total or Decimal("0")) for item in self.items) if self.items else Decimal("0")
        )

        if self.tax_rate:
            self.tax_amount = self.subtotal * (Decimal(str(self.tax_rate)) / Decimal("100"))
        else:
            self.tax_amount = Decimal("0")

        self.total_amount = self.subtotal + self.tax_amount
        return self.total_amount

    def generate_soa_id(self, db, year_prefix: str | None = None):
        """Generates SOA ID: SOAYY-companyID-00001 (resets per company)."""
        from datetime import datetime

        if not self.id:
            raise ValueError("SOA must be committed before generating soa_id (requires ID).")

        year = year_prefix or datetime.now().strftime("%y")

        creator = db.query(User).filter(User.id == self.created_by).first()
        if not creator or not creator.related_to_company:
            raise ValueError("Creator must belong to a company to generate soa_id.")

        company_id = creator.related_to_company

        last = (
            db.query(StatementOfAccount)
            .join(User, StatementOfAccount.created_by == User.id)
            .filter(User.related_to_company == company_id)
            .filter(StatementOfAccount.soa_id.like(f"SOA{year}-{company_id}-%"))
            .order_by(StatementOfAccount.soa_id.desc())
            .first()
        )

        if last and last.soa_id:
            last_number = int(last.soa_id.split("-")[-1])
            next_number = last_number + 1
        else:
            next_number = 1

        self.soa_id = f"SOA{year}-{company_id}-{next_number:05d}"
        return self.soa_id


class SoaItem(Base):
    __tablename__ = "soa_items"

    id = Column(Integer, primary_key=True, index=True)
    soa_id = Column(Integer, ForeignKey("statements_of_account.id", ondelete="CASCADE"), nullable=False)

    item_type = Column(String(20), default=SoaItemType.PRODUCT.value, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sku = Column(String(50), nullable=True)
    variant = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)

    quantity = Column(Numeric(10, 2), nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    discount_percent = Column(Numeric(5, 2), nullable=True, default=0)
    discount_amount = Column(Numeric(12, 2), nullable=True, default=0)
    line_total = Column(Numeric(12, 2), nullable=False)

    sort_order = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    soa = relationship("StatementOfAccount", back_populates="items")

    def calculate_line_total(self):
        from decimal import Decimal

        subtotal = (self.quantity or Decimal("1")) * (self.unit_price or Decimal("0"))

        if self.discount_percent and self.discount_percent > 0:
            self.discount_amount = subtotal * (self.discount_percent / Decimal("100"))
        else:
            self.discount_amount = Decimal("0")

        self.line_total = subtotal - self.discount_amount
        return self.line_total
