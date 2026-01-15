# backend/routers/account.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional

from database import get_db
from schemas.account import AccountActivityResponse
from .auth_utils import get_current_user
from models.auth import User
from models.task import Task
from models.call import Call
from models.meeting import Meeting
from models.account import Account, AccountStatus
from models.territory import Territory
from models.contact import Contact
from .logs_utils import serialize_instance, create_audit_log
from .ws_notification import broadcast_notification


router = APIRouter(prefix="/activities", tags=["Activities"])

@router.get('/accounts/{account_id}/activities')
def get_account_activities(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(Task.related_to_account == account_id).all()
    calls = db.query(Call).filter(Call.related_to_account == account_id).all()
    meetings = db.query(Meeting).filter(Meeting.related_to_account == account_id).all()      

    return {
        "tasks": tasks,
        "calls": calls,
        "meetings": meetings
    }      