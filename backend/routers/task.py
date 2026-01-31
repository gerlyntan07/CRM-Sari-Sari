from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from sqlalchemy import or_
from database import get_db
from models.task import Task, PriorityCategory, StatusCategory
from models.auth import User
from schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskFetch, TaskBulkDelete
from .auth_utils import get_current_user
from routers.ws_notification import broadcast_notification  # WebSocket broadcaster
from models.account import Account
from models.contact import Contact
from models.lead import Lead
from models.quote import Quote
from .logs_utils import serialize_instance, create_audit_log
from models.deal import Deal
from models.territory import Territory

router = APIRouter(prefix="/tasks", tags=["Tasks"])

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER", "SALES"}


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
        task.related_to_deal or
        task.related_to_quote
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
        new_task.related_to_quote = None
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
            new_task.related_to_quote = None
        elif getattr(payload, 'related_type_2', None) == "Deal" and payload.related_to_2:
            deal = db.query(Deal).filter(Deal.id == payload.related_to_2).first()
            if not deal:
                raise HTTPException(status_code=404, detail="Deal not found")
            new_task.related_to_deal = payload.related_to_2
            new_task.related_to_contact = None
            new_task.related_to_quote = None
        elif getattr(payload, 'related_type_2', None) == "Quote" and payload.related_to_2:
            quote = db.query(Quote).filter(Quote.id == payload.related_to_2).first()
            if not quote:
                raise HTTPException(status_code=404, detail="Quote not found")
            new_task.related_to_quote = payload.related_to_2
            new_task.related_to_contact = None
            new_task.related_to_deal = None
        else:
            new_task.related_to_contact = None
            new_task.related_to_deal = None
            new_task.related_to_quote = None
    else:
        raise HTTPException(status_code=400, detail="Invalid related_type_1. Must be 'Lead' or 'Account'.")
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # --- Save notification to database AND send WebSocket notification ---
    if new_task.assigned_to:
        notification_data = {
            "type": "task_assignment",
            "task_id": new_task.id,
            "task_title": new_task.title,
            "taskId": new_task.id,
            "taskTitle": new_task.title,
            "message": f"New task assigned: {new_task.title}",
            "assigned_by": f"{current_user.first_name} {current_user.last_name}",
            "timestamp": datetime.now().isoformat()
        }
        
        # Create audit log entry for the notification (saved to database)
        # The target user_id is the assigned sales rep
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=new_task,
            action="TASK_ASSIGNMENT",
            request=request,
            new_data=serialize_instance(new_task),
            custom_message=f"Task assigned to {assigned_user.first_name} {assigned_user.last_name}",
            target_user_id=new_task.assigned_to  # This makes it appear in assigned user's notification list
        )
        
        # Send real-time WebSocket notification
        await broadcast_notification(notification_data, new_task.assigned_to)

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
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Store the old status to detect changes
    old_status = task.status.value if hasattr(task.status, "value") else task.status
    
    # Apply updates
    for field, value in payload.dict(exclude_unset=True).items():
        if hasattr(task, field):
            setattr(task, field, value)

    db.commit()
    db.refresh(task)
    
    # Get the new status
    new_status = task.status.value if hasattr(task.status, "value") else task.status
    
    # If status changed and task has a creator, save to DB and notify the creator
    if old_status != new_status and task.created_by:
        notification_data = {
            "type": "task_status_updated",
            "task_id": task.id,
            "task_title": task.title,
            "old_status": old_status,
            "new_status": new_status,
            "updated_by": f"{current_user.first_name} {current_user.last_name}",
            "message": f"Task '{task.title}' status changed from {old_status} to {new_status}",
            "timestamp": datetime.now().isoformat()
        }
        
        # Save notification to database
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=task,
            action="TASK_STATUS_UPDATE",
            request=None,
            new_data=serialize_instance(task),
            custom_message=f"Task status changed from {old_status} to {new_status}",
            target_user_id=task.created_by  # Notify the task creator
        )
        
        # Send real-time WebSocket notification
        await broadcast_notification(notification_data, task.created_by)
    
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


@router.delete("/admin/bulk-delete", status_code=status.HTTP_200_OK)
def admin_bulk_delete_tasks(
    data: TaskBulkDelete = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not data.task_ids:
        return {"detail": "No tasks provided for deletion."}

    company_users = (
        db.query(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    tasks_to_delete = db.query(Task).filter(
        Task.id.in_(data.task_ids),
        ((Task.created_by.in_(company_users)) | (Task.assigned_to.in_(company_users)))
    ).all()

    if not tasks_to_delete:
        raise HTTPException(status_code=404, detail="No matching tasks found for deletion.")

    deleted_count = 0
    for task in tasks_to_delete:
        deleted_data = serialize_instance(task)
        task_name = task.title
        target_user_id = task.assigned_to or task.created_by

        db.delete(task)
        
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=task,
            action="DELETE",
            request=request,
            old_data=deleted_data,
            target_user_id=target_user_id,
            custom_message=f"bulk delete task '{task_name}' via admin panel"
        )
        deleted_count += 1

    db.commit()

    return {"detail": f"Successfully deleted {deleted_count} task(s)."}
