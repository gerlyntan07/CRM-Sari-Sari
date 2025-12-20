from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, text
from typing import List

from database import get_db
from schemas.quote import QuoteCreate, QuoteResponse, QuoteUpdate
from .auth_utils import get_current_user

from models.auth import User
from models.quote import Quote, QuoteStatus
from models.contact import Contact
from models.account import Account
from models.deal import Deal  # ✅ make sure you have this model

from .logs_utils import serialize_instance, create_audit_log


router = APIRouter(prefix="/quotes", tags=["Quotes"])

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER", "SALES"}


def normalize_status(status_value: str | None) -> str:
    if not status_value:
        return QuoteStatus.DRAFT.value

    s = status_value.strip().lower()
    mapping = {
        "draft": QuoteStatus.DRAFT.value,
        "presented": QuoteStatus.PRESENTED.value,
        "accepted": QuoteStatus.ACCEPTED.value,
        "rejected": QuoteStatus.REJECTED.value,
    }
    return mapping.get(s, QuoteStatus.DRAFT.value)


def deal_label(deal: Deal | None) -> str:
    if not deal:
        return "N/A"
    return getattr(deal, "deal_name", None) or getattr(deal, "name", None) or f"Deal #{deal.id}"


@router.get("/admin/fetch-all", response_model=List[QuoteResponse])
def admin_get_quotes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    company_users = (
        select(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    quotes = (
        db.query(Quote)
        .options(
            joinedload(Quote.creator),
            joinedload(Quote.assigned_user),
            joinedload(Quote.contact),
            joinedload(Quote.account),
            joinedload(Quote.deal),
        )
        .filter((Quote.created_by.in_(company_users)) | (Quote.assigned_to.in_(company_users)))
        .all()
    )

    return quotes


@router.post("/admin", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
def admin_create_quote(
    data: QuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not current_user.related_to_company:
        raise HTTPException(status_code=400, detail="Current user is not linked to any company.")

    created_by_user = db.query(User).filter(
        User.id == data.created_by_id,
        User.related_to_company == current_user.related_to_company
    ).first()
    if not created_by_user:
        raise HTTPException(status_code=404, detail="Created by user not found in your company.")

    assigned_user = None
    if data.assigned_to:
        assigned_user = db.query(User).filter(
            User.id == data.assigned_to,
            User.related_to_company == current_user.related_to_company
        ).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found in your company.")

    deal = None
    if data.deal_id:
        deal = db.query(Deal).filter(Deal.id == data.deal_id).first()
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found.")

    contact = None
    if data.contact_id:
        contact = db.query(Contact).filter(Contact.id == data.contact_id).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found.")

    account = None
    account_id_final = data.account_id

    # Auto-set account_id from contact if available and account_id not provided
    if contact is not None and not account_id_final and getattr(contact, "account_id", None):
        account_id_final = contact.account_id

    if account_id_final:
        account = db.query(Account).filter(Account.id == account_id_final).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found.")

    if data.validity_days is not None and data.validity_days < 0:
        raise HTTPException(status_code=400, detail="Validity days must be >= 0.")

    new_quote = Quote(
        deal_id=data.deal_id,
        contact_id=data.contact_id,
        account_id=account_id_final,
        total_amount=data.total_amount,
        presented_date=data.presented_date,
        validity_days=data.validity_days,
        status=normalize_status(data.status),
        assigned_to=data.assigned_to,
        created_by=data.created_by_id,
        notes=data.notes,
        updated_at=None,
    )

    db.add(new_quote)
    db.commit()
    db.refresh(new_quote)

    # Generate quote_id AFTER commit (needs self.id)
    quote_id_value = new_quote.generate_quote_id(db)

    # Avoid setting updated_at on this update
    db.execute(
        text("UPDATE quotes SET quote_id = :quote_id, updated_at = NULL WHERE id = :id"),
        {"quote_id": quote_id_value, "id": new_quote.id},
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
        custom_message=f"create quote '{new_quote.quote_id}' for {deal_label(new_quote.deal)} via admin panel{assigned_fragment}",
    )

    return new_quote


@router.put("/admin/{quote_id}", response_model=QuoteResponse)
def admin_update_quote(
    quote_id: int,
    data: QuoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    company_users = (
        select(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    quote = db.query(Quote).options(
        joinedload(Quote.deal),
        joinedload(Quote.account),
        joinedload(Quote.contact),
        joinedload(Quote.creator),
        joinedload(Quote.assigned_user),
    ).filter(
        Quote.id == quote_id,
        ((Quote.created_by.in_(company_users)) | (Quote.assigned_to.in_(company_users)))
    ).first()

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    old_data = serialize_instance(quote)
    update_data = data.model_dump(exclude_unset=True)

    assigned_user_name = None
    if "assigned_to" in update_data and update_data["assigned_to"]:
        assigned_user = db.query(User).filter(
            User.id == update_data["assigned_to"],
            User.related_to_company == current_user.related_to_company
        ).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found in your company.")
        assigned_user_name = f"{assigned_user.first_name} {assigned_user.last_name}"

    if "deal_id" in update_data and update_data["deal_id"]:
        deal = db.query(Deal).filter(Deal.id == update_data["deal_id"]).first()
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found.")

    contact = None
    if "contact_id" in update_data and update_data["contact_id"]:
        contact = db.query(Contact).filter(Contact.id == update_data["contact_id"]).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found.")

    # If contact changed and account_id not explicitly updated, auto-set account_id from contact
    if contact is not None and "account_id" not in update_data and getattr(contact, "account_id", None):
        update_data["account_id"] = contact.account_id

    if "account_id" in update_data and update_data["account_id"]:
        account = db.query(Account).filter(Account.id == update_data["account_id"]).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found.")

    if "validity_days" in update_data and update_data["validity_days"] is not None:
        if update_data["validity_days"] < 0:
            raise HTTPException(status_code=400, detail="Validity days must be >= 0.")

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
        custom_message=f"update quote '{quote.quote_id or quote.id}' ({deal_label(quote.deal)}) via admin panel{reassigned_fragment}",
    )

    return quote


@router.delete("/admin/{quote_id}", status_code=status.HTTP_200_OK)
def admin_delete_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
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
    quote_label = quote.quote_id or f"Quote #{quote.id}"

    db.delete(quote)
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="DELETE",
        request=request,
        old_data=deleted_data,
        custom_message=f"delete quote '{quote_label}' via admin panel",
    )

    return {"detail": f"Quote '{quote_label}' deleted successfully."}


@router.patch("/admin/{quote_id}/status", response_model=QuoteResponse)
def admin_update_quote_status(
    quote_id: int,
    status_value: str = Query(..., description="New status for the quote"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
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
    quote.status = normalize_status(status_value)

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
        custom_message=f"update quote '{quote.quote_id or quote.id}' status to '{quote.status}' via admin panel",
    )

    return quote
