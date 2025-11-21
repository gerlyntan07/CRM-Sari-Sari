from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

class TargetStatus(str, Enum):
    ACTIVE = 'ACTIVE'
    INACTIVE = 'INACTIVE'

class Target(Base):
    __tablename__ = "targets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    period = Column(String, nullable=False)  # Format: YYYY-MM
    target_amount = Column(Numeric(10, 2), nullable=False)
    achieved = Column(Numeric(10, 2), default=0, nullable=False)
    status = Column(String, default=TargetStatus.ACTIVE.value, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="targets", foreign_keys=[user_id])
    creator = relationship("User", back_populates="created_targets", foreign_keys=[created_by])

