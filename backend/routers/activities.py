# backend/routers/activities.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_
from typing import Optional, List

from database import get_db
from schemas.activities import AccountActivityResponse, ContactActivityResponse, LeadActivityResponse, DealActivityResponse
from .auth_utils import get_current_user
from models.auth import User
from models.task import Task
from models.call import Call
from models.meeting import Meeting
from models.quote import Quote
from models.deal import Deal
from models.contact import Contact
from models.territory import Territory
from .logs_utils import serialize_instance, create_audit_log
from .ws_notification import broadcast_notification


router = APIRouter(prefix="/activities", tags=["Activities"])


# -----------------------------------------
# HELPER FUNCTIONS FOR ROLE-BASED FILTERING
# -----------------------------------------

def get_role_filtered_tasks(db: Session, current_user: User, base_filter) -> List[Task]:
    """Apply role-based restrictions to task queries."""
    role = current_user.role.upper()
    
    if role in ["CEO", "ADMIN"]:
        # CEO/Admin can see all tasks within their company
        return (
            db.query(Task)
            .join(User, Task.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif role == "GROUP MANAGER":
        # Group Manager can see all except CEO/Admin within their company
        return (
            db.query(Task)
            .join(User, Task.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .all()
        )
    elif role == "MANAGER":
        # Manager can see their own + users in their territory
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )
        return (
            db.query(Task)
            .join(User, Task.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                or_(
                    User.id.in_(subquery_user_ids),
                    Task.assigned_to == current_user.id,
                    Task.created_by == current_user.id
                )
            ).all()
        )
    else:
        # Sales/Others can only see their own tasks
        return (
            db.query(Task)
            .filter(base_filter)
            .filter(
                or_(
                    Task.assigned_to == current_user.id,
                    Task.created_by == current_user.id
                )
            ).all()
        )


def get_role_filtered_calls(db: Session, current_user: User, base_filter) -> List[Call]:
    """Apply role-based restrictions to call queries."""
    role = current_user.role.upper()
    
    if role in ["CEO", "ADMIN"]:
        return (
            db.query(Call)
            .join(User, Call.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif role == "GROUP MANAGER":
        return (
            db.query(Call)
            .join(User, Call.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .all()
        )
    elif role == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )
        return (
            db.query(Call)
            .join(User, Call.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                or_(
                    User.id.in_(subquery_user_ids),
                    Call.assigned_to == current_user.id,
                    Call.created_by == current_user.id
                )
            ).all()
        )
    else:
        return (
            db.query(Call)
            .filter(base_filter)
            .filter(
                or_(
                    Call.assigned_to == current_user.id,
                    Call.created_by == current_user.id
                )
            ).all()
        )


def get_role_filtered_meetings(db: Session, current_user: User, base_filter) -> List[Meeting]:
    """Apply role-based restrictions to meeting queries."""
    role = current_user.role.upper()
    
    if role in ["CEO", "ADMIN"]:
        return (
            db.query(Meeting)
            .join(User, Meeting.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif role == "GROUP MANAGER":
        return (
            db.query(Meeting)
            .join(User, Meeting.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .all()
        )
    elif role == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )
        return (
            db.query(Meeting)
            .join(User, Meeting.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                or_(
                    User.id.in_(subquery_user_ids),
                    Meeting.assigned_to == current_user.id,
                    Meeting.created_by == current_user.id
                )
            ).all()
        )
    else:
        return (
            db.query(Meeting)
            .filter(base_filter)
            .filter(
                or_(
                    Meeting.assigned_to == current_user.id,
                    Meeting.created_by == current_user.id
                )
            ).all()
        )


def get_role_filtered_quotes(db: Session, current_user: User, base_filter) -> List[Quote]:
    """Apply role-based restrictions to quote queries."""
    role = current_user.role.upper()
    
    if role in ["CEO", "ADMIN"]:
        return (
            db.query(Quote)
            .join(User, Quote.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif role == "GROUP MANAGER":
        return (
            db.query(Quote)
            .join(User, Quote.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .all()
        )
    elif role == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )
        return (
            db.query(Quote)
            .join(User, Quote.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                or_(
                    User.id.in_(subquery_user_ids),
                    Quote.assigned_to == current_user.id,
                    Quote.created_by == current_user.id
                )
            ).all()
        )
    else:
        return (
            db.query(Quote)
            .filter(base_filter)
            .filter(
                or_(
                    Quote.assigned_to == current_user.id,
                    Quote.created_by == current_user.id
                )
            ).all()
        )


def get_role_filtered_deals(db: Session, current_user: User, base_filter) -> List[Deal]:
    """Apply role-based restrictions to deal queries."""
    role = current_user.role.upper()
    
    if role in ["CEO", "ADMIN"]:
        return (
            db.query(Deal)
            .join(User, Deal.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif role == "GROUP MANAGER":
        return (
            db.query(Deal)
            .join(User, Deal.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .all()
        )
    elif role == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )
        return (
            db.query(Deal)
            .join(User, Deal.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                or_(
                    User.id.in_(subquery_user_ids),
                    Deal.assigned_to == current_user.id,
                    Deal.created_by == current_user.id
                )
            ).all()
        )
    else:
        return (
            db.query(Deal)
            .filter(base_filter)
            .filter(
                or_(
                    Deal.assigned_to == current_user.id,
                    Deal.created_by == current_user.id
                )
            ).all()
        )


def get_role_filtered_contacts(db: Session, current_user: User, base_filter) -> List[Contact]:
    """Apply role-based restrictions to contact queries."""
    role = current_user.role.upper()
    
    if role in ["CEO", "ADMIN"]:
        return (
            db.query(Contact)
            .join(User, Contact.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif role == "GROUP MANAGER":
        return (
            db.query(Contact)
            .join(User, Contact.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .all()
        )
    elif role == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )
        return (
            db.query(Contact)
            .join(User, Contact.assigned_to == User.id)
            .filter(base_filter)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                or_(
                    User.id.in_(subquery_user_ids),
                    Contact.assigned_to == current_user.id,
                    Contact.created_by == current_user.id
                )
            ).all()
        )
    else:
        return (
            db.query(Contact)
            .filter(base_filter)
            .filter(
                or_(
                    Contact.assigned_to == current_user.id,
                    Contact.created_by == current_user.id
                )
            ).all()
        )


# -----------------------------------------
# ACTIVITY ENDPOINTS
# -----------------------------------------

@router.get('/accounts/{account_id}', response_model=AccountActivityResponse)
def get_account_activities(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = get_role_filtered_tasks(db, current_user, Task.related_to_account == account_id)
    calls = get_role_filtered_calls(db, current_user, Call.related_to_account == account_id)
    meetings = get_role_filtered_meetings(db, current_user, Meeting.related_to_account == account_id)
    quotes = get_role_filtered_quotes(db, current_user, Quote.account_id == account_id)
    deals = get_role_filtered_deals(db, current_user, Deal.account_id == account_id)
    contacts = get_role_filtered_contacts(db, current_user, Contact.account_id == account_id)

    return {
        "tasks": tasks,
        "calls": calls,
        "meetings": meetings,
        "quotes": quotes,
        "deals": deals,
        "contacts": contacts
    }      

@router.get('/contact/{contact_id}', response_model=ContactActivityResponse)
def get_contact_activities(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = get_role_filtered_tasks(db, current_user, Task.related_to_contact == contact_id)
    calls = get_role_filtered_calls(db, current_user, Call.related_to_contact == contact_id)
    meetings = get_role_filtered_meetings(db, current_user, Meeting.related_to_contact == contact_id)
    quotes = get_role_filtered_quotes(db, current_user, Quote.contact_id == contact_id)
    deals = get_role_filtered_deals(db, current_user, Deal.primary_contact_id == contact_id)

    return {
        "tasks": tasks,
        "calls": calls,
        "meetings": meetings,
        "quotes": quotes,
        "deals": deals,
    }

@router.get('/lead/{lead_id}', response_model=LeadActivityResponse)
def get_lead_activities(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = get_role_filtered_tasks(db, current_user, Task.related_to_lead == lead_id)
    calls = get_role_filtered_calls(db, current_user, Call.related_to_lead == lead_id)
    meetings = get_role_filtered_meetings(db, current_user, Meeting.related_to_lead == lead_id)

    return {
        "tasks": tasks,
        "calls": calls,
        "meetings": meetings,
    }

@router.get('/deal/{deal_id}', response_model=DealActivityResponse)
def get_deal_activities(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = get_role_filtered_tasks(db, current_user, Task.related_to_deal == deal_id)
    calls = get_role_filtered_calls(db, current_user, Call.related_to_deal == deal_id)
    meetings = get_role_filtered_meetings(db, current_user, Meeting.related_to_deal == deal_id)
    quotes = get_role_filtered_quotes(db, current_user, Quote.deal_id == deal_id)

    return {
        "tasks": tasks,
        "calls": calls,
        "meetings": meetings,
        "quotes": quotes,        
    }
