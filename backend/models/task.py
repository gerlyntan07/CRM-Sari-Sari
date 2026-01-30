from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, func, ForeignKey
from sqlalchemy.orm import relationship
import enum
from database import Base

class StatusCategory(str, enum.Enum):
    IN_PROGRESS = "In progress"
    COMPLETED = "Completed"
    DEFERRED = "Deferred"
    NOT_STARTED = "Not started"
    INACTIVE = "Inactive"
class PriorityCategory(str, enum.Enum):
    LOW = "Low"
    NORMAL = "Normal"
    HIGH = "High"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)    
    priority = Column(Enum(PriorityCategory), default=PriorityCategory.NORMAL, nullable=True)
    status = Column(Enum(StatusCategory), default=StatusCategory.NOT_STARTED, nullable=True)
    due_date = Column(DateTime, nullable=True)
    related_to_account = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True)
    related_to_contact = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=True)
    related_to_lead = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=True)
    related_to_deal = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=True)    
    related_to_quote = Column(Integer, ForeignKey("quotes.id", ondelete="CASCADE"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    account = relationship("Account", back_populates="tasks")
    contact = relationship("Contact", back_populates="tasks")
    lead = relationship("Lead", back_populates="tasks")
    deal = relationship("Deal", back_populates="tasks")
    quote = relationship("Quote", back_populates="tasks")
    task_creator = relationship("User", back_populates="tasks_created", foreign_keys=[created_by])
    task_assign_to = relationship("User", back_populates="tasks_assigned", foreign_keys=[assigned_to])      
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")  
