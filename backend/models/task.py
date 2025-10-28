from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, func, ForeignKey
from sqlalchemy.orm import relationship
import enum
from database import Base
from models.auth import User  # 👈 important


class TaskStatus(str, enum.Enum):
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    REVIEW = "Review"
    COMPLETED = "Completed"

class TaskPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(100), nullable=True)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    due_date = Column(DateTime, nullable=True)
    date_assigned = Column(DateTime, nullable=True)

    # ✅ Make assigned_to a ForeignKey to User
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)

    related_to = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ✅ Relationship to User model
    assigned_user = relationship("User", back_populates="tasks_assigned", foreign_keys=[assigned_to])
