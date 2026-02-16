# backend/routers/deal.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from schemas.deal import DealBase, DealResponse, DealCreate, DealUpdate, DealBulkDelete
from .auth_utils import get_current_user
from models.auth import User
from models.deal import Deal, DealStage, DealStatus, STAGE_PROBABILITY_MAP
from models.account import Account
from models.contact import Contact
from .logs_utils import serialize_instance, create_audit_log
from .ws_notification import broadcast_notification
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import joinedload
from models.territory import Territory

router = APIRouter(
    prefix="/deals",
    tags=["Deals"]
)

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER", "SALES"}


def _push_notif(
    background_tasks: BackgroundTasks,
    log_entry,
    target_user_id: int | None,
    notif_data: dict,
):
    """
    Standard notification payload:
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


def _validate_amount(amount: float | None):
    if amount is None:
        return
    if amount > 99999999.99:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deal amount cannot exceed 99,999,999.99"
        )
    if amount < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deal amount cannot be negative"
        )


@router.post("/convertedLead", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    data: DealBase,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    _validate_amount(getattr(data, "amount", None))

    # Stage + probability safety (if stage is present)
    stage_value = getattr(data, "stage", None)
    stage_upper = stage_value.upper() if isinstance(stage_value, str) else stage_value

    probability = getattr(data, "probability", None)
    if stage_upper and probability is None:
        # compute from stage if not provided
        try:
            stage_enum = DealStage(stage_upper)
            probability = STAGE_PROBABILITY_MAP.get(stage_enum, 10)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid stage '{stage_value}'. Allowed: {[s.value for s in DealStage]}"
            )

    new_deal = Deal(
        name=data.name,
        account_id=data.account_id,
        primary_contact_id=data.primary_contact_id,
        stage=stage_upper,
        probability=probability,
        amount=data.amount,
        currency=data.currency,
        description=data.description,
        assigned_to=data.assigned_to,
        created_by=current_user.id,
    )

    # ✅ Single commit approach: flush -> generate_deal_id(db) -> commit
    db.add(new_deal)
    db.flush()
    new_deal.generate_deal_id(db)
    db.commit()
    db.refresh(new_deal)

    new_data = serialize_instance(new_deal)

    # ✅ Notify assigned user (fallback to creator if unassigned)
    target_user_id = new_deal.assigned_to or new_deal.created_by

    log_entry = create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_deal,
        action="CREATE",
        request=request,
        new_data=new_data,
        target_user_id=target_user_id,
        custom_message=f"add '{new_deal.name}' deal from a converted lead"
    )

    _push_notif(
        background_tasks=background_tasks,
        log_entry=log_entry,
        target_user_id=target_user_id,
        notif_data={
            "type": "deal_assignment",
            "title": f"New deal assigned: {new_deal.name}",
            "dealId": new_deal.id,
            "accountId": new_deal.account_id,
            "assignedBy": f"{current_user.first_name} {current_user.last_name}",
            "createdAt": str(getattr(new_deal, "created_at", None) or ""),
        },
    )

    return new_deal


@router.get("/admin/fetch-all", response_model=list[DealResponse])
def admin_get_deals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        # Admin users can see all deals including archived ones
        deals = (
            db.query(Deal)
            .join(User, Deal.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .options(joinedload(Deal.deal_creator))
            .all()
        )
    elif current_user.role.upper() == "GROUP MANAGER":
        deals = (
            db.query(Deal)
            .join(User, Deal.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .filter(Deal.status != DealStatus.INACTIVE.value)
            .options(joinedload(Deal.deal_creator))
            .all()
        )
    elif current_user.role.upper() == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )

        deals = (
            db.query(Deal)
            .join(User, Deal.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                (User.id.in_(subquery_user_ids)) | 
                (Deal.assigned_to == current_user.id) |
                (Deal.created_by == current_user.id)
            )
            .filter(Deal.status != DealStatus.INACTIVE.value)
            .options(joinedload(Deal.deal_creator))
            .all()
        )
    else:
        deals = (
            db.query(Deal)
            .filter(
                (Deal.assigned_to == current_user.id) | 
                (Deal.created_by == current_user.id)
            )
            .filter(Deal.status != DealStatus.INACTIVE.value)
            .options(joinedload(Deal.deal_creator))
            .all()
        )

    return deals


@router.get("/from-acc/{accID}", response_model=list[DealResponse])
def admin_get_deals_from_acc(
    accID: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_users = db.query(User.id).filter(
        User.related_to_company == current_user.related_to_company
    ).subquery()

    deals = db.query(Deal).filter(
        (Deal.created_by.in_(company_users)) | (Deal.assigned_to.in_(company_users))
    ).filter(Deal.account_id == accID).all()

    return deals


@router.post("/admin/create", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def admin_create_deal(
    data: DealCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not current_user.related_to_company:
        raise HTTPException(status_code=400, detail="Current user is not linked to any company.")

    # Validate account exists
    account = db.query(Account).filter(Account.id == data.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    # Verify account belongs to same company
    account_creator = db.query(User).filter(User.id == account.created_by).first()
    if not account_creator or account_creator.related_to_company != current_user.related_to_company:
        raise HTTPException(status_code=403, detail="Account does not belong to your company.")

    # Validate contact (if provided)
    if data.primary_contact_id:
        contact = db.query(Contact).filter(Contact.id == data.primary_contact_id).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found.")
        contact_creator = db.query(User).filter(User.id == contact.created_by).first()
        if not contact_creator or contact_creator.related_to_company != current_user.related_to_company:
            raise HTTPException(status_code=403, detail="Contact does not belong to your company.")

    # Validate assigned user (if provided)
    assigned_user = None
    if data.assigned_to:
        assigned_user = db.query(User).filter(
            User.id == data.assigned_to,
            User.related_to_company == current_user.related_to_company
        ).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found in your company.")

    _validate_amount(getattr(data, "amount", None))

    # Validate stage safely
    stage_upper = (data.stage or "").upper()
    try:
        stage_enum = DealStage(stage_upper)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid stage '{data.stage}'. Allowed: {[s.value for s in DealStage]}"
        )

    probability = STAGE_PROBABILITY_MAP.get(stage_enum, 10)

    new_deal = Deal(
        name=data.name,
        account_id=data.account_id,
        primary_contact_id=data.primary_contact_id,
        stage=stage_upper,
        probability=probability,
        amount=data.amount,
        currency=data.currency or "PHP",
        close_date=data.close_date,
        description=data.description,
        assigned_to=data.assigned_to,
        created_by=current_user.id,
    )

    db.add(new_deal)
    db.flush()
    new_deal.generate_deal_id(db)
    db.commit()
    db.refresh(new_deal)

    new_data = serialize_instance(new_deal)

    assigned_fragment = ""
    if assigned_user:
        assigned_fragment = f" assigned to '{assigned_user.first_name} {assigned_user.last_name}'"

    # ✅ Notify assigned user (fallback creator if unassigned)
    target_user_id = new_deal.assigned_to or new_deal.created_by

    log_entry = create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_deal,
        action="CREATE",
        request=request,
        new_data=new_data,
        target_user_id=target_user_id,
        custom_message=f"create deal '{new_deal.name}'"
    )

    _push_notif(
        background_tasks=background_tasks,
        log_entry=log_entry,
        target_user_id=target_user_id,
        notif_data={
            "type": "deal_assignment",
            "title": f"New deal assigned: {new_deal.name}",
            "dealId": new_deal.id,
            "accountId": new_deal.account_id,
            "assignedBy": f"{current_user.first_name} {current_user.last_name}",
            "createdAt": str(getattr(new_deal, "created_at", None) or ""),
        },
    )

    return new_deal


@router.put("/admin/{deal_id}", response_model=DealResponse)
def admin_update_deal(
    deal_id: int,
    data: DealUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Verify deal belongs to same company
    deal_creator = db.query(User).filter(User.id == deal.created_by).first()
    if not deal_creator or deal_creator.related_to_company != current_user.related_to_company:
        raise HTTPException(status_code=403, detail="Not authorized to access this deal")

    old_data = serialize_instance(deal)
    old_assigned_to = deal.assigned_to

    # Update fields if provided
    if data.name is not None:
        deal.name = data.name

    if data.account_id is not None:
        # ... (keep existing account validation) ...
        deal.account_id = data.account_id

    if data.primary_contact_id is not None:
        # ... (keep existing contact validation) ...
        deal.primary_contact_id = data.primary_contact_id

    # ✅ 2. UPDATED LOGIC HERE
    if data.stage is not None:
        stage_upper = data.stage.upper()
        try:
            stage_enum = DealStage(stage_upper)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid stage '{data.stage}'. Allowed: {[s.value for s in DealStage]}"
            )
        
        # Check if the stage is ACTUALLY changing
        if deal.stage != stage_upper:
            # A. Reset the "Bottleneck Timer"
            deal.stage_updated_at = datetime.now()
            
            # B. Auto-update Probability (Business View)
            # This ensures your "Weighted Forecast" is always accurate
            deal.probability = STAGE_PROBABILITY_MAP.get(stage_enum, deal.probability)

        deal.stage = stage_upper

    if data.amount is not None:
        _validate_amount(data.amount)
        deal.amount = data.amount

    if data.currency is not None:
        deal.currency = data.currency

    if data.close_date is not None:
        deal.close_date = data.close_date
    if data.description is not None:
        deal.description = data.description

    if data.assigned_to is not None:
        if data.assigned_to == 0:
            deal.assigned_to = None
        else:
            assigned_user = db.query(User).filter(
                User.id == data.assigned_to,
                User.related_to_company == current_user.related_to_company
            ).first()
            if not assigned_user:
                raise HTTPException(status_code=404, detail="Assigned user not found in your company.")
            deal.assigned_to = data.assigned_to

    db.commit()
    db.refresh(deal)

    # ✅ Notify assigned user (fallback creator if unassigned)
    target_user_id = deal.assigned_to or deal.created_by

    log_entry = create_audit_log(
        db=db,
        current_user=current_user,
        instance=deal,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=serialize_instance(deal),
        target_user_id=target_user_id,
        custom_message=f"updated deal '{deal.name}' via admin panel"
    )

    was_reassigned = (data.assigned_to is not None) and (old_assigned_to != deal.assigned_to)
    notif_type = "deal_assignment" if was_reassigned else "deal_update"
    notif_title = (
        f"New deal assigned: {deal.name}" if was_reassigned else f"Deal updated: {deal.name}"
    )

    _push_notif(
        background_tasks=background_tasks,
        log_entry=log_entry,
        target_user_id=target_user_id,
        notif_data={
            "type": notif_type,
            "title": notif_title,
            "dealId": deal.id,
            "accountId": deal.account_id,
            "assignedBy": f"{current_user.first_name} {current_user.last_name}",
            "createdAt": str(getattr(deal, "updated_at", None) or getattr(deal, "created_at", None) or ""),
        },
    )

    return deal


@router.delete("/admin/bulk-delete", status_code=status.HTTP_200_OK)
def admin_bulk_delete_deals(
    data: DealBulkDelete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not data.deal_ids:
        return {"detail": "No deals provided for deletion."}

    company_users = (
        db.query(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    deals_to_delete = db.query(Deal).filter(
        Deal.id.in_(data.deal_ids),
        ((Deal.created_by.in_(company_users)) | (Deal.assigned_to.in_(company_users)))
    ).all()

    if not deals_to_delete:
        raise HTTPException(status_code=404, detail="No matching deals found for deletion.")

    deleted_count = 0
    for deal in deals_to_delete:
        deleted_data = serialize_instance(deal)
        deal_name = deal.name
        target_user_id = deal.assigned_to or deal.created_by

        db.delete(deal)
        
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=deal,
            action="DELETE",
            request=request,
            old_data=deleted_data,
            target_user_id=target_user_id,
            custom_message=f"bulk delete deal '{deal_name}' via admin panel"
        )
        deleted_count += 1

    db.commit()

    return {"detail": f"Successfully deleted {deleted_count} deal(s)."}


@router.put("/bulk-archive", status_code=status.HTTP_200_OK)
def bulk_archive_deals(
    data: DealBulkDelete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Bulk archive deals - All non-admin roles (GROUP MANAGER, MANAGER, SALES) can only archive deals they created"""
    from models.deal import DealStatus
    
    # Only non-admin roles can use this endpoint
    if current_user.role.upper() not in ["GROUP MANAGER", "MANAGER", "SALES"]:
        raise HTTPException(status_code=403, detail="Permission denied - only non-admin roles can archive deals")

    if not data.deal_ids:
        return {"detail": "No deals provided for archiving."}

    # All non-admin roles can only archive their own deals
    deals_to_archive = db.query(Deal).filter(
        Deal.id.in_(data.deal_ids),
        Deal.created_by == current_user.id
    ).all()

    if not deals_to_archive:
        raise HTTPException(status_code=404, detail="No matching deals found for archiving.")

    archived_count = 0
    for deal in deals_to_archive:
        old_data = serialize_instance(deal)
        deal_name = deal.name
        
        # Mark as INACTIVE instead of hard delete
        deal.status = DealStatus.INACTIVE.value
        db.flush()
        new_data = serialize_instance(deal)
        
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=deal,
            action="UPDATE",
            request=request,
            old_data=old_data,
            new_data=new_data,
            custom_message=f"archive deal '{deal_name}'"
        )
        archived_count += 1

    db.commit()

    return {"detail": f"Successfully archived {archived_count} deal(s)."}


