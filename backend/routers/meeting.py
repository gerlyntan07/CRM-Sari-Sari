from fastapi import APIRouter, Depends, HTTPException, status, Request
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
from schemas.meeting import MeetingCreate, MeetingUpdate, MeetingResponse
from .auth_utils import get_current_user
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"]
)

def meeting_to_response(meeting: Meeting) -> dict:
    """Convert DB Meeting to API-friendly JSON"""
    assigned_name = None
    if meeting.meet_assign_to:
        assigned_name = f"{meeting.meet_assign_to.first_name} {meeting.meet_assign_to.last_name}"
    
    # Parse metadata from notes (stored as JSON at the beginning)
    meeting_link = None
    priority = "Low"
    related_to_text = None
    related_type_text = None
    actual_notes = meeting.notes or ""
    
    if meeting.notes and meeting.notes.startswith("__METADATA__"):
        try:
            # Extract JSON metadata from notes
            parts = meeting.notes.split("__NOTES__", 1)
            if len(parts) == 2:
                metadata_str = parts[0].replace("__METADATA__", "")
                actual_notes = parts[1]
                metadata = json.loads(metadata_str)
                meeting_link = metadata.get("meeting_link")
                priority = metadata.get("priority", "Low")
                related_to_text = metadata.get("related_to")
                related_type_text = metadata.get("related_type")
        except (json.JSONDecodeError, ValueError):
            # If parsing fails, use notes as-is
            actual_notes = meeting.notes
    
    # Use related_to_text if available, otherwise derive from relationships
    related_to = related_to_text
    if not related_to:
        related_to = (
            meeting.account.name if meeting.account else
            f"{meeting.contact.first_name} {meeting.contact.last_name}" if meeting.contact else
            f"{meeting.lead.first_name} {meeting.lead.last_name}" if meeting.lead else
            meeting.deal.name if meeting.deal else None
        )
    
    # Use related_type_text from metadata if available, otherwise derive from relationships
    related_type = related_type_text
    if not related_type:
        related_type = (
            "Client" if meeting.related_to_account else
            "Contact" if meeting.related_to_contact else
            "Lead" if meeting.related_to_lead else
            "Deal" if meeting.related_to_deal else None
        )
    
    # Calculate duration from start_time and end_time if available
    duration = None
    if meeting.start_time and meeting.end_time:
        duration = int((meeting.end_time - meeting.start_time).total_seconds() / 60)
    
    # Format due date
    due_date_str = None
    if meeting.start_time:
        due_date_str = meeting.start_time.strftime("%Y-%m-%d")
    
    # Map backend status to frontend status
    status_mapping = {
        MeetingStatus.PLANNED: "PENDING",
        MeetingStatus.HELD: "COMPLETED",
        MeetingStatus.NOT_HELD: "CANCELLED",
    }
    frontend_status = status_mapping.get(meeting.status, "PENDING")
    
    return {
        "id": meeting.id,
        "activity": meeting.subject,
        "subject": meeting.subject,
        "location": meeting.location,
        "duration": duration,
        "meetingLink": meeting_link,
        "description": actual_notes,
        "agenda": actual_notes,
        "dueDate": due_date_str,
        "assignedTo": assigned_name,
        "relatedType": related_type,
        "relatedTo": related_to,
        "priority": priority,
        "status": frontend_status,
        "createdAt": meeting.created_at.isoformat() if meeting.created_at else None,
        "updatedAt": meeting.updated_at.isoformat() if meeting.updated_at else None,
    }

