from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from database import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String(300), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    starts_at = Column(DateTime(timezone=True), nullable=False, index=True)
    ends_at = Column(DateTime(timezone=True), nullable=True, index=True)

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
