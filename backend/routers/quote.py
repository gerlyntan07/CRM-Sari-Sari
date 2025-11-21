from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from typing import List
from database import get_db
from schemas.quote import QuoteCreate, QuoteResponse, QuoteUpdate
from .auth_utils import get_current_user
from models.auth import User
from models.quote import Quote
from models.contact import Contact
from models.account import Account
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/quotes",
    tags=["Quotes"]
)

ALLOWED_ADMIN_ROLES = {'CEO', 'ADMIN', 'GROUP MANAGER'}


def normalize_status(status: str | None) -> str:
    """Normalize status to match enum values"""
    if not status:
        return "Draft"
    return status.strip().capitalize()


@router.get("/admin/fetch-all", response_model=List[QuoteResponse])
def admin_get_quotes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Get all users in the same company
    company_users = (
        select(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    # Fetch all quotes created by OR assigned to those users with relationships loaded
    quotes = (
        db.query(Quote)
        .options(
            joinedload(Quote.creator),
            joinedload(Quote.assigned_user),
            joinedload(Quote.contact),
            joinedload(Quote.account)
        )
        .filter(
            (Quote.created_by.in_(company_users)) | (Quote.assigned_to.in_(company_users))
        )
        .all()
    )

    return quotes


@router.post("/admin", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
def admin_create_quote(
    data: QuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not current_user.related_to_company:
        raise HTTPException(status_code=400, detail="Current user is not linked to any company.")

    # Validate created_by user
    created_by_user = db.query(User).filter(
        User.id == data.created_by_id,
        User.related_to_company == current_user.related_to_company
    ).first()
    if not created_by_user:
        raise HTTPException(status_code=404, detail="Created by user not found in your company.")

    # Validate assigned_to user if provided
    assigned_user = None
    if data.assigned_to:
        assigned_user = db.query(User).filter(
            User.id == data.assigned_to,
            User.related_to_company == current_user.related_to_company
        ).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found in your company.")

    # Validate contact if provided
    if data.contact_id:
        contact = db.query(Contact).filter(
            Contact.id == data.contact_id
        ).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found.")

    # Validate account if provided
    if data.account_id:
        account = db.query(Account).filter(
            Account.id == data.account_id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found.")

    new_quote = Quote(
        deal_name=data.deal_name,
        contact_id=data.contact_id,
        account_id=data.account_id,
        amount=data.amount,
        total_amount=data.total_amount,
        presented_date=data.presented_date,
        validity_date=data.validity_date,
        status=normalize_status(data.status),
        assigned_to=data.assigned_to,
        created_by=data.created_by_id,
        notes=data.notes,
        updated_at=None  # Ensure updated_at is None on creation
    )

    db.add(new_quote)
    db.commit()
    db.refresh(new_quote)

    # Generate quote_id after commit
    # Use direct SQL update to avoid triggering onupdate for updated_at
    quote_id_value = new_quote.generate_quote_id()
    from sqlalchemy import text
    db.execute(
        text("UPDATE quotes SET quote_id = :quote_id, updated_at = NULL WHERE id = :id"),
        {"quote_id": quote_id_value, "id": new_quote.id}
    )
    db.commit()
    db.refresh(new_quote)

    new_data = serialize_instance(new_quote)

    assigned_fragment = ""
    if assigned_user:
        assigned_fragment = f" assigned to '{assigned_user.first_name} {assigned_user.last_name}'"

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_quote,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"create quote '{data.deal_name}' via admin panel{assigned_fragment}"
    )

    return new_quote


@router.put("/admin/{quote_id}", response_model=QuoteResponse)
def admin_update_quote(
    quote_id: int,
    data: QuoteUpdate,
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

    quote = db.query(Quote).filter(
        Quote.id == quote_id,
        ((Quote.created_by.in_(company_users)) | (Quote.assigned_to.in_(company_users)))
    ).first()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    old_data = serialize_instance(quote)
    update_data = data.model_dump(exclude_unset=True)

    # Validate assigned_to user if being updated
    assigned_user_name = None
    if "assigned_to" in update_data and update_data["assigned_to"]:
        assigned_user = db.query(User).filter(
            User.id == update_data["assigned_to"],
            User.related_to_company == current_user.related_to_company
        ).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found in your company.")
        assigned_user_name = f"{assigned_user.first_name} {assigned_user.last_name}"

    # Validate contact if being updated
    if "contact_id" in update_data and update_data["contact_id"]:
        contact = db.query(Contact).filter(Contact.id == update_data["contact_id"]).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found.")

    # Validate account if being updated
    if "account_id" in update_data and update_data["account_id"]:
        account = db.query(Account).filter(Account.id == update_data["account_id"]).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found.")

    # Normalize status if being updated
    if "status" in update_data:
        update_data["status"] = normalize_status(update_data["status"])

    for field, value in update_data.items():
        setattr(quote, field, value)

    db.commit()
    db.refresh(quote)

    new_data = serialize_instance(quote)

    reassigned_fragment = ""
    if assigned_user_name:
        reassigned_fragment = f" - reassigned to {assigned_user_name}"

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        custom_message=f"update quote '{quote.deal_name}' via admin panel{reassigned_fragment}"
    )

    return quote


@router.delete("/admin/{quote_id}", status_code=status.HTTP_200_OK)
def admin_delete_quote(
    quote_id: int,
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

    quote = db.query(Quote).filter(
        Quote.id == quote_id,
        ((Quote.created_by.in_(company_users)) | (Quote.assigned_to.in_(company_users)))
    ).first()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    deleted_data = serialize_instance(quote)
    quote_name = quote.deal_name

    db.delete(quote)
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="DELETE",
        request=request,
        old_data=deleted_data,
        custom_message=f"delete quote '{quote_name}' via admin panel"
    )

    return {"detail": f"Quote '{quote_name}' deleted successfully."}


@router.patch("/admin/{quote_id}/status", response_model=QuoteResponse)
def admin_update_quote_status(
    quote_id: int,
    status: str = Query(..., description="New status for the quote"),
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

    quote = db.query(Quote).filter(
        Quote.id == quote_id,
        ((Quote.created_by.in_(company_users)) | (Quote.assigned_to.in_(company_users)))
    ).first()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    old_data = serialize_instance(quote)
    quote.status = normalize_status(status)
    db.commit()
    db.refresh(quote)

    new_data = serialize_instance(quote)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        custom_message=f"update quote '{quote.deal_name}' status to '{status}' via admin panel"
    )

    return quote

