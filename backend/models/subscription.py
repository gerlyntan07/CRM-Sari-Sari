#backend/models/subscription.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum
from datetime import datetime, timedelta

class PlanName(str, Enum):
    FREE = "Free"
    BASIC = "Basic"
    PRO = "Pro"

class StatusList(str, Enum):
    ACTIVE = "Active"
    CANCELLED = "Cancelled"
    EXPIRED = "Expired"

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    plan_name = Column(String, default=PlanName.FREE.value, nullable=False)
    price = Column(Float, default=0.00, nullable=False)
    status = Column(String, default=StatusList.ACTIVE.value, nullable=False)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), default=lambda: datetime.utcnow() + timedelta(days=15))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    subscriber = relationship("Company", back_populates="plan", passive_deletes=True)
