from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
import json

from database import get_db
from models.call import Call, CallStatus, CallDirection
from models.auth import User
from models.account import Account
from models.contact import Contact
from models.lead import Lead
from models.deal import Deal
from schemas.call import CallCreate, CallResponse, CallUpdate, CallBulkDelete
from .auth_utils import get_current_user
from .logs_utils import serialize_instance, create_audit_log
from models.territory import Territory

router = APIRouter(
    prefix="/calls",
    tags=["Calls"]
)

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER", "SALES"}

@router.post("/create", response_model=CallResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: CallCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):    
    assigned_user = None
    if payload.assigned_to:
        assigned_user = db.query(User).filter(User.id == payload.assigned_to).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")            

    new_call = Call(
        subject=payload.subject,
        call_time=payload.call_time,
        duration_minutes=payload.duration_minutes,
        direction=payload.direction,
        status=payload.status,
        notes=payload.notes,
        assigned_to=payload.assigned_to,
        created_by=current_user.id
    )

    # Primary relation validation and assignment
    if getattr(payload, 'relatedType1', None) == "Lead":
        lead = db.query(Lead).filter(Lead.id == payload.relatedTo1).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        new_call.related_to_lead = payload.relatedTo1
        new_call.related_to_account = None
        new_call.related_to_contact = None
        new_call.related_to_deal = None
    elif getattr(payload, 'relatedType1', None) == "Account":
        account = db.query(Account).filter(Account.id == payload.relatedTo1).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        new_call.related_to_account = payload.relatedTo1
        # Secondary relation (only valid when Account)
        if getattr(payload, 'relatedType2', None) == "Contact" and payload.relatedTo2:
            contact = db.query(Contact).filter(Contact.id == payload.relatedTo2).first()
            if not contact:
                raise HTTPException(status_code=404, detail="Contact not found")
            new_call.related_to_contact = payload.relatedTo2
            new_call.related_to_deal = None
        elif getattr(payload, 'relatedType2', None) == "Deal" and payload.relatedTo2:
            deal = db.query(Deal).filter(Deal.id == payload.relatedTo2).first()
            if not deal:
                raise HTTPException(status_code=404, detail="Deal not found")
            new_call.related_to_deal = payload.relatedTo2
            new_call.related_to_contact = None
        else:
            new_call.related_to_contact = None
            new_call.related_to_deal = None
    else:
        raise HTTPException(status_code=400, detail="Invalid relatedType1. Must be 'Lead' or 'Account'.")
    
    db.add(new_call)
    db.commit()
    db.refresh(new_call)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_call,
        action="CREATE",
        request=request,
        new_data=serialize_instance(new_call),
        custom_message=f"create call '{new_call.subject}'"
    )

    return new_call


