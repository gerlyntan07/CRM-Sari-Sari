# backend/routers/activities.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional

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
from .logs_utils import serialize_instance, create_audit_log
from .ws_notification import broadcast_notification


router = APIRouter(prefix="/activities", tags=["Activities"])

@router.get('/accounts/{account_id}', response_model=AccountActivityResponse)
def get_account_activities(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(Task.related_to_account == account_id).all()
    calls = db.query(Call).filter(Call.related_to_account == account_id).all()
    meetings = db.query(Meeting).filter(Meeting.related_to_account == account_id).all()      
    quotes = db.query(Quote).filter(Quote.account_id == account_id).all()
    deals = db.query(Deal).filter(Deal.account_id == account_id).all()
    contacts = db.query(Contact).filter(Contact.account_id == account_id).all()    

    return {
        "tasks": tasks,
        "calls": calls,
        "meetings": meetings,
        "quotes": quotes,
        "deals": deals,
        "contacts": contacts
    }      

@router.get('/contact/{contact_id}', response_model=ContactActivityResponse)
def get_account_activities(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(Task.related_to_contact == contact_id).all()
    calls = db.query(Call).filter(Call.related_to_contact == contact_id).all()
    meetings = db.query(Meeting).filter(Meeting.related_to_contact == contact_id).all()      
    quotes = db.query(Quote).filter(Quote.contact_id == contact_id).all()
    deals = db.query(Deal).filter(Deal.primary_contact_id == contact_id).all()    

    return {
        "tasks": tasks,
        "calls": calls,
        "meetings": meetings,
        "quotes": quotes,
        "deals": deals,
    }

@router.get('/lead/{lead_id}', response_model=LeadActivityResponse)
def get_account_activities(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(Task.related_to_lead == lead_id).all()
    calls = db.query(Call).filter(Call.related_to_lead == lead_id).all()
    meetings = db.query(Meeting).filter(Meeting.related_to_lead == lead_id).all()

    return {
        "tasks": tasks,
        "calls": calls,
        "meetings": meetings,
    }

@router.get('/deal/{deal_id}', response_model=DealActivityResponse)
def get_account_activities(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(Task.related_to_deal == deal_id).all()
    calls = db.query(Call).filter(Call.related_to_deal == deal_id).all()
    meetings = db.query(Meeting).filter(Meeting.related_to_deal == deal_id).all()      
    quotes = db.query(Quote).filter(Quote.deal_id == deal_id).all()    

    return {
        "tasks": tasks,
        "calls": calls,
        "meetings": meetings,
        "quotes": quotes,        
    }