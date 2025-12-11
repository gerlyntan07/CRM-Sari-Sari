from fastapi import APIRouter, Depends, HTTPException, status, Request
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
from schemas.call import CallCreate, CallResponse #, CallUpdate
from .auth_utils import get_current_user
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/calls",
    tags=["Calls"]
)

@router.post("/create", response_model=CallResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: CallCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

    # --- FIX START: Use Dot Notation (.) instead of brackets [''] ---
    
    # Logic for Primary Relation (Lead or Account)
    if getattr(payload, 'relatedType1', None) == "Lead":
        new_call.related_to_lead = payload.relatedTo1
    elif getattr(payload, 'relatedType1', None) == "Account":
        new_call.related_to_account = payload.relatedTo1
    
    # Logic for Secondary Relation (Contact or Deal)
    if getattr(payload, 'relatedType2', None) == "Contact":
        new_call.related_to_contact = payload.relatedTo2
    elif getattr(payload, 'relatedType2', None) == "Deal":
        new_call.related_to_deal = payload.relatedTo2 
        
    # --- FIX END ---
    
    db.add(new_call)
    db.commit()
    db.refresh(new_call)

    return new_call


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
        .filter(Call.created_by.in_(company_users))
        .order_by(Call.created_at.desc())
        .all()
    )
    
    return calls




# @router.put("/{call_id}", response_model=CallResponse)
# def update_call(
#     call_id: int,
#     data: CallUpdate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
#     request: Request = None
# ):
#     """Update call status"""
#     call = (
#         db.query(Call)
#         .options(
#             joinedload(Call.call_assign_to),
#             joinedload(Call.contact),
#             joinedload(Call.account),
#             joinedload(Call.lead),
#             joinedload(Call.deal)
#         )
#         .filter(Call.id == call_id)
#         .first()
#     )
    
#     if not call:
#         raise HTTPException(status_code=404, detail="Call not found")
    
#     # Check authorization - allow admins, assigned users, or creator
#     if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
#         # Check if user is assigned to or created the call
#         if call.assigned_to != current_user.id and call.created_by != current_user.id:
#             raise HTTPException(status_code=403, detail="Permission denied")
    
#     old_data = serialize_instance(call)
    
#     # Update status if provided
#     if data.status is not None:
#         status_mapping = {
#             "PENDING": CallStatus.PLANNED,
#             "COMPLETED": CallStatus.HELD,
#             "CANCELLED": CallStatus.NOT_HELD,
#             "MISSED": CallStatus.NOT_HELD,
#         }
#         new_status = status_mapping.get(data.status.upper(), CallStatus.PLANNED)
#         call.status = new_status
        
#         # Update status in metadata to preserve CANCELLED vs MISSED distinction
#         if call.notes and call.notes.startswith("__METADATA__"):
#             try:
#                 parts = call.notes.split("__NOTES__", 1)
#                 if len(parts) == 2:
#                     metadata_str = parts[0].replace("__METADATA__", "")
#                     actual_notes = parts[1]
#                     metadata = json.loads(metadata_str)
#                     metadata["status"] = data.status.upper()  # Update status in metadata
#                     metadata_json = json.dumps(metadata)
#                     call.notes = f"__METADATA__{metadata_json}__NOTES__{actual_notes}"
#             except (json.JSONDecodeError, ValueError):
#                 # If parsing fails, create new metadata
#                 metadata = {
#                     "phone_number": None,
#                     "priority": "LOW",
#                     "related_to": None,
#                     "related_type": None,
#                     "status": data.status.upper(),
#                 }
#                 metadata_json = json.dumps(metadata)
#                 call.notes = f"__METADATA__{metadata_json}__NOTES__{call.notes or ''}"
#         else:
#             # If no metadata exists, create it with status
#             metadata = {
#                 "phone_number": None,
#                 "priority": "LOW",
#                 "related_to": None,
#                 "related_type": None,
#                 "status": data.status.upper(),
#             }
#             metadata_json = json.dumps(metadata)
#             call.notes = f"__METADATA__{metadata_json}__NOTES__{call.notes or ''}"
    
#     db.commit()
#     db.refresh(call)
    
#     new_data = serialize_instance(call)
    
#     create_audit_log(
#         db=db,
#         current_user=current_user,
#         instance=call,
#         action="UPDATE",
#         request=request,
#         old_data=old_data,
#         new_data=new_data,
#         custom_message=f"updated call status of '{call.subject}'"
#     )
    
#     return call_to_response(call)

