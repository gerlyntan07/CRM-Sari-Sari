from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.auditlog import LogBase, LeadResponse
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from models.auditlog import Auditlog
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
    elif current_user.role in ["Group Manager", "Manager"]:
        logs = (
            db.query(Auditlog)
            .join(User, Auditlog.user_id == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .all()
        )

    # Other roles: get only their own logs
    else:
        logs = (
            db.query(Auditlog)
            .filter(Auditlog.user_id == current_user.id)
            .all()
        )

    return logs
