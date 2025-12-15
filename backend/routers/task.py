from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Tuple
from sqlalchemy import or_

from database import get_db
from models.task import Task, TaskStatus, TaskPriority
from models.auth import User
from schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskFetch
from .auth_utils import get_current_user
from routers.ws_notification import broadcast_notification

router = APIRouter(prefix="/tasks", tags=["Tasks"])

RELATED_TYPES = {"Account", "Contact", "Lead", "Deal"}

def infer_related_type_and_id(task: Task) -> Tuple[Optional[str], Optional[int]]:
    if task.related_to_account:
        return "Account", task.related_to_account
    if task.related_to_contact:
        return "Contact", task.related_to_contact
    if task.related_to_lead:
        return "Lead", task.related_to_lead
    if task.related_to_deal:
        return "Deal", task.related_to_deal
    return None, None

def task_to_response(task: Task) -> dict:
    assigned_name = None
    if getattr(task, "task_assign_to", None):
        assigned_name = f"{task.task_assign_to.first_name} {task.task_assign_to.last_name}"

    created_by_name = None
    if getattr(task, "task_creator", None):
        created_by_name = f"{task.task_creator.first_name} {task.task_creator.last_name}"

    related_type, related_to = infer_related_type_and_id(task)

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,

        "type": related_type,  # ✅ inferred

        "priority": task.priority.value if hasattr(task.priority, "value") else task.priority,
        "status": task.status.value if hasattr(task.status, "value") else task.status,

        "dueDate": task.due_date.isoformat() if task.due_date else None,
        "dateAssigned": task.created_at.isoformat() if task.created_at else None,

        "assignedTo": task.assigned_to,
        "assignedToName": assigned_name,

        "createdById": task.created_by,
        "createdBy": created_by_name or ("System" if task.created_by is None else str(task.created_by)),

        "relatedTo": related_to,
        "notes": None,

        "createdAt": task.created_at.isoformat() if task.created_at else None,
    }

def normalize_priority(v: str) -> TaskPriority:
    try:
        return TaskPriority(v)
    except Exception:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid priority '{v}'. Allowed: {[e.value for e in TaskPriority]}",
        )

def normalize_status(v: str) -> TaskStatus:
    try:
        return TaskStatus(v)
    except Exception:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status '{v}'. Allowed: {[e.value for e in TaskStatus]}",
        )

def clear_related(task: Task):
    task.related_to_account = None
    task.related_to_contact = None
    task.related_to_lead = None
    task.related_to_deal = None

def apply_related(task: Task, related_type: Optional[str], related_id: Optional[int]):
    clear_related(task)
    if not related_type or related_id is None:
        return
    if related_type == "Account":
        task.related_to_account = related_id
    elif related_type == "Contact":
        task.related_to_contact = related_id
    elif related_type == "Lead":
        task.related_to_lead = related_id
    elif related_type == "Deal":
        task.related_to_deal = related_id


@router.post("/createtask", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ✅ validate assigned user (use is not None, not truthy)
    if payload.assignedTo is not None:
        assigned_user = db.query(User).filter(User.id == payload.assignedTo).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")

    # ✅ validate enums
    priority_enum = normalize_priority(payload.priority)
    status_enum = normalize_status(payload.status)

    # ✅ related validation (only when relatedTo is provided)
    related_type = payload.type.strip() if payload.type else None
    if payload.relatedTo is not None:
        if not related_type or related_type not in RELATED_TYPES:
            raise HTTPException(status_code=422, detail="Invalid type. Use Account/Contact/Lead/Deal.")

    db_task = Task(
        title=payload.title,
        description=payload.description,
        priority=priority_enum,     # ✅ store Enum
        status=status_enum,         # ✅ store Enum
        due_date=payload.dueDate,
        created_by=current_user.id,
        assigned_to=payload.assignedTo,
    )

    apply_related(db_task, related_type, payload.relatedTo)

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # load relations for response / notification text
    db_task = (
        db.query(Task)
        .options(joinedload(Task.task_creator), joinedload(Task.task_assign_to))
        .filter(Task.id == db_task.id)
        .first()
    )

    # 🔔 notify assigned user
    if payload.assignedTo is not None:
        await broadcast_notification(
            {
                "type": "task_assignment",
                "taskId": db_task.id,
                "title": db_task.title,
                "priority": db_task.priority.value if db_task.priority else None,
                "assignedBy": f"{current_user.first_name} {current_user.last_name}",
                "createdAt": db_task.created_at.isoformat() if db_task.created_at else None,
            },
            target_user_id=payload.assignedTo
        )

    return task_to_response(db_task)


@router.get("/all", response_model=List[TaskFetch])
def get_all_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    company_user_ids = [
        r[0]
        for r in db.query(User.id)
        .filter(User.related_to_company == current_user.related_to_company)
        .all()
    ]

    q = db.query(Task)

    if current_user.role in ["CEO", "Admin", "Group Manager"]:
        q = q.filter(or_(Task.created_by.in_(company_user_ids), Task.assigned_to.in_(company_user_ids)))
    else:
        q = q.filter(or_(Task.created_by == current_user.id, Task.assigned_to == current_user.id))

    return q.order_by(Task.created_at.desc()).all()


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(Task)
        .options(joinedload(Task.task_creator), joinedload(Task.task_assign_to))
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    data = payload.dict(exclude_unset=True)

    if "title" in data:
        task.title = data["title"]
    if "description" in data:
        task.description = data["description"]

    if "priority" in data and data["priority"] is not None:
        task.priority = normalize_priority(data["priority"])
    if "status" in data and data["status"] is not None:
        task.status = normalize_status(data["status"])

    # ✅ camelCase → snake_case
    if "dueDate" in data:
        task.due_date = data["dueDate"]
    if "assignedTo" in data:
        task.assigned_to = data["assignedTo"]

    # ✅ related update
    existing_type, _ = infer_related_type_and_id(task)
    related_type = existing_type

    if "type" in data:
        related_type = data["type"].strip() if data["type"] else None

    if "relatedTo" in data:
        if data["relatedTo"] is not None and (not related_type or related_type not in RELATED_TYPES):
            raise HTTPException(status_code=422, detail="Invalid type. Use Account/Contact/Lead/Deal.")
        apply_related(task, related_type, data["relatedTo"])
    elif "type" in data:
        apply_related(task, related_type, None)

    db.commit()
    db.refresh(task)
    return task_to_response(task)


@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


@router.get("/assigned", response_model=List[TaskResponse])
def get_assigned_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = (
        db.query(Task)
        .options(joinedload(Task.task_creator), joinedload(Task.task_assign_to))
        .filter(Task.assigned_to == current_user.id)
        .order_by(Task.created_at.desc())
        .all()
    )
    return [task_to_response(t) for t in tasks]


@router.get("/notifications")
def get_task_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = (
        db.query(Task)
        .options(joinedload(Task.task_creator))
        .filter(Task.assigned_to == current_user.id)
        .order_by(Task.created_at.desc())
        .all()
    )

    out = []
    for t in tasks:
        related_type, _ = infer_related_type_and_id(t)
        out.append(
            {
                "id": t.id,
                "title": t.title,
                "type": related_type,
                "priority": t.priority.value if hasattr(t.priority, "value") else t.priority,
                "createdAt": t.created_at.isoformat() if t.created_at else None,
                "assignedBy": (
                    f"{t.task_creator.first_name} {t.task_creator.last_name}"
                    if t.task_creator else None
                ),
            }
        )
    return out
