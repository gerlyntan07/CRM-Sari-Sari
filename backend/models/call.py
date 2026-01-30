from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, func, ForeignKey
from sqlalchemy.orm import relationship
import enum
from database import Base

class CallDirection(str, enum.Enum):
    INCOMING = "Incoming"
    OUTGOING = "Outgoing"

class CallStatus(str, enum.Enum):
    PLANNED = "Planned"
    HELD = "Held"
    NOT_HELD = "Not held"    
    INACTIVE = "Inactive"

class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)    
    subject = Column(String(255), nullable=False)
    call_time = Column(DateTime(timezone=True), default=func.now())
    duration_minutes = Column(Integer, nullable=True)
    direction = Column(Enum(CallDirection), default=CallDirection.OUTGOING, nullable=True)
    status = Column(Enum(CallStatus), default=CallStatus.PLANNED, nullable=True)
    notes = Column(Text, nullable=True)
    related_to_account = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True)
    related_to_contact = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=True)
    related_to_lead = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=True)
    related_to_deal = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    account = relationship("Account", back_populates="calls")
    contact = relationship("Contact", back_populates="calls")
    lead = relationship("Lead", back_populates="calls")
    deal = relationship("Deal", back_populates="calls")
    call_creator = relationship("User", back_populates="calls_created", foreign_keys=[created_by])
    call_assign_to = relationship("User", back_populates="calls_assigned", foreign_keys=[assigned_to])      
    comments = relationship("Comment", back_populates="call", cascade="all, delete-orphan")  
