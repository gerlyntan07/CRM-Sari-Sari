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
    data = {}
    for column in instance.__table__.columns:
        value = getattr(instance, column.name)
        if isinstance(value, (datetime, date)):
            value = value.isoformat()  # Convert datetime/date to string
        elif isinstance(value, Decimal):
            value = float(value)       # Convert decimals to float
        data[column.name] = value
    return data

def create_audit_log(db: Session, current_user: User, action, instance, old_data=None, new_data=None, request: Request = None, custom_message: str = None):
    """Create and insert a new audit log entry."""
    entity_type = instance.__class__.__name__
    entity_id = getattr(instance, "id", None)

    full_name = f"{current_user.first_name} {current_user.last_name}"    

    # Build the description dynamically
    if custom_message:
        description = f"{action} - {custom_message}"
    else:
        description = f"{action} {entity_type} (ID: {entity_id})"

    log = Auditlog(
        user_id=current_user.id,
        name=full_name,
        action=action,
        description=description,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        old_data=old_data,
        new_data=new_data,
        ip_address=request.client.host if request else None,        
    )
    db.add(log)
    db.commit()
