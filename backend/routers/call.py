from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
import json

from database import get_db
from models.call import Call, CallStatus, CallDirection
from models.auth import User
from schemas.call import CallCreate, CallResponse
from .auth_utils import get_current_user
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/calls",
    tags=["Calls"]
)

def call_to_response(call: Call) -> dict:
    """Convert DB Call to API-friendly JSON"""
    assigned_name = None
    if call.call_assign_to:
        assigned_name = f"{call.call_assign_to.first_name} {call.call_assign_to.last_name}"
    
    contact_name = None
    contact_phone = None
    if call.contact:
        contact_name = f"{call.contact.first_name or ''} {call.contact.last_name or ''}".strip()
        contact_phone = call.contact.work_phone or call.contact.mobile_phone_1 or None
    
    # Parse metadata from notes (stored as JSON at the beginning)
    phone_number = contact_phone
    priority = "LOW"
    related_to_text = None
    related_type_text = None
    actual_notes = call.notes or ""
    
    if call.notes and call.notes.startswith("__METADATA__"):
        try:
            # Extract JSON metadata from notes
            parts = call.notes.split("__NOTES__", 1)
            if len(parts) == 2:
                metadata_str = parts[0].replace("__METADATA__", "")
                actual_notes = parts[1]
                metadata = json.loads(metadata_str)
                phone_number = metadata.get("phone_number") or contact_phone
                priority = metadata.get("priority", "LOW")
                related_to_text = metadata.get("related_to")
                related_type_text = metadata.get("related_type")
        except (json.JSONDecodeError, ValueError):
            # If parsing fails, use notes as-is
            actual_notes = call.notes
    
    # Use related_to_text if available, otherwise derive from relationships
    related_to = related_to_text
    if not related_to:
        related_to = (
            call.account.name if call.account else
            contact_name if call.contact else
            f"{call.lead.first_name} {call.lead.last_name}" if call.lead else
            call.deal.name if call.deal else None
        )
    
    # Use related_type_text from metadata if available, otherwise derive from relationships
    related_type = related_type_text
    if not related_type:
        related_type = (
            "Account" if call.related_to_account else
            "Contact" if call.related_to_contact else
            "Lead" if call.related_to_lead else
            "Deal" if call.related_to_deal else None
        )
    
    return {
        "id": call.id,
        "subject": call.subject,
        "primary_contact": contact_name,
        "primary_contact_id": call.related_to_contact,
        "phone_number": phone_number,
        "call_time": call.call_time.isoformat() if call.call_time else None,
        "call_duration": call.duration_minutes,
        "notes": actual_notes,
        "due_date": call.call_time.isoformat() if call.call_time else None,
        "assigned_to": assigned_name,
        "assigned_to_id": call.assigned_to,
        "related_type": related_type,
        "related_to": related_to,
        "priority": priority,
        "status": (
            "PENDING" if (isinstance(call.status, CallStatus) and call.status == CallStatus.PLANNED) or (call.status and str(call.status).upper() == "PLANNED")
            else "COMPLETED" if (isinstance(call.status, CallStatus) and call.status == CallStatus.HELD) or (call.status and str(call.status).upper() == "HELD")
            else "MISSED" if (isinstance(call.status, CallStatus) and call.status == CallStatus.NOT_HELD) or (call.status and str(call.status).upper() == "NOT_HELD")
            else str(call.status).upper() if call.status else "PENDING"
        ),
        "created_at": call.created_at.isoformat() if call.created_at else None,
        "updated_at": call.updated_at.isoformat() if call.updated_at else None,
    }

