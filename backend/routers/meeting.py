from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta
import json

from database import get_db
from models.meeting import Meeting, MeetingStatus
from models.auth import User
from models.account import Account
from models.contact import Contact
from models.lead import Lead
from models.deal import Deal
from models.quote import Quote
from schemas.meeting import MeetingCreate, MeetingUpdate, MeetingResponse, MeetingBulkDelete
from .auth_utils import get_current_user
from .logs_utils import serialize_instance, create_audit_log
from models.territory import Territory

router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"]
)

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER", "SALES"}

@router.post("/create", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):    
    assigned_user = None
    if payload.assignedTo:
        assigned_user = db.query(User).filter(User.id == payload.assignedTo).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")            

    new_meeting = Meeting(
        subject=payload.subject,
        start_time=payload.startTime,
        end_time=payload.endTime,
        location=payload.location,
        status=payload.status,
        notes=payload.notes,
        created_by=current_user.id,
        assigned_to=payload.assignedTo,        
    )

    # Primary relation validation and assignment
    if getattr(payload, 'relatedType1', None) == "Lead":
        lead = db.query(Lead).filter(Lead.id == payload.relatedTo1).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        new_meeting.related_to_lead = payload.relatedTo1
        new_meeting.related_to_account = None
        new_meeting.related_to_contact = None
        new_meeting.related_to_deal = None
        new_meeting.related_to_quote = None
    elif getattr(payload, 'relatedType1', None) == "Account":
        account = db.query(Account).filter(Account.id == payload.relatedTo1).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        new_meeting.related_to_account = payload.relatedTo1
        # Secondary relation (only valid when Account)
        if getattr(payload, 'relatedType2', None) == "Contact" and payload.relatedTo2:
            contact = db.query(Contact).filter(Contact.id == payload.relatedTo2).first()
            if not contact:
                raise HTTPException(status_code=404, detail="Contact not found")
            new_meeting.related_to_contact = payload.relatedTo2
            new_meeting.related_to_deal = None
            new_meeting.related_to_quote = None
        elif getattr(payload, 'relatedType2', None) == "Deal" and payload.relatedTo2:
            deal = db.query(Deal).filter(Deal.id == payload.relatedTo2).first()
            if not deal:
                raise HTTPException(status_code=404, detail="Deal not found")
            new_meeting.related_to_deal = payload.relatedTo2
            new_meeting.related_to_contact = None
            new_meeting.related_to_quote = None
        elif getattr(payload, 'relatedType2', None) == "Quote" and payload.relatedTo2:
            quote = db.query(Quote).filter(Quote.id == payload.relatedTo2).first()
            if not quote:
                raise HTTPException(status_code=404, detail="Quote not found")
            new_meeting.related_to_quote = payload.relatedTo2
            new_meeting.related_to_contact = None
            new_meeting.related_to_deal = None
        else:
            new_meeting.related_to_contact = None
            new_meeting.related_to_deal = None
            new_meeting.related_to_quote = None
    else:
        raise HTTPException(status_code=400, detail="Invalid relatedType1. Must be 'Lead' or 'Account'.")
    
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_meeting,
        action="CREATE",
        request=request,
        new_data=serialize_instance(new_meeting),
        custom_message=f"create meeting '{new_meeting.subject}'"
    )

    return new_meeting

