from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.lead import LeadCreate, LeadResponse
from schemas.auth import UserResponse
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/leads",
    tags=["Leads"]
)

@router.get("/getUsers", response_model=UserResponse)
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).filter(User.company_id == current_user.company_id).all()
    return users

# ✅ CREATE new territory
@router.post("/create", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):    
    
    assigned_user = db.query(User).filter(User.id == data.user_id).first()
    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")

    # ✅ Ssign territory
    new_territory = User(
        name=data.name,
        description=data.description,
        user_id=data.user_id,
        company_id=current_user.related_to_company,
    )
    db.add(new_territory)
    db.commit()
    db.refresh(new_territory)

    new_data = serialize_instance(new_territory)    

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_territory,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f" - assign territory '{data.name}' to user: {assigned_user.first_name} {assigned_user.last_name}"
    )

    return new_territory
