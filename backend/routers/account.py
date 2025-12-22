# backend/routers/account.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional

from database import get_db
from schemas.account import AccountBase, AccountCreate, AccountResponse, AccountUpdate
from .auth_utils import get_current_user
from models.auth import User
from models.account import Account, AccountStatus
from models.territory import Territory
from models.contact import Contact
from .logs_utils import serialize_instance, create_audit_log
from .ws_notification import broadcast_notification


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

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER"}


def _push_notif(
    background_tasks: BackgroundTasks,
    log_entry,
    target_user_id: int | None,
    notif_data: dict,
):
    """
    Standardize notification payload:
    - id = audit_log id (so /logs/mark-read/{id} works)
    - read = False for unread badge
    """
    if not target_user_id or not log_entry:
        return

    payload = dict(notif_data)
    payload["id"] = getattr(log_entry, "id", None)
    payload["read"] = False

    background_tasks.add_task(
        broadcast_notification,
        payload,
        target_user_id=target_user_id
    )


# ✅ CREATE account from converted lead
@router.post("/convertedLead", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    data: AccountBase,
    background_tasks: BackgroundTasks,
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
        status=normalize_account_status(data.status),
        territory_id=data.territory_id,
        assigned_to=data.assigned_to,
        created_by=data.created_by
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    new_data = serialize_instance(new_account)

    # ✅ Notify assigned user (fallback to creator if unassigned)
    target_user_id = new_account.assigned_to or new_account.created_by or current_user.id

    log_entry = create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_account,
        action="CREATE",
        request=request,
        new_data=new_data,
        target_user_id=target_user_id,
        custom_message=f"add '{new_account.name}' account from a converted lead"
    )

    _push_notif(
        background_tasks=background_tasks,
        log_entry=log_entry,
        target_user_id=target_user_id,
        notif_data={
            "type": "account_assignment",
            "title": f"New account assigned: {new_account.name}",
            "accountId": new_account.id,
            "assignedBy": f"{current_user.first_name} {current_user.last_name}",
            "createdAt": str(getattr(new_account, "created_at", None) or ""),
        },
    )

    return new_account


@router.get("/get/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single account by ID - accessible if user is in same company"""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Check if current_user is in the same company
    account_user = db.query(User).filter(User.id == account.assigned_to).first()
    if account_user and account_user.related_to_company != current_user.related_to_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this account"
        )    

    return account