@router.get("/admin/fetch-all", response_model=List[MeetingResponse])
def admin_get_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all meetings for admin users"""
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        meetings = (
            db.query(Meeting)
            .join(User, Meeting.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif current_user.role.upper() == "GROUP MANAGER":
        meetings = (
            db.query(Meeting)
            .join(User, Meeting.assigned_to == User.id)
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

        meetings = (
            db.query(Meeting)
            .join(User, Meeting.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                (User.id.in_(subquery_user_ids)) | 
                (Meeting.assigned_to == current_user.id) | # Leads owned by manager
                (Meeting.created_by == current_user.id)
            ).all()
        )
    else:
        meetings = (
            db.query(Meeting)
            .filter(
                (Meeting.assigned_to == current_user.id) | 
                (Meeting.created_by == current_user.id)
            ).all()
        )

    return meetings

@router.get("/manager/leads/getLeads", response_model=list[MeetingResponse])
def admin_get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Account).join(User, Account.assigned_to == User.id)
    
    current_role = current_user.role.upper()

    if current_role in ["CEO", "ADMIN"]:
        return query.filter(User.related_to_company == current_user.related_to_company).all()

    if current_role == "GROUP MANAGER":
        return query.filter(
            User.related_to_company == current_user.related_to_company,
            ~User.role.in_(["CEO", "Admin"])
        ).all()

    # For MANAGERS and SALES:
    # We need to find accounts linked to deals they are assigned to
    from models.lead import Lead # Ensure Deal model is imported
    
    # Subquery for accounts linked via Deals
    lead_account_ids = (
        db.query(Lead.id)
        .filter(Lead.lead_owner == current_user.id)
        .scalar_subquery()
    )

    if current_role == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )

        return query.filter(
            User.related_to_company == current_user.related_to_company
        ).filter(
            (User.id.in_(subquery_user_ids)) | 
            (Lead.lead_owner == current_user.id) | 
            (Lead.created_by == current_user.id) |
            (Lead.id.in_(lead_account_ids)) # <--- NEW: Accounts linked to their deals
        ).all()
    
    else: # SALES
        return db.query(Lead).filter(
            (Lead.assigned_to == current_user.id) | 
            (Lead.created_by == current_user.id) |
            (Lead.id.in_(lead_account_ids)) # <--- NEW: Accounts linked to their deals
        ).all()

@router.put("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: int,
    data: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Update an existing meeting"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Store old data for audit log
    old_data = serialize_instance(meeting)
    
    # 1. Update Basic Fields
    if data.subject is not None:
        meeting.subject = data.subject
    if data.location is not None:
        meeting.location = data.location
    if data.notes is not None:
        meeting.notes = data.notes

    # 2. Update Times
    if data.startTime is not None:
        meeting.start_time = data.startTime
    
    if data.endTime is not None:
        meeting.end_time = data.endTime

    # 3. Update Status
    if data.status is not None:
        status_key = data.status.strip().upper()
        status_mapping = {
            "PENDING": MeetingStatus.PLANNED,
            "PLANNED": MeetingStatus.PLANNED,
            "IN PROGRESS": MeetingStatus.PLANNED,
            "COMPLETED": MeetingStatus.HELD,
            "HELD": MeetingStatus.HELD,
            "DONE": MeetingStatus.HELD,
            "CANCELLED": MeetingStatus.NOT_HELD,
            "NOT_HELD": MeetingStatus.NOT_HELD,
            "NOT HELD": MeetingStatus.NOT_HELD,
        }
        if status_key in status_mapping:
            meeting.status = status_mapping[status_key]

    # 4. Update Assigned User
    if data.assignedTo is not None:
        if data.assignedTo == 0:
            meeting.assigned_to = None
        else:
            assigned_user = db.query(User).filter(User.id == data.assignedTo).first()
            if not assigned_user:
                raise HTTPException(status_code=404, detail="Assigned user not found")
            meeting.assigned_to = data.assignedTo

    # 5. Update Relations
    if data.relatedType1 is not None and data.relatedTo1 is not None:
        # Reset existing
        meeting.related_to_lead = None
        meeting.related_to_account = None
        meeting.related_to_contact = None
        meeting.related_to_deal = None

        if data.relatedType1 == "Lead":
            lead = db.query(Lead).filter(Lead.id == data.relatedTo1).first()
            if not lead:
                raise HTTPException(status_code=404, detail="Lead not found")
            meeting.related_to_lead = lead.id

        elif data.relatedType1 == "Account":
            account = db.query(Account).filter(Account.id == data.relatedTo1).first()
            if not account:
                raise HTTPException(status_code=404, detail="Account not found")
            
            if data.relatedType2 == "Contact" and data.relatedTo2:
                contact = db.query(Contact).filter(Contact.id == data.relatedTo2).first()
                if not contact:
                    raise HTTPException(status_code=404, detail="Contact not found")
                meeting.related_to_contact = contact.id
                meeting.related_to_account = account.id 
                
            elif data.relatedType2 == "Deal" and data.relatedTo2:
                deal = db.query(Deal).filter(Deal.id == data.relatedTo2).first()
                if not deal:
                    raise HTTPException(status_code=404, detail="Deal not found")
                meeting.related_to_deal = deal.id
                meeting.related_to_account = account.id
            else:
                meeting.related_to_account = account.id

    db.commit()
    db.refresh(meeting)
    
    # Audit Log logic (wrapped in try/except to prevent 500 errors if audit fails)
    try:
        new_data = serialize_instance(meeting)
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=meeting,
            action="UPDATE",
            request=request,
            old_data=old_data,
            new_data=new_data,
            custom_message=f"Updated meeting '{meeting.subject}'"
        )
    except Exception as e:
        print(f"Audit Log Error: {e}")
    
    return meeting

@router.delete("/{meeting_id}", status_code=status.HTTP_200_OK)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Delete a meeting"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting_subject = meeting.subject
    
    # Store old data for audit log before deletion
    old_data = serialize_instance(meeting)
    
    # Create audit log before deleting
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=meeting,
        action="DELETE",
        request=request,
        old_data=old_data,
        custom_message=f"delete meeting '{meeting_subject}'"
    )
    
    db.delete(meeting)
    db.commit()
    
    return {"message": "Meeting deleted successfully"}


@router.delete("/admin/bulk-delete", status_code=status.HTTP_200_OK)
def admin_bulk_delete_meetings(
    data: MeetingBulkDelete = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not data.meeting_ids:
        return {"detail": "No meetings provided for deletion."}

    company_users = (
        db.query(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    meetings_to_delete = db.query(Meeting).filter(
        Meeting.id.in_(data.meeting_ids),
        ((Meeting.created_by.in_(company_users)) | (Meeting.assigned_to.in_(company_users)))
    ).all()

    if not meetings_to_delete:
        raise HTTPException(status_code=404, detail="No matching meetings found for deletion.")

    deleted_count = 0
    for meeting in meetings_to_delete:
        deleted_data = serialize_instance(meeting)
        meeting_name = meeting.subject
        target_user_id = meeting.assigned_to or meeting.created_by

        db.delete(meeting)
        
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=meeting,
            action="DELETE",
            request=request,
            old_data=deleted_data,
            target_user_id=target_user_id,
            custom_message=f"bulk delete meeting '{meeting_name}' via admin panel"
        )
        deleted_count += 1

    db.commit()

    return {"detail": f"Successfully deleted {deleted_count} meeting(s)."}

