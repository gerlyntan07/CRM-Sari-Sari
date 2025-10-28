from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models.task import Task, TaskStatus, TaskPriority
from models.auth import User
from schemas.task import TaskCreate, TaskUpdate, TaskResponse
from .auth_utils import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])


# ✅ Helper: convert DB Task → API-friendly JSON
def task_to_response(task: Task) -> dict:
    # ✅ Get full name if assigned user exists
    assigned_name = None
    if task.assigned_user:
        assigned_name = f"{task.assigned_user.first_name} {task.assigned_user.last_name}"
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "type": task.type,
        "priority": task.priority.value if isinstance(task.priority, TaskPriority) else task.priority,
        "status": task.status.value if isinstance(task.status, TaskStatus) else task.status,
        "dueDate": task.due_date.isoformat() if task.due_date else None,
        "dateAssigned": task.date_assigned.isoformat() if task.date_assigned else None,
        "assignedTo": assigned_name,  # ✅ full name instead of ID
        "relatedTo": task.related_to,
        "notes": task.notes,
        "createdAt": task.created_at.isoformat() if task.created_at else None,
    }


# ✅ CREATE task
@router.post("/createtask", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    # Validate assigned user (optional but good practice)
    if payload.assigned_to:
        user = db.query(User).filter(User.id == payload.assigned_to).first()
        if not user:
            raise HTTPException(status_code=404, detail="Assigned user not found")

    db_task = Task(
        title=payload.title,
        description=payload.description,
        type=payload.type,
        priority=payload.priority or "Medium",
        status=payload.status or "To Do",
        due_date=payload.due_date,
        date_assigned=datetime.now(),
        assigned_to=payload.assigned_to,  # still store ID
        related_to=payload.related_to,
        notes=payload.notes,
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return task_to_response(db_task)


# ✅ GET all tasks
@router.get("/all", response_model=List[TaskResponse])
def get_all_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    return [task_to_response(t) for t in tasks]


# ✅ UPDATE task
@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in payload.dict(exclude_unset=True).items():
        if hasattr(task, field):
            setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task_to_response(task)


# ✅ DELETE task
@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


# ✅ Get tasks assigned to the current user
@router.get("/assigned", response_model=List[TaskResponse])
def get_assigned_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(Task.assigned_to == current_user.id).all()
    return [task_to_response(t) for t in tasks]
