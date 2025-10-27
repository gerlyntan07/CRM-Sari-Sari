from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.contact import ContactBase, ContactResponse
from schemas.auth import UserResponse, UserWithTerritories
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from models.contact import Contact
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/contacts",
    tags=["Contacts"]
)

@router.post("/convertedLead", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    data: ContactBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):                    

    new_contact = Contact(
        first_name=data.first_name,
        last_name=data.last_name,
        account_id=data.account_id,
        title=data.title,
        department=data.department,
        email=data.email,
        work_phone=data.work_phone,
        mobile_phone_1=data.mobile_phone_1,
        mobile_phone_2=data.mobile_phone_2,
        notes=data.notes,
        assigned_to=data.assigned_to,
        created_by=data.created_by        
    )
    
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)

    new_data = serialize_instance(new_contact)    

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_contact,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"add new contact '{new_contact.first_name} {new_contact.last_name}' from a converted lead"
    )

    return new_contact
