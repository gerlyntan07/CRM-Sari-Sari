from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from sqlalchemy import or_
from database import get_db
from models.task import Task, TaskStatus, TaskPriority
from models.auth import User
from schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskFetch
from .auth_utils import get_current_user
from routers.ws_notification import broadcast_notification  # WebSocket broadcaster
from models.task import TaskPriority, TaskStatus

router = APIRouter(prefix="/tasks", tags=["Tasks"])


# -----------------------------------------
# Helper: Convert DB Task → Response Format
# -----------------------------------------
def task_to_response(task: Task) -> dict:
    # Assigned user name
    assigned_name = None
    if task.task_assign_to:
        assigned_name = f"{task.task_assign_to.first_name} {task.task_assign_to.last_name}"

    # Determine relatedTo (based on which foreign key is filled)
    related_to = (
        task.related_to_account or
        task.related_to_contact or
        task.related_to_lead or
        task.related_to_deal
    )

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "type": None,  # Your model has no 'type' column
        "priority": task.priority.value if hasattr(task.priority, "value") else task.priority,
        "status": task.status.value if hasattr(task.status, "value") else task.status,
        "dueDate": task.due_date.isoformat() if task.due_date else None,
        "dateAssigned": task.created_at.isoformat() if task.created_at else None,
        "assignedTo": task.assigned_to,        # ID
        "assignedToName": assigned_name,       # Human readable
        "relatedTo": related_to,
        "notes": None,  # Model has no notes column
        "createdAt": task.created_at.isoformat() if task.created_at else None,
    }



# -----------------------------------------
# CREATE TASK + SEND NOTIFICATION
# -----------------------------------------
@router.post("/createtask", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate assigned user
    assigned_user = None
    if payload.assignedTo:
        assigned_user = db.query(User).filter(User.id == payload.assignedTo).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
    
    priority_value = TaskPriority(payload.priority).value
    status_value = TaskStatus(payload.status).value

    # Build task data
    task_data = {
        "title": payload.title,
        "description": payload.description,
        "priority": priority_value,
        "status": status_value,
        "due_date": payload.dueDate,
        "created_by": current_user.id,
        "assigned_to": payload.assignedTo
    }

    # Related-to logic
    if payload.type == "Account":
        task_data["related_to_account"] = payload.relatedTo
    elif payload.type == "Contact":
        task_data["related_to_contact"] = payload.relatedTo
    elif payload.type == "Lead":
        task_data["related_to_lead"] = payload.relatedTo
    elif payload.type == "Deal":
        task_data["related_to_deal"] = payload.relatedTo

    # Create task
    db_task = Task(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # -----------------------------------------
    # 🔔 SEND WEBSOCKET NOTIFICATION (FIXED)
    # -----------------------------------------
    if payload.assignedTo:
        await broadcast_notification(
            {
                "type": "task_assignment",
                "taskId": db_task.id,
                "title": db_task.title,
                "priority": priority_value,
                "assignedBy": f"{current_user.first_name} {current_user.last_name}",
                "createdAt": db_task.created_at.isoformat(),
            },
            target_user_id=payload.assignedTo
        )

    return task_to_response(db_task)


# -----------------------------------------
# GET ALL TASKS
# -----------------------------------------
@router.get("/all", response_model=List[TaskFetch])
def get_all_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    company_users = (
        db.query(User.id)
        .filter(User.related_to_company == current_user.related_to_company)
    )

    if current_user.role in ['CEO', 'Admin', 'Group Manager']:
        tasks = db.query(Task).filter(or_(Task.created_by.in_(company_users),Task.assigned_to.in_(company_users))).all()
    elif current_user.role in ['Manager', 'Sales']:
        tasks = db.query(Task).filter(or_(Task.created_by == current_user.id,Task.assigned_to == current_user.id)).all()
    return tasks


# -----------------------------------------
# UPDATE TASK
# -----------------------------------------
@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Apply updates
    for field, value in payload.dict(exclude_unset=True).items():
        if hasattr(task, field):
            setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task_to_response(task)


# -----------------------------------------
# DELETE TASK
# -----------------------------------------
@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


# -----------------------------------------
# GET TASKS ASSIGNED TO CURRENT USER
# -----------------------------------------
@router.get("/assigned", response_model=List[TaskResponse])
def get_assigned_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(Task.assigned_to == current_user.id).all()
    return [task_to_response(t) for t in tasks]


# -----------------------------------------
# NOTIFICATION LIST (Optional for UI)
# -----------------------------------------
@router.get("/notifications")
def get_task_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = (
        db.query(Task)
        .filter(Task.assigned_to == current_user.id)
        .order_by(Task.created_at.desc())
        .all()
    )

    return [
        {
            "id": t.id,
            "title": t.title,
            "type": t.type,
            "priority": t.priority.value if hasattr(t.priority, "value") else t.priority,
            "createdAt": t.created_at.isoformat(),
            "assignedBy": (
                f"{t.assigned_by_user.first_name} {t.assigned_by_user.last_name}"
                if hasattr(t, "assigned_by_user") and t.assigned_by_user
                else None
            ),
        }
        for t in tasks
    ]
