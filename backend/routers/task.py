from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session, selectinload
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
import traceback

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
    # --- AUTO-ASSIGN FOR SALES ROLE ---
    # If user has SALES role and no assigned_to is provided, assign to self
    assigned_to = payload.assigned_to
    if current_user.role.upper() == "SALES" and not assigned_to:
        assigned_to = current_user.id
    # ------------------------------------------

    # --- 1. NORMALIZE ENUM VALUES (THE FIX) ---
    # Map frontend inputs to enum objects
    priority_enum_map = {
        "HIGH": PriorityCategory.HIGH, 
        "NORMAL": PriorityCategory.NORMAL, 
        "LOW": PriorityCategory.LOW
    }
    
    status_enum_map = {
        "NOT_STARTED": StatusCategory.NOT_STARTED, 
        "NOT STARTED": StatusCategory.NOT_STARTED,
        "IN_PROGRESS": StatusCategory.IN_PROGRESS, 
        "IN PROGRESS": StatusCategory.IN_PROGRESS,
        "COMPLETED": StatusCategory.COMPLETED, 
        "DEFERRED": StatusCategory.DEFERRED
    }

    # Convert payload to Upper Case for lookup, fallback to original string if not found
    clean_priority = priority_enum_map.get(payload.priority.upper(), payload.priority)
    clean_status = status_enum_map.get(payload.status.upper(), payload.status)
    # ------------------------------------------

    assigned_user = None
    if assigned_to:
        assigned_user = db.query(User).filter(User.id == assigned_to).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")            

    new_task = Task(
        title=payload.title,
        description=payload.description,
        priority=clean_priority, # <--- Use the cleaned variable
        status=clean_status,     # <--- Use the cleaned variable
        due_date=payload.due_date,
        created_by=current_user.id,
        assigned_to=assigned_to,
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
@router.get("/all")
def get_all_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all tasks based on user role"""
    try:
        if current_user.role.upper() in ["CEO", "ADMIN"]:
            # Admins see all tasks in their company
            company_users = (
                db.query(User.id)
                .where(User.related_to_company == current_user.related_to_company)
                .subquery()
            )
            tasks = (
                db.query(Task)
                .options(
                    selectinload(Task.task_creator),
                    selectinload(Task.task_assign_to),
                    selectinload(Task.account),
                    selectinload(Task.contact),
                    selectinload(Task.lead),
                    selectinload(Task.deal),
                    selectinload(Task.quote)
                )
                .filter(
                    (Task.assigned_to.in_(company_users)) | (Task.created_by.in_(company_users))
                )
                .all()
            )
        elif current_user.role.upper() == "GROUP MANAGER":
            # Group managers see tasks for their company's non-admin users
            # But do NOT see archived (INACTIVE) tasks
            company_users = (
                db.query(User.id)
                .where(User.related_to_company == current_user.related_to_company)
                .where(~User.role.in_(["CEO", "ADMIN"]))
                .subquery()
            )
            tasks = (
                db.query(Task)
                .options(
                    selectinload(Task.task_creator),
                    selectinload(Task.task_assign_to),
                    selectinload(Task.account),
                    selectinload(Task.contact),
                    selectinload(Task.lead),
                    selectinload(Task.deal),
                    selectinload(Task.quote)
                )
                .filter(
                    (Task.assigned_to.in_(company_users)) | (Task.created_by.in_(company_users))
                )
                .filter(Task.status != StatusCategory.INACTIVE)
                .all()
            )
        elif current_user.role.upper() == "MANAGER":
            # Managers see tasks assigned to their territory users + their own tasks
            subquery_user_ids = (
                db.query(Territory.user_id)
                .filter(Territory.manager_id == current_user.id)
                .scalar_subquery()
            )

            tasks = (
                db.query(Task)
                .options(
                    selectinload(Task.task_creator),
                    selectinload(Task.task_assign_to),
                    selectinload(Task.account),
                    selectinload(Task.contact),
                    selectinload(Task.lead),
                    selectinload(Task.deal),
                    selectinload(Task.quote)
                )
                .filter(
                    (Task.assigned_to.in_(subquery_user_ids)) | 
                    (Task.assigned_to == current_user.id) |
                    (Task.created_by == current_user.id)
                ).all()
            )
        else:
            # SALES users - see only their own tasks (created or assigned)
            tasks = (
                db.query(Task)
                .options(
                    selectinload(Task.task_creator),
                    selectinload(Task.task_assign_to),
                    selectinload(Task.account),
                    selectinload(Task.contact),
                    selectinload(Task.lead),
                    selectinload(Task.deal),
                    selectinload(Task.quote)
                )
                .filter(
                    (Task.assigned_to == current_user.id) | (Task.created_by == current_user.id)
                )
                .all()
            )
            # Filter out INACTIVE tasks in Python to avoid SQLAlchemy enum binding issues
            tasks = [t for t in tasks if (t.status.value if hasattr(t.status, 'value') else t.status) != "INACTIVE"]

        # Convert to dict format - simple and clean
        result = []
        for task in tasks:
            try:
                # Get priority and status values safely
                priority_val = task.priority if task.priority else "Normal"
                if hasattr(priority_val, 'value'):
                    priority_val = priority_val.value
                
                status_val = task.status if task.status else "Not started"
                if hasattr(status_val, 'value'):
                    status_val = status_val.value
                
                task_dict = {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "priority": str(priority_val),
                    "status": str(status_val),
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "created_at": task.created_at.isoformat() if task.created_at else None,
                    "created_by": task.created_by,
                    "assigned_to": task.assigned_to,
                    "task_creator": {
                        "id": task.task_creator.id,
                        "first_name": task.task_creator.first_name,
                        "last_name": task.task_creator.last_name,
                        "email": task.task_creator.email,
                        "profile_picture": task.task_creator.profile_picture,
                        "role": task.task_creator.role,
                    } if task.task_creator else None,
                    "task_assign_to": {
                        "id": task.task_assign_to.id,
                        "first_name": task.task_assign_to.first_name,
                        "last_name": task.task_assign_to.last_name,
                        "email": task.task_assign_to.email,
                        "profile_picture": task.task_assign_to.profile_picture,
                        "role": task.task_assign_to.role,
                    } if task.task_assign_to else None,
                    "account": {
                        "id": task.account.id,
                        "name": task.account.name,
                    } if task.account else None,
                    "contact": {
                        "id": task.contact.id,
                        "first_name": task.contact.first_name,
                        "last_name": task.contact.last_name,
                        "email": task.contact.email,
                    } if task.contact else None,
                    "lead": {
                        "id": task.lead.id,
                        "title": task.lead.title,
                        "first_name": task.lead.first_name,
                        "last_name": task.lead.last_name,
                    } if task.lead else None,
                    "deal": {
                        "id": task.deal.id,
                        "deal_id": task.deal.deal_id,
                        "name": task.deal.name,
                    } if task.deal else None,
                    "quote": {
                        "id": task.quote.id,
                        "quote_id": task.quote.quote_id,
                    } if task.quote else None,
                }
                result.append(task_dict)
            except Exception as task_err:
                print(f"Error serializing task {task.id}: {str(task_err)}")
                traceback.print_exc()
                # Still try to add a minimal version
                result.append({
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "priority": "Normal",
                    "status": "Not started",
                    "due_date": None,
                    "created_at": None,
                    "created_by": task.created_by,
                    "assigned_to": task.assigned_to,
                })
        
        return result
        
    except Exception as e:
        print(f"Error in get_all_tasks: {str(e)}")
        traceback.print_exc()
        return []


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
    updates = payload.dict(exclude_unset=True)
    
    # AUTO-ASSIGN FOR SALES ROLE
    # If user has SALES role, force assignment to themselves
    if current_user.role.upper() == "SALES":
        updates['assigned_to'] = current_user.id
    
    for field, value in updates.items():
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
# -----------------------------------------
# DELETE TASK
# -----------------------------------------
@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Delete endpoint: SALES and GROUP MANAGER users archive, ADMINS hard delete"""
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        title = task.title
        old_data = serialize_instance(task)

        # GROUP MANAGER users archive (mark as INACTIVE) instead of hard delete
        if current_user.role.upper() == "GROUP MANAGER":
            if task.created_by != current_user.id:
                raise HTTPException(status_code=403, detail="Permission denied - you can only archive your own tasks")

            task.status = "INACTIVE"  # Raw string value
            db.flush()  # Flush changes but don't commit yet
            new_data = serialize_instance(task)

            create_audit_log(
                db=db,
                current_user=current_user,
                instance=task,
                action="UPDATE",
                request=request,
                old_data=old_data,
                new_data=new_data,
                custom_message=f"archive task '{title}'"
            )
            db.commit()
            return {"message": "Task archived successfully"}
        else:
            # Only Admin and other roles can hard delete
            old_data = serialize_instance(task)
            db.delete(task)
            db.flush()
            
            create_audit_log(
                db=db,
                current_user=current_user,
                instance=task,
                action="DELETE",
                request=request,
                old_data=old_data,
                custom_message=f"delete task '{title}'"
            )
            db.commit()
            return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting/archiving task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error archiving task: {str(e)}")


# -----------------------------------------
# BULK ARCHIVE TASKS (must come before single archive route)
# -----------------------------------------
@router.post("/bulk-archive", status_code=status.HTTP_200_OK)
def bulk_archive_tasks(
    data: TaskBulkDelete = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Archive multiple tasks (set status to INACTIVE) for GROUP MANAGER users only"""
    try:
        if current_user.role.upper() != "GROUP MANAGER":
            raise HTTPException(status_code=403, detail="Permission denied - only Group Manager can archive tasks")

        if not data.task_ids:
            return {"detail": "No tasks provided for archiving."}

        # GROUP MANAGER users - only allow archiving their own tasks
        if current_user.role.upper() == "GROUP MANAGER":
            tasks_to_archive = db.query(Task).filter(
                Task.id.in_(data.task_ids),
                Task.created_by == current_user.id
            ).all()
        else:
            # Should not reach here due to permission check above
            raise HTTPException(status_code=403, detail="Permission denied - only Group Manager can archive tasks")

        if not tasks_to_archive:
            raise HTTPException(status_code=404, detail="No matching tasks found for archiving. You can only archive tasks you created.")

        archived_count = 0
        for task in tasks_to_archive:
            old_data = serialize_instance(task)
            
            # Mark as INACTIVE using raw string value
            task.status = "INACTIVE"
            db.flush()  # Flush changes but don't commit yet
            new_data = serialize_instance(task)
            
            create_audit_log(
                db=db,
                current_user=current_user,
                instance=task,
                action="UPDATE",
                request=request,
                old_data=old_data,
                new_data=new_data,
                custom_message=f"archive task '{task.title}'"
            )
            archived_count += 1

        db.commit()

        return {"detail": f"Successfully archived {archived_count} task(s)."}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error bulk archiving tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error archiving tasks: {str(e)}")



# -----------------------------------------
# GET TASKS ASSIGNED TO CURRENT USER
# -----------------------------------------
@router.get("/assigned", response_model=List[TaskResponse])
def get_assigned_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(Task.assigned_to == current_user.id).all()
    
    # SALES users don't see INACTIVE tasks
    if current_user.role.upper() == "SALES":
        tasks = [t for t in tasks if (t.status.value if hasattr(t.status, 'value') else t.status) != "Inactive"]
    
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

    # SALES users don't see INACTIVE tasks
    if current_user.role.upper() == "SALES":
        tasks = [t for t in tasks if (t.status.value if hasattr(t.status, 'value') else t.status) != "Inactive"]

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
