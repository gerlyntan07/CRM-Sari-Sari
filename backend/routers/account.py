from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.account import AccountBase, AccountResponse
from schemas.auth import UserResponse, UserWithTerritories
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from models.account import Account
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/accounts",
    tags=["Accounts"]
)

# ✅ CREATE new territory
@router.post("/convertedLead", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    data: AccountBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):                    

    new_account = Account(
        name=data.name,
        website=data.website,
        phone_number=data.phone_number,
        billing_address=data.billing_address,
        shipping_address=data.shipping_address,
        industry=data.industry,
        status=data.status,
        territory_id=data.territory_id,
        assigned_to=data.assigned_to,
        created_by=data.created_by        
    )
    
    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    new_data = serialize_instance(new_account)    

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_account,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"add '{data.name}' account from a converted lead"
    )

    return new_account


@router.get("/admin/fetch-all", response_model=list[AccountResponse])
def admin_get_accounts(    
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):        
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Get all users in the same company
    company_users = db.query(User.id).filter(User.related_to_company == current_user.related_to_company).subquery()

    # Fetch all accounts created by OR assigned to those users
    accounts = db.query(Account).filter(
        (Account.created_by.in_(company_users)) | (Account.assigned_to.in_(company_users))
    ).all()

    return accounts