@router.put("/single-archive/{deal_id}", status_code=status.HTTP_200_OK)
def archive_single_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Archive a single deal - Only non-admin roles (GROUP MANAGER, MANAGER, SALES) can archive deals they created"""
    from models.deal import DealStatus
    
    # Only non-admin roles can use this endpoint
    if current_user.role.upper() not in ["GROUP MANAGER", "MANAGER", "SALES"]:
        raise HTTPException(status_code=403, detail="Permission denied - only non-admin roles can archive deals")

    # Non-admin roles can only archive deals they created
    deal = db.query(Deal).filter(
        Deal.id == deal_id,
        Deal.created_by == current_user.id
    ).first()

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found or you don't have permission to archive it.")

    old_data = serialize_instance(deal)
    deal_name = deal.name
    
    # Mark as INACTIVE instead of hard delete
    deal.status = DealStatus.INACTIVE.value
    db.flush()
    new_data = serialize_instance(deal)
    
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=deal,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        custom_message=f"archive deal '{deal_name}'"
    )
    
    db.commit()

    return {"detail": f"Deal '{deal_name}' archived successfully."}


@router.delete("/admin/{deal_id}", status_code=status.HTTP_200_OK)
def admin_delete_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    deal_creator = db.query(User).filter(User.id == deal.created_by).first()
    if not deal_creator or deal_creator.related_to_company != current_user.related_to_company:
        raise HTTPException(status_code=403, detail="Not authorized to access this deal")

    old_data = serialize_instance(deal)
    deal_name = deal.name
    target_user_id = deal.assigned_to or deal.created_by

    db.delete(deal)
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=deal,
        action="DELETE",
        request=request,
        old_data=old_data,
        target_user_id=target_user_id,
        custom_message=f"deleted deal '{deal_name}' via admin panel"
    )

    return {"detail": f"Deal '{deal_name}' deleted successfully."}
