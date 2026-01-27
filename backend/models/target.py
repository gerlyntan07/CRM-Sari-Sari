from sqlalchemy import Column, Integer, Date, DateTime, func, ForeignKey, Numeric, String, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum


class PeriodType(str, enum.Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    SEMIANNUAL = "SEMIANNUAL"
    ANNUAL = "ANNUAL"
    CUSTOM = "CUSTOM"


class Target(Base):
    __tablename__ = "targets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    target_amount = Column(Numeric(14, 2), nullable=False)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    
    # New fields for period tracking
    period_type = Column(String(20), default="CUSTOM", nullable=False, index=True)
    period_year = Column(Integer, nullable=True, index=True)  # e.g., 2026
    period_number = Column(Integer, nullable=True)  # e.g., Q1=1, Q2=2, etc.

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="targets")
