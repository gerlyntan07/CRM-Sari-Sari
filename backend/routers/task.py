from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from sqlalchemy import or_
from database import get_db
from models.task import Task, PriorityCategory, StatusCategory
from models.auth import User
from schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskFetch
from .auth_utils import get_current_user
from routers.ws_notification import broadcast_notification  # WebSocket broadcaster
from models.account import Account
from models.contact import Contact
from models.lead import Lead
from .logs_utils import serialize_instance, create_audit_log
from models.deal import Deal
from models.territory import Territory

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
@router.post("/create", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):    
    # --- 1. NORMALIZE ENUM VALUES (THE FIX) ---
    # Defines valid DB values mapped from possible uppercase frontend inputs
    priority_map = {
        "HIGH": "High", "NORMAL": "Normal", "LOW": "Low"
    }
    
    status_map = {
        "NOT_STARTED": "Not started", "NOT STARTED": "Not started",
        "IN_PROGRESS": "In progress", "IN PROGRESS": "In progress",
        "COMPLETED": "Completed", "DEFERRED": "Deferred"
    }

    # Convert payload to Upper Case for lookup, fallback to original if not found
    clean_priority = priority_map.get(payload.priority.upper(), payload.priority)
    clean_status = status_map.get(payload.status.upper(), payload.status)
    # ------------------------------------------

    assigned_user = None
    if payload.assigned_to:
        assigned_user = db.query(User).filter(User.id == payload.assigned_to).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")            

    new_task = Task(
        title=payload.title,
        description=payload.description,
        priority=clean_priority, # <--- Use the cleaned variable
        status=clean_status,     # <--- Use the cleaned variable
        due_date=payload.due_date,
        created_by=current_user.id,
        assigned_to=payload.assigned_to,
    )

    # Primary relation validation and assignment
    if getattr(payload, 'related_type_1', None) == "Lead":
        lead = db.query(Lead).filter(Lead.id == payload.related_to_1).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        new_task.related_to_lead = payload.related_to_1
        new_task.related_to_account = None
        new_task.related_to_contact = None
        new_task.related_to_deal = None
    elif getattr(payload, 'related_type_1', None) == "Account":
        account = db.query(Account).filter(Account.id == payload.related_to_1).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        new_task.related_to_account = payload.related_to_1
        # Secondary relation (only valid when Account)
        if getattr(payload, 'related_type_2', None) == "Contact" and payload.related_to_2:
            contact = db.query(Contact).filter(Contact.id == payload.related_to_2).first()
            if not contact:
                raise HTTPException(status_code=404, detail="Contact not found")
            new_task.related_to_contact = payload.related_to_2
            new_task.related_to_deal = None
        elif getattr(payload, 'related_type_2', None) == "Deal" and payload.related_to_2:
            deal = db.query(Deal).filter(Deal.id == payload.related_to_2).first()
            if not deal:
                raise HTTPException(status_code=404, detail="Deal not found")
            new_task.related_to_deal = payload.related_to_2
            new_task.related_to_contact = None
        else:
            new_task.related_to_contact = None
            new_task.related_to_deal = None
    else:
        raise HTTPException(status_code=400, detail="Invalid related_type_1. Must be 'Lead' or 'Account'.")
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_task,
        action="CREATE",
        request=request,
        new_data=serialize_instance(new_task),
        custom_message=f"create task '{new_task.title}'"
    )

    return new_task


# -----------------------------------------
# GET ALL TASKS
# -----------------------------------------
@router.get("/all", response_model=List[TaskFetch])
def get_all_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all meetings for admin users"""
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        tasks = (
            db.query(Task)
            .join(User, Task.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif current_user.role.upper() == "GROUP MANAGER":
        tasks = (
            db.query(Task)
            .join(User, Task.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .all()
        )
    elif current_user.role.upper() == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )

        tasks = (
            db.query(Task)
            .join(User, Task.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                (User.id.in_(subquery_user_ids)) | 
                (Task.assigned_to == current_user.id) | # Leads owned by manager
                (Task.created_by == current_user.id)
            ).all()
        )
    else:
        tasks = (
            db.query(Task)
            .filter(
                (Task.assigned_to == current_user.id) | 
                (Task.created_by == current_user.id)
            ).all()
        )

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
    return task


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
