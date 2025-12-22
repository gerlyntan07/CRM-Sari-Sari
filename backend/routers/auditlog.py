# backend/routers/auditlog.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.auditlog import LogBase, LeadResponse
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from models.auditlog import Auditlog
from models.territory import Territory
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/logs",
    tags=["Logs"]
)

@router.get("/read-all", response_model=List[LeadResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # CEO or Admin: get all logs from the same company (including themselves)
    if current_user.role in ["CEO", "Admin"]:
        logs = (
            db.query(Auditlog)
            .join(User, Auditlog.user_id == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )

    # Group Manager or Manager: get all logs in company, excluding CEO/Admin logs
    elif current_user.role in ["Group Manager"]:
        logs = (
            db.query(Auditlog)
            .join(User, Auditlog.user_id == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .all()
        )
    elif current_user.role in ["Manager"]:
        # 1. Identify all users (Sales/Marketing) assigned to territories managed by this Manager
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )

        # 2. Fetch logs of those users + the Manager's own logs
        logs = (
            db.query(Auditlog)
            .join(User, Auditlog.user_id == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            # Filter: The log must belong to a user in the managed territory OR the manager themselves
            .filter(
                (Auditlog.user_id.in_(subquery_user_ids)) | 
                (Auditlog.user_id == current_user.id)
            )
            .all()
        )
    else:
        logs = (
            db.query(Auditlog)
            .filter(Auditlog.user_id == current_user.id)
            .all()
        )    

    return logs

@router.patch("/mark-read/{log_id}")
def mark_log_as_read(
    log_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Find the log that belongs to this user
    log = db.query(Auditlog).filter(
        Auditlog.id == log_id, 
        Auditlog.user_id == current_user.id
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    log.is_read = True
    db.commit()
    return {"status": "success"}