@router.get("/admin/fetch-all", response_model=List[CallResponse])
def admin_get_calls(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all calls for admin users"""
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        call = (
            db.query(Call)
            .join(User, Call.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif current_user.role.upper() == "GROUP MANAGER":
        call = (
            db.query(Call)
            .join(User, Call.assigned_to == User.id)
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

        call = (
            db.query(Call)
            .join(User, Call.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                (User.id.in_(subquery_user_ids)) | 
                (Call.assigned_to == current_user.id) | # Calls assigned to manager
                (Call.created_by == current_user.id)
            ).all()
        )
    else:
        call = (
            db.query(Call)
            .filter(
                (Call.assigned_to == current_user.id) | 
                (Call.created_by == current_user.id)
            ).all()
        )

    return call


@router.put("/{call_id}", response_model=CallResponse)
def update_call(
    call_id: int,
    data: CallUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    call = (
        db.query(Call)
        .options(
            joinedload(Call.call_assign_to),
            joinedload(Call.contact),
            joinedload(Call.account),
            joinedload(Call.lead),
            joinedload(Call.deal)
        )
        .filter(Call.id == call_id)
        .first()
    )
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER', 'MANAGER', 'SALES']:
        if call.assigned_to != current_user.id and call.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Permission denied")
    old_data = serialize_instance(call)
    if data.subject is not None:
        call.subject = data.subject
    if data.call_time is not None:
        call.call_time = data.call_time
    if data.duration_minutes is not None:
        call.duration_minutes = data.duration_minutes
    if data.direction is not None:
        dir_map = {
            "INCOMING": CallDirection.INCOMING,
            "Incoming": CallDirection.INCOMING,
            "OUTGOING": CallDirection.OUTGOING,
            "Outgoing": CallDirection.OUTGOING,
        }
        call.direction = dir_map.get(str(data.direction), CallDirection.OUTGOING)
    if data.status is not None:
        status_map = {
            "PENDING": CallStatus.PLANNED,
            "COMPLETED": CallStatus.HELD,
            "CANCELLED": CallStatus.NOT_HELD,
            "MISSED": CallStatus.NOT_HELD,
            "PLANNED": CallStatus.PLANNED,
            "HELD": CallStatus.HELD,
            "NOT_HELD": CallStatus.NOT_HELD,
            "Planned": CallStatus.PLANNED,
            "Held": CallStatus.HELD,
            "Not held": CallStatus.NOT_HELD,
        }
        call.status = status_map.get(str(data.status), CallStatus.PLANNED)
    if data.notes is not None:
        call.notes = data.notes
    if data.assigned_to is not None:
        assigned_user = db.query(User).filter(User.id == data.assigned_to).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
        call.assigned_to = data.assigned_to
    # Handle relations with cross-field constraints
    if data.relatedType1 is not None:
        call.related_to_lead = None
        call.related_to_account = None
        call.related_to_contact = None
        call.related_to_deal = None
        if data.relatedType1 == "Lead" and data.relatedTo1:
            # Validate lead exists
            lead = db.query(Lead).filter(Lead.id == data.relatedTo1).first()
            if not lead:
                raise HTTPException(status_code=404, detail="Lead not found")
            call.related_to_lead = data.relatedTo1
            # When Lead is selected, ensure no Contact/Deal relations
            call.related_to_contact = None
            call.related_to_deal = None
        elif data.relatedType1 == "Account" and data.relatedTo1:
            # Validate account exists
            account = db.query(Account).filter(Account.id == data.relatedTo1).first()
            if not account:
                raise HTTPException(status_code=404, detail="Account not found")
            call.related_to_account = data.relatedTo1
            # Only allow secondary relation when Account is selected
            if data.relatedType2 is not None:
                call.related_to_contact = None
                call.related_to_deal = None
                if data.relatedType2 == "Contact" and data.relatedTo2:
                    contact = db.query(Contact).filter(Contact.id == data.relatedTo2).first()
                    if not contact:
                        raise HTTPException(status_code=404, detail="Contact not found")
                    call.related_to_contact = data.relatedTo2
                if data.relatedType2 == "Deal" and data.relatedTo2:
                    deal = db.query(Deal).filter(Deal.id == data.relatedTo2).first()
                    if not deal:
                        raise HTTPException(status_code=404, detail="Deal not found")
                    call.related_to_deal = data.relatedTo2
        else:
            raise HTTPException(status_code=400, detail="Invalid relatedType1. Must be 'Lead' or 'Account'.")
    else:
        # If primary type not changing, only accept secondary relation when currently related to Account
        if data.relatedType2 is not None and call.related_to_account is not None:
            call.related_to_contact = None
            call.related_to_deal = None
            if data.relatedType2 == "Contact" and data.relatedTo2:
                contact = db.query(Contact).filter(Contact.id == data.relatedTo2).first()
                if not contact:
                    raise HTTPException(status_code=404, detail="Contact not found")
                call.related_to_contact = data.relatedTo2
            if data.relatedType2 == "Deal" and data.relatedTo2:
                deal = db.query(Deal).filter(Deal.id == data.relatedTo2).first()
                if not deal:
                    raise HTTPException(status_code=404, detail="Deal not found")
                call.related_to_deal = data.relatedTo2
    
    db.commit()
    db.refresh(call)
    new_data = serialize_instance(call)
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=call,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        custom_message=f"update call '{call.subject}'"
    )
    return call

@router.delete("/{call_id}", status_code=status.HTTP_200_OK)
def delete_call(
    call_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    subject = call.subject
    old_data = serialize_instance(call)
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=call,
        action="DELETE",
        request=request,
        old_data=old_data,
        custom_message=f"delete call '{subject}'"
    )
    db.delete(call)
    db.commit()
    return {"message": "Call deleted successfully"}


@router.delete("/admin/bulk-delete", status_code=status.HTTP_200_OK)
def admin_bulk_delete_calls(
    data: CallBulkDelete = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not data.call_ids:
        return {"detail": "No calls provided for deletion."}

    company_users = (
        db.query(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    calls_to_delete = db.query(Call).filter(
        Call.id.in_(data.call_ids),
        ((Call.created_by.in_(company_users)) | (Call.assigned_to.in_(company_users)))
    ).all()

    if not calls_to_delete:
        raise HTTPException(status_code=404, detail="No matching calls found for deletion.")

    deleted_count = 0
    for call in calls_to_delete:
        deleted_data = serialize_instance(call)
        call_name = call.subject
        target_user_id = call.assigned_to or call.created_by

        db.delete(call)
        
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=call,
            action="DELETE",
            request=request,
            old_data=deleted_data,
            target_user_id=target_user_id,
            custom_message=f"bulk delete call '{call_name}' via admin panel"
        )
        deleted_count += 1

    db.commit()

    return {"detail": f"Successfully deleted {deleted_count} call(s)."}

