# backend/utils/audit_logger.py
from sqlalchemy import event
from sqlalchemy.orm import Session
from fastapi import Request
from models.auditlog import Auditlog
from models.auth import User
from .auth_utils import get_current_user
from fastapi import Depends
from datetime import datetime, date
from decimal import Decimal
import json

def serialize_instance(instance):
    """Convert SQLAlchemy model instance into a dictionary safely."""
    import enum
    data = {}
    for column in instance.__table__.columns:
        value = getattr(instance, column.name)
        if isinstance(value, (datetime, date)):
            value = value.isoformat()  # Convert datetime/date to string
        elif isinstance(value, Decimal):
            value = float(value)       # Convert decimals to float
        elif isinstance(value, enum.Enum):
            value = value.value  # Get the enum value instead of the name
        data[column.name] = value
    return data

def create_audit_log(
    db: Session, 
    current_user: User, 
    action, 
    instance, 
    old_data=None, 
    new_data=None, 
    request: Request = None, 
    custom_message: str = None,
    target_user_id: int = None # <--- Add this
):
    entity_type = instance.__class__.__name__
    entity_id = getattr(instance, "id", None)
    full_name = f"{current_user.first_name} {current_user.last_name}"    

    if custom_message:
        description = f"{action} - {custom_message}"
    else:
        description = f"{action} {entity_type} (ID: {entity_id})"

    log = Auditlog(
        # If it's a notification, the 'owner' is the target user.
        # If not, it's the person who did the action.
        user_id=target_user_id if target_user_id else current_user.id,
        name=full_name, # Still tracks the ACTOR (e.g. "Admin Name")
        action=action,
        description=description,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        old_data=old_data,
        new_data=new_data,
        ip_address=request.client.host if request else None,        
        success=True # Ensure this matches your model defaults
    )
    db.add(log)
    db.commit()
    db.refresh(log) # Refresh to get the ID for the WebSocket
    return log