from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship

from database import Base


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(8), unique=True, index=True, nullable=False)
    manual_code = Column(String(8), nullable=False)
    code_length = Column(Integer, nullable=False, default=8)

    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    purpose = Column(String(50), nullable=False, default="CUSTOM")
    target_scope = Column(String(20), nullable=False, default="company")

    extend_days = Column(Integer, nullable=False, default=0)
    discount_percent = Column(Float, nullable=True)
    discount_amount = Column(Float, nullable=True)

    max_total_redemptions = Column(Integer, nullable=True)
    max_redemptions_per_company = Column(Integer, nullable=True, default=1)
    max_redemptions_per_user = Column(Integer, nullable=True, default=1)
    total_redemptions = Column(Integer, nullable=False, default=0)

    starts_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    qr_code_url = Column(String, nullable=True)
    extra_data = Column(JSON, nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)
    is_public = Column(Boolean, nullable=False, default=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    creator = relationship("User", back_populates="created_promos", foreign_keys=[created_by])
    redemptions = relationship("PromoRedemption", back_populates="promo", cascade="all, delete-orphan")


class PromoRedemption(Base):
    __tablename__ = "promo_redemptions"

    id = Column(Integer, primary_key=True, index=True)
    promo_id = Column(Integer, ForeignKey("promo_codes.id", ondelete="CASCADE"), nullable=False, index=True)
    promo_code_snapshot = Column(String(8), nullable=False)

    redeemed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    redeemed_for_company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)

    redemption_channel = Column(String(30), nullable=False, default="account")
    applied_effect = Column(String(255), nullable=True)
    discount_applied = Column(Float, nullable=True)
    days_extended = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    promo = relationship("PromoCode", back_populates="redemptions")
    redeemer = relationship("User", back_populates="promo_redemptions", foreign_keys=[redeemed_by_user_id])
    company = relationship("Company", back_populates="promo_redemptions", foreign_keys=[redeemed_for_company_id])