@router.get("/admin/fetch-all", response_model=list[AccountResponse])
def admin_get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        accounts = (
            db.query(Account)
            .join(User, Account.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif current_user.role.upper() == "GROUP MANAGER":
        accounts = (
            db.query(Account)
            .join(User, Account.assigned_to == User.id)
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

        accounts = (
            db.query(Account)
            .join(User, Account.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                (User.id.in_(subquery_user_ids)) | 
                (Account.assigned_to == current_user.id) | # Leads owned by manager
                (Account.created_by == current_user.id)
            ).all()
        )
    else:
        accounts = (
            db.query(Account)
            .filter(
                (Account.assigned_to == current_user.id) | 
                (Account.created_by == current_user.id)
            ).all()
        )

    return accounts

@router.get("/sales/fetch-all", response_model=list[AccountResponse])
def admin_get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Account).join(User, Account.assigned_to == User.id)
    
    current_role = current_user.role.upper()

    if current_role in ["CEO", "ADMIN"]:
        return query.filter(User.related_to_company == current_user.related_to_company).all()

    if current_role == "GROUP MANAGER":
        return query.filter(
            User.related_to_company == current_user.related_to_company,
            ~User.role.in_(["CEO", "Admin"])
        ).all()

    # For MANAGERS and SALES:
    # We need to find accounts linked to deals they are assigned to
    from models import Deal # Ensure Deal model is imported
    
    # Subquery for accounts linked via Deals
    deal_account_ids = (
        db.query(Deal.account_id)
        .filter(Deal.assigned_to == current_user.id)
        .scalar_subquery()
    )

    if current_role == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )

        return query.filter(
            User.related_to_company == current_user.related_to_company
        ).filter(
            (User.id.in_(subquery_user_ids)) | 
            (Account.assigned_to == current_user.id) | 
            (Account.created_by == current_user.id) |
            (Account.id.in_(deal_account_ids)) # <--- NEW: Accounts linked to their deals
        ).all()
    
    else: # SALES
        return db.query(Account).filter(
            (Account.assigned_to == current_user.id) | 
            (Account.created_by == current_user.id) |
            (Account.id.in_(deal_account_ids)) # <--- NEW: Accounts linked to their deals
        ).all()

@router.get("/sales/contact/fetch-all", response_model=list[AccountResponse])
def admin_get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Account).join(User, Account.assigned_to == User.id)
    
    current_role = current_user.role.upper()

    if current_role in ["CEO", "ADMIN"]:
        return query.filter(User.related_to_company == current_user.related_to_company).all()

    if current_role == "GROUP MANAGER":
        return query.filter(
            User.related_to_company == current_user.related_to_company,
            ~User.role.in_(["CEO", "Admin"])
        ).all()

    # For MANAGERS and SALES:
    # We need to find accounts linked to deals they are assigned to
    from models import Deal # Ensure Deal model is imported
    
    # Subquery for accounts linked via Deals
    contact_account_ids = (
        db.query(Contact.account_id)
        .filter(Contact.assigned_to == current_user.id)
        .scalar_subquery()
    )

    if current_role == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )

        return query.filter(
            User.related_to_company == current_user.related_to_company
        ).filter(
            (User.id.in_(subquery_user_ids)) | 
            (Account.assigned_to == current_user.id) | 
            (Account.created_by == current_user.id) |
            (Account.id.in_(contact_account_ids)) # <--- NEW: Accounts linked to their deals
        ).all()
    
    else: # SALES
        return db.query(Account).filter(
            (Account.assigned_to == current_user.id) | 
            (Account.created_by == current_user.id) |
            (Account.id.in_(contact_account_ids)) # <--- NEW: Accounts linked to their deals
        ).all()


@router.post("/admin", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def admin_create_account(
    data: AccountCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
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

    target_user_id = new_account.assigned_to or new_account.created_by

    log_entry = create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_account,
        action="CREATE",
        request=request,
        new_data=new_data,
        target_user_id=target_user_id,
        custom_message=f"create account '{new_account.name}'"
    )

    _push_notif(
        background_tasks=background_tasks,
        log_entry=log_entry,
        target_user_id=target_user_id,
        notif_data={
            "type": "account_assignment",
            "title": f"New account assigned: {new_account.name}",
            "accountId": new_account.id,
            "assignedBy": f"{current_user.first_name} {current_user.last_name}",
            "createdAt": str(getattr(new_account, "created_at", None) or ""),
        },
    )

    return new_account


@router.put("/admin/{account_id}", response_model=AccountResponse)
def admin_update_account(
    account_id: int,
    data: AccountUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):

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

    old_assigned_to = account.assigned_to
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

    target_user_id = account.assigned_to or account.created_by

    log_entry = create_audit_log(
        db=db,
        current_user=current_user,
        instance=account,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        target_user_id=target_user_id,
        custom_message=f"update account '{account.name}' via admin panel{reassigned_fragment}"
    )

    was_reassigned = ("assigned_to" in update_data) and (old_assigned_to != account.assigned_to)
    notif_type = "account_assignment" if was_reassigned else "account_update"
    notif_title = (
        f"New account assigned: {account.name}"
        if was_reassigned
        else f"Account updated: {account.name}"
    )

    _push_notif(
        background_tasks=background_tasks,
        log_entry=log_entry,
        target_user_id=target_user_id,
        notif_data={
            "type": notif_type,
            "title": notif_title,
            "accountId": account.id,
            "assignedBy": f"{current_user.first_name} {current_user.last_name}",
            "createdAt": str(getattr(account, "updated_at", None) or getattr(account, "created_at", None) or ""),
        },
    )

    return account


@router.delete("/admin/{account_id}", status_code=status.HTTP_200_OK)
def admin_delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
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
    target_user_id = account.assigned_to or account.created_by

    db.delete(account)
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=account,
        action="DELETE",
        request=request,
        old_data=deleted_data,
        target_user_id=target_user_id,
        custom_message=f"delete account '{account_name}' via admin panel"
    )

    return {"detail": f"Account '{account_name}' deleted successfully."}