@router.post("/create", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    data: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Create a new meeting with audit logging"""
    
    # Validate assigned user if provided
    assigned_user = None
    if data.assigned_to:
        assigned_user = db.query(User).filter(User.id == data.assigned_to).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
    
    # Parse due_date to start_time
    start_time = None
    if data.due_date:
        try:
            # Try parsing ISO format
            if 'T' in data.due_date:
                start_time = datetime.fromisoformat(data.due_date.replace('Z', '+00:00'))
            else:
                # Try parsing date only
                start_time = datetime.strptime(data.due_date, '%Y-%m-%d')
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid date format for due_date")
    
    # Calculate end_time from start_time + duration
    end_time = None
    if start_time and data.duration:
        end_time = start_time + timedelta(minutes=data.duration)
    
    # Map frontend status to backend MeetingStatus enum
    status_mapping = {
        "PENDING": MeetingStatus.PLANNED,
        "COMPLETED": MeetingStatus.HELD,
        "DONE": MeetingStatus.HELD,
        "CANCELLED": MeetingStatus.NOT_HELD,
        "IN PROGRESS": MeetingStatus.PLANNED,
    }
    meeting_status = status_mapping.get(data.status or "PENDING", MeetingStatus.PLANNED)
    
    # Determine related_to fields based on related_type
    related_to_account = None
    related_to_contact = None
    related_to_lead = None
    related_to_deal = None
    
    # For now, we'll store related_to as text in metadata
    # In the future, you might want to look up the actual entity IDs
    # based on related_type and related_to name
    
    # Store meeting_link, priority, related_to, and related_type as JSON metadata in notes
    metadata = {
        "meeting_link": data.meeting_link,
        "priority": data.priority or "Low",
        "related_to": data.related_to,
        "related_type": data.related_type,
    }
    metadata_json = json.dumps(metadata)
    # Store metadata at the beginning of notes, separated by __NOTES__
    notes_with_metadata = f"__METADATA__{metadata_json}__NOTES__{data.agenda or ''}"
    
    new_meeting = Meeting(
        subject=data.subject,
        start_time=start_time,
        end_time=end_time,
        location=data.location,
        status=meeting_status,
        notes=notes_with_metadata,
        related_to_account=related_to_account,
        related_to_contact=related_to_contact,
        related_to_lead=related_to_lead,
        related_to_deal=related_to_deal,
        created_by=current_user.id,
        assigned_to=data.assigned_to,
    )
    
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    
    # Create audit log
    new_data = serialize_instance(new_meeting)
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_meeting,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"add meeting '{data.subject}'"
    )
    
    return meeting_to_response(new_meeting)

@router.get("/admin/fetch-all", response_model=List[MeetingResponse])
def admin_get_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all meetings for admin users"""
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Get all meetings created by users in the same company
    company_users = db.query(User.id).filter(
        User.related_to_company == current_user.related_to_company
    ).subquery()
    
    meetings = (
        db.query(Meeting)
        .options(
            joinedload(Meeting.meet_assign_to),
            joinedload(Meeting.account),
            joinedload(Meeting.contact),
            joinedload(Meeting.lead),
            joinedload(Meeting.deal)
        )
        .filter(Meeting.created_by.in_(company_users))
        .order_by(Meeting.created_at.desc())
        .all()
    )
    
    return [meeting_to_response(meeting) for meeting in meetings]

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
    
    # Validate assigned user if provided
    if data.assigned_to is not None:
        assigned_user = db.query(User).filter(User.id == data.assigned_to).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
        meeting.assigned_to = data.assigned_to
    
    # Update start_time if due_date is provided
    if data.due_date:
        try:
            if 'T' in data.due_date:
                meeting.start_time = datetime.fromisoformat(data.due_date.replace('Z', '+00:00'))
            else:
                meeting.start_time = datetime.strptime(data.due_date, '%Y-%m-%d')
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid date format for due_date")
    
    # Update end_time if duration is provided
    if data.duration and meeting.start_time:
        meeting.end_time = meeting.start_time + timedelta(minutes=data.duration)
    elif data.duration and not meeting.start_time:
        raise HTTPException(status_code=400, detail="Cannot set duration without start_time")
    
    # Update other fields
    if data.subject is not None:
        meeting.subject = data.subject
    if data.location is not None:
        meeting.location = data.location
    
    # Update status
    if data.status is not None:
        status_mapping = {
            "PENDING": MeetingStatus.PLANNED,
            "COMPLETED": MeetingStatus.HELD,
            "DONE": MeetingStatus.HELD,
            "CANCELLED": MeetingStatus.NOT_HELD,
            "IN PROGRESS": MeetingStatus.PLANNED,
        }
        meeting.status = status_mapping.get(data.status, MeetingStatus.PLANNED)
    
    # Update notes with metadata
    if data.agenda is not None or data.meeting_link is not None or data.priority is not None or data.related_to is not None or data.related_type is not None:
        # Parse existing metadata
        existing_metadata = {}
        existing_notes = ""
        
        if meeting.notes and meeting.notes.startswith("__METADATA__"):
            try:
                parts = meeting.notes.split("__NOTES__", 1)
                if len(parts) == 2:
                    metadata_str = parts[0].replace("__METADATA__", "")
                    existing_metadata = json.loads(metadata_str)
                    existing_notes = parts[1]
            except (json.JSONDecodeError, ValueError):
                existing_notes = meeting.notes or ""
        else:
            existing_notes = meeting.notes or ""
        
        # Update metadata
        if data.meeting_link is not None:
            existing_metadata["meeting_link"] = data.meeting_link
        if data.priority is not None:
            existing_metadata["priority"] = data.priority
        if data.related_to is not None:
            existing_metadata["related_to"] = data.related_to
        if data.related_type is not None:
            existing_metadata["related_type"] = data.related_type
        
        # Use new agenda if provided, otherwise keep existing
        final_notes = data.agenda if data.agenda is not None else existing_notes
        
        # Reconstruct notes with metadata
        metadata_json = json.dumps(existing_metadata)
        meeting.notes = f"__METADATA__{metadata_json}__NOTES__{final_notes}"
    
    db.commit()
    db.refresh(meeting)
    
    # Create audit log
    new_data = serialize_instance(meeting)
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=meeting,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        custom_message=f"update meeting '{meeting.subject}'"
    )
    
    return meeting_to_response(meeting)

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

