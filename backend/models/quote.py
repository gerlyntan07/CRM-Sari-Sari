from sqlalchemy import (
    Column, Integer, String, DateTime, func,
    ForeignKey, Numeric, Date, Text
)
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum
from .auth import User


class QuoteStatus(str, Enum):
    DRAFT = 'Draft'
    PRESENTED = 'Presented'
    ACCEPTED = 'Accepted'
    REJECTED = 'Rejected'


class ItemType(str, Enum):
    PRODUCT = 'Product'
    SERVICE = 'Service'


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)    
    quote_id = Column(String(20), unique=True, index=True, nullable=True)
    deal_id = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)    

    presented_date = Column(Date, nullable=True)
    validity_days = Column(Integer, nullable=True)
    status = Column(String, default=QuoteStatus.DRAFT.value, nullable=False)

    # Pricing summary (calculated from items)
    subtotal = Column(Numeric(12, 2), nullable=True, default=0)       # Sum of all line totals before tax
    tax_rate = Column(Numeric(5, 2), nullable=True, default=0)        # Tax percentage (e.g., 12.00 for 12%)
    tax_amount = Column(Numeric(12, 2), nullable=True, default=0)     # Calculated tax amount
    discount_type = Column(String(20), nullable=True)                  # 'percentage' or 'fixed'
    discount_value = Column(Numeric(12, 2), nullable=True, default=0) # Discount amount or percentage
    discount_amount = Column(Numeric(12, 2), nullable=True, default=0) # Calculated discount amount
    total_amount = Column(Numeric(12, 2), nullable=False)             # Final total after tax & discount
    
    currency = Column(String(3), default="PHP", nullable=False)       # Currency code (ISO 4217)
    notes = Column(String, nullable=True)              

    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)    

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    deal = relationship("Deal", back_populates="quotes")
    account = relationship("Account", back_populates="quotes")
    contact = relationship("Contact", back_populates="quotes")
    assigned_user = relationship("User", back_populates="quotes_assigned", foreign_keys=[assigned_to])
    creator = relationship("User", back_populates="quotes_created", foreign_keys=[created_by])
    comments = relationship("Comment", back_populates="quote", cascade="all, delete-orphan")
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan", order_by="QuoteItem.sort_order")

    def calculate_totals(self):
        """
        Recalculates subtotal, tax, discount, and total from line items.
        Call this after adding/updating/removing items.
        """
        from decimal import Decimal
        
        # Calculate subtotal from all items
        self.subtotal = sum(
            (item.line_total or Decimal('0')) for item in self.items
        ) if self.items else Decimal('0')
        
        # Calculate discount amount
        if self.discount_type == 'percentage' and self.discount_value:
            self.discount_amount = self.subtotal * (self.discount_value / Decimal('100'))
        elif self.discount_type == 'fixed' and self.discount_value:
            self.discount_amount = self.discount_value
        else:
            self.discount_amount = Decimal('0')
        
        # Subtotal after discount
        subtotal_after_discount = self.subtotal - self.discount_amount
        
        # Calculate tax
        if self.tax_rate:
            self.tax_amount = subtotal_after_discount * (self.tax_rate / Decimal('100'))
        else:
            self.tax_amount = Decimal('0')
        
        # Final total
        self.total_amount = subtotal_after_discount + self.tax_amount
        
        return self.total_amount

    def generate_quote_id(self, db, year_prefix: str = None):
        """
        Generates quote ID: QYY-companyID-00001
        Increment resets per company.
        """
        from datetime import datetime

        if not self.id:
            raise ValueError("Quote must be committed before generating quote_id (requires ID).")

        # Determine year
        year = year_prefix or datetime.now().strftime("%y")

        # Get company ID of the creator
        creator = db.query(User).filter(User.id == self.created_by).first()
        if not creator or not creator.related_to_company:
            raise ValueError("Creator must belong to a company to generate quote_id.")

        company_id = creator.related_to_company

        # Get last quote for this company
        last_quote = (
            db.query(Quote)
            .join(User, Quote.created_by == User.id)
            .filter(User.related_to_company == company_id)
            .filter(Quote.quote_id.like(f"Q{year}-{company_id}-%"))
            .order_by(Quote.quote_id.desc())
            .first()
        )

        if last_quote:
            last_number = int(last_quote.quote_id.split("-")[-1])
            next_number = last_number + 1
        else:
            next_number = 1

        # Format: Q25-1-00001
        self.quote_id = f"Q{year}-{company_id}-{next_number:05d}"

        return self.quote_id


class QuoteItem(Base):
    """
    Individual line item in a quote - represents a product or service.
    """
    __tablename__ = "quote_items"

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False)
    
    # Item details
    item_type = Column(String(20), default=ItemType.PRODUCT.value, nullable=False)  # 'Product' or 'Service'
    name = Column(String(255), nullable=False)                    # Product/Service name
    description = Column(Text, nullable=True)                     # Detailed description
    sku = Column(String(50), nullable=True)                       # Stock Keeping Unit / Item code
    variant = Column(String(100), nullable=True)                  # Size, color, version, etc.
    unit = Column(String(50), nullable=True)                      # Unit of measure (pcs, kg, hours, etc.)
    
    # Pricing
    quantity = Column(Numeric(10, 2), nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)           # Price per unit
    discount_percent = Column(Numeric(5, 2), nullable=True, default=0)  # Line item discount %
    discount_amount = Column(Numeric(12, 2), nullable=True, default=0)  # Calculated discount
    line_total = Column(Numeric(12, 2), nullable=False)           # (quantity * unit_price) - discount
    
    # Sorting & metadata
    sort_order = Column(Integer, default=0)                       # Order of items in the quote
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    quote = relationship("Quote", back_populates="items")

    def calculate_line_total(self):
        """
        Calculates the line total based on quantity, unit_price, and discount.
        """
        from decimal import Decimal
        
        subtotal = (self.quantity or Decimal('1')) * (self.unit_price or Decimal('0'))
        
        if self.discount_percent and self.discount_percent > 0:
            self.discount_amount = subtotal * (self.discount_percent / Decimal('100'))
        else:
            self.discount_amount = Decimal('0')
        
        self.line_total = subtotal - self.discount_amount
        return self.line_total

    def generate_sku(self, db):
        """
        Auto-generates SKU: ITM-YYMMDD-00001
        SKU is unique per day.
        """
        from datetime import datetime

        if not self.id:
            raise ValueError("QuoteItem must be committed before generating SKU (requires ID).")

        # If SKU already exists, don't regenerate
        if self.sku:
            return self.sku

        # Date prefix
        date_prefix = datetime.now().strftime("%y%m%d")

        # Get last item with same date prefix
        last_item = (
            db.query(QuoteItem)
            .filter(QuoteItem.sku.like(f"ITM-{date_prefix}-%"))
            .order_by(QuoteItem.sku.desc())
            .first()
        )

        if last_item and last_item.sku:
            try:
                last_number = int(last_item.sku.split("-")[-1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1

        # Format: ITM-260127-00001
        self.sku = f"ITM-{date_prefix}-{next_number:05d}"

        return self.sku