@router.post("/create", response_model=CallResponse, status_code=status.HTTP_201_CREATED)
def create_call(
    data: CallCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Create a new call with audit logging"""
    
    # Validate assigned user if provided
    assigned_user = None
    if data.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == data.assigned_to_id).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
    
    # Combine due_date and call_time into a single datetime
    call_time = None
    if data.due_date and data.call_time:
        # Combine date (YYYY-MM-DD) and time (HH:MM)
        date_part = data.due_date.split('T')[0] if 'T' in data.due_date else data.due_date
        time_part = data.call_time.split('T')[1].split('.')[0] if 'T' in data.call_time else data.call_time
        
        try:
            call_time = datetime.strptime(f"{date_part} {time_part}", '%Y-%m-%d %H:%M')
        except ValueError:
            try:
                # Try with just date if time parsing fails
                call_time = datetime.strptime(date_part, '%Y-%m-%d')
            except ValueError:
                call_time = None
    elif data.due_date:
        # Use due_date as call_time
        date_str = data.due_date.split('T')[0] if 'T' in data.due_date else data.due_date
        try:
            call_time = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            call_time = None
    elif data.call_time:
        # If only time is provided, use today's date
        time_str = data.call_time.split('T')[1].split('.')[0] if 'T' in data.call_time else data.call_time
        today = datetime.now().strftime('%Y-%m-%d')
        try:
            call_time = datetime.strptime(f"{today} {time_str}", '%Y-%m-%d %H:%M')
        except ValueError:
            call_time = None
    
    # Convert call_duration to int if it's a string
    call_duration = None
    if data.call_duration:
        if isinstance(data.call_duration, str):
            try:
                call_duration = int(data.call_duration)
            except ValueError:
                call_duration = None
        else:
            call_duration = data.call_duration
    
    # Map frontend status to backend CallStatus enum
    status_mapping = {
        "PENDING": CallStatus.PLANNED,
        "COMPLETED": CallStatus.HELD,
        "CANCELLED": CallStatus.NOT_HELD,
        "MISSED": CallStatus.NOT_HELD,
    }
    call_status = status_mapping.get(data.status or "PENDING", CallStatus.PLANNED)
    
    # Determine related_to fields based on related_type
    related_to_account = None
    related_to_contact = None
    related_to_lead = None
    related_to_deal = None
    
    # Only set relationship fields based on what user actually selected
    if data.related_type:
        related_type_lower = data.related_type.lower()
        if related_type_lower == "contact" and data.primary_contact_id:
            related_to_contact = data.primary_contact_id
        # Additional logic can be added for other types (Account, Lead, Deal)
        # For now, we only support Contact relationship
    
    # Store phone_number, priority, related_to, and related_type as JSON metadata in notes
    metadata = {
        "phone_number": data.phone_number,
        "priority": data.priority or "LOW",
        "related_to": data.related_to,
        "related_type": data.related_type,
    }
    metadata_json = json.dumps(metadata)
    # Store metadata at the beginning of notes, separated by __NOTES__
    notes_with_metadata = f"__METADATA__{metadata_json}__NOTES__{data.notes or ''}"
    
    new_call = Call(
        subject=data.subject,
        call_time=call_time,
        duration_minutes=call_duration,
        direction=CallDirection.OUTGOING,
        status=call_status,
        notes=notes_with_metadata,
        related_to_account=related_to_account,
        related_to_contact=related_to_contact,
        related_to_lead=related_to_lead,
        related_to_deal=related_to_deal,
        created_by=current_user.id,
        assigned_to=data.assigned_to_id,
    )
    
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    
    # Create audit log
    new_data = serialize_instance(new_call)
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_call,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"add call '{data.subject}'"
    )
    
    return call_to_response(new_call)

@router.get("/admin/fetch-all", response_model=List[CallResponse])
def admin_get_calls(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all calls for admin users"""
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Get all calls created by users in the same company
    company_users = db.query(User.id).filter(
        User.related_to_company == current_user.related_to_company
    ).subquery()
    
    calls = (
        db.query(Call)
        .options(
            joinedload(Call.call_assign_to),
            joinedload(Call.contact),
            joinedload(Call.account),
            joinedload(Call.lead),
            joinedload(Call.deal)
        )
        .filter(Call.created_by.in_(company_users))
        .order_by(Call.created_at.desc())
        .all()
    )
    
    return [call_to_response(call) for call in calls]

