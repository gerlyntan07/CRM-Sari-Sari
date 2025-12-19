from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from schemas.account import AccountBase, AccountCreate, AccountResponse, AccountUpdate
from .auth_utils import get_current_user
from models.auth import User
from typing import Optional
from models.account import Account, AccountStatus
from models.territory import Territory
from .logs_utils import serialize_instance, create_audit_log


def normalize_account_status(status: Optional[str]) -> Optional[str]:
    if not status:
        return status
    normalized = status.strip()
    if not normalized:
        return None
    lowered = normalized.lower()
    for choice in AccountStatus:
        if choice.value.lower() == lowered:
            return choice.value
    return normalized

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
    company_users = (
        select(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    # Fetch all accounts created by OR assigned to those users
    accounts = db.query(Account).filter(
        (Account.created_by.in_(company_users)) | (Account.assigned_to.in_(company_users))
    ).all()

    return accounts


@router.post("/admin", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def admin_create_account(
    data: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not current_user.related_to_company:
        raise HTTPException(status_code=400, detail="Current user is not linked to any company.")

    assigned_user = None
    if data.assigned_to:
        assigned_user = db.query(User).filter(
            User.id == data.assigned_to,
            User.related_to_company == current_user.related_to_company
        ).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found in your company.")

    if data.territory_id:
        territory = db.query(Territory).filter(
            Territory.id == data.territory_id,
            Territory.company_id == current_user.related_to_company
        ).first()
        if not territory:
            raise HTTPException(status_code=404, detail="Territory not found in your company.")

    created_by_user_id = data.created_by or current_user.id
    created_by_user = db.query(User).filter(User.id == created_by_user_id).first()
    if not created_by_user or created_by_user.related_to_company != current_user.related_to_company:
        raise HTTPException(status_code=404, detail="Creator is not part of your company.")

    new_account = Account(
        name=data.name,
        website=data.website,
        phone_number=data.phone_number,
        billing_address=data.billing_address,
        shipping_address=data.shipping_address,
        industry=data.industry,
        status=normalize_account_status(data.status),
        territory_id=data.territory_id,
        assigned_to=data.assigned_to,
        created_by=created_by_user_id
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    new_data = serialize_instance(new_account)

    assigned_fragment = ""
    if assigned_user:
        assigned_fragment = f" assigned to '{assigned_user.first_name} {assigned_user.last_name}'"

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_account,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"create account '{data.name}' via admin panel{assigned_fragment}"
    )

    return new_account


@router.put("/admin/{account_id}", response_model=AccountResponse)
def admin_update_account(
    account_id: int,
    data: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
        raise HTTPException(status_code=403, detail="Permission denied")

    company_users = (
        select(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    account = db.query(Account).filter(
        Account.id == account_id,
        ((Account.created_by.in_(company_users)) | (Account.assigned_to.in_(company_users)))
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    update_data = data.model_dump(exclude_unset=True)

    assigned_user_name = None
    if "assigned_to" in update_data:
        assigned_to = update_data["assigned_to"]
        if assigned_to is not None:
            assigned_user = db.query(User).filter(
                User.id == assigned_to,
                User.related_to_company == current_user.related_to_company
            ).first()
            if not assigned_user:
                raise HTTPException(status_code=404, detail="Assigned user not found in your company.")
            assigned_user_name = f"{assigned_user.first_name} {assigned_user.last_name}"
        else:
            assigned_user_name = "unassigned"

    if "territory_id" in update_data and update_data["territory_id"] is not None:
        territory = db.query(Territory).filter(
            Territory.id == update_data["territory_id"],
            Territory.company_id == current_user.related_to_company
        ).first()
        if not territory:
            raise HTTPException(status_code=404, detail="Territory not found in your company.")

    old_data = serialize_instance(account)

    if "status" in update_data:
        update_data["status"] = normalize_account_status(update_data["status"])

    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)

    new_data = serialize_instance(account)

    reassigned_fragment = ""
    if assigned_user_name:
        reassigned_fragment = f" - reassigned to {assigned_user_name}"

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=account,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        custom_message=f"update account '{account.name}' via admin panel{reassigned_fragment}"
    )

    return account


@router.delete("/admin/{account_id}", status_code=status.HTTP_200_OK)
def admin_delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
        raise HTTPException(status_code=403, detail="Permission denied")

    company_users = (
        select(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    account = db.query(Account).filter(
        Account.id == account_id,
        ((Account.created_by.in_(company_users)) | (Account.assigned_to.in_(company_users)))
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    deleted_data = serialize_instance(account)
    account_name = account.name

    db.delete(account)
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=account,
        action="DELETE",
        request=request,
        old_data=deleted_data,
        custom_message=f"delete account '{account_name}' via admin panel"
    )

    return {"detail": f"Account '{account_name}' deleted successfully."}
