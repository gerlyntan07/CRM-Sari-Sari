#backend/models/auth.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, UniqueConstraint, Table
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum

# Association table for many-to-many relationship between Account and Territory
account_territory_association = Table(
    'account_territory',
    Base.metadata,
    Column('account_id', Integer, ForeignKey('accounts.id', ondelete='CASCADE'), primary_key=True),
    Column('territory_id', Integer, ForeignKey('territories.id', ondelete='CASCADE'), primary_key=True)
)

class AccountStatus(str, Enum):
    ACTIVE = 'Active'
    INACTIVE = 'Inactive'
    PROSPECT = 'Prospect'
    CUSTOMER = 'Customer'
    PARTNER = "Partner"
    FORMER = 'Former'

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    parent_company = Column(String, nullable=True)
    website = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    billing_address = Column(String, nullable=True)
    shipping_address = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    status = Column(String, default=AccountStatus.PROSPECT.value, nullable=True)
    territory_id = Column(Integer, ForeignKey("territories.id", ondelete="SET NULL"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())    
        
    territory = relationship("Territory", back_populates="accounts", foreign_keys=[territory_id])
    territories = relationship("Territory", secondary=account_territory_association, back_populates="accounts_multi")

    assigned_accs = relationship("User", back_populates="accounts", foreign_keys=[assigned_to])
    acc_creator = relationship("User", back_populates="created_acc", foreign_keys=[created_by])
    contacts = relationship("Contact", back_populates="account", cascade="all, delete-orphan")

    deals = relationship("Deal", back_populates="account", cascade="all, delete-orphan")

    meetings = relationship("Meeting", back_populates="account", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="account", cascade="all, delete-orphan")
    calls = relationship("Call", back_populates="account", cascade="all, delete-orphan")

    quotes = relationship("Quote", back_populates="account", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="account", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="account", cascade="all, delete-orphan")
    soas = relationship("StatementOfAccount", back_populates="account", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="account", cascade="all, delete-orphan")