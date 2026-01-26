from sqlalchemy import (
    Column, Integer, String, DateTime, func,
    ForeignKey, Numeric, Date
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

    total_amount = Column(Numeric(12, 2), nullable=False)
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

    # contact = relationship("Contact", foreign_keys=[contact_id])
    # account = relationship("Account", foreign_keys=[account_id])
    # assigned_user = relationship("User", back_populates="assigned_quotes", foreign_keys=[assigned_to])
    # creator = relationship("User", back_populates="created_quotes", foreign_keys=[created_by])

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