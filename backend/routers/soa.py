from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.account import Account
from models.auth import User
from models.company import Company
from models.soa import SoaItem, SoaStatus, StatementOfAccount
from schemas.soa import SoaCreate, SoaResponse, SoaUpdate
from .auth_utils import get_current_user
from .logs_utils import create_audit_log, serialize_instance


router = APIRouter(prefix="/soas", tags=["Statements of Account"])

ALLOWED_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER", "SALES"}


def normalize_status(status_value: str | None) -> str:
    if not status_value:
        return SoaStatus.DRAFT.value

    s = status_value.strip().lower()
    mapping = {
        "draft": SoaStatus.DRAFT.value,
        "presented": SoaStatus.PRESENTED.value,
        "paid": SoaStatus.PAID.value,
    }
    return mapping.get(s, SoaStatus.DRAFT.value)


def infer_currency_code(company_currency_symbol: str | None) -> str:
    symbol = (company_currency_symbol or "").strip()
    if symbol == "₱":
        return "PHP"
    if symbol == "$":
        return "USD"
    return "PHP"


def can_transition_status(current_status: str, new_status: str) -> bool:
    """Allow forward-only transitions (Draft -> Presented -> Paid).

    Also allows Draft -> Paid (direct payment) since some users may skip Presented.
    """

    current = normalize_status(current_status)
    new = normalize_status(new_status)

    if current == new:
        return True
    if current == SoaStatus.DRAFT.value and new in {SoaStatus.PRESENTED.value, SoaStatus.PAID.value}:
        return True
    if current == SoaStatus.PRESENTED.value and new == SoaStatus.PAID.value:
        return True
    return False


def apply_status_side_effects(soa: StatementOfAccount, new_status: str) -> None:
    """Set presented_date/paid_date when status moves forward."""

    normalized = normalize_status(new_status)
    today = date.today()

    if normalized == SoaStatus.PRESENTED.value:
        if soa.presented_date is None:
            soa.presented_date = today
    elif normalized == SoaStatus.PAID.value:
        if soa.paid_date is None:
            soa.paid_date = today
        # If paid directly from Draft, it's often reasonable to also stamp presented_date.
        if soa.presented_date is None:
            soa.presented_date = today


@router.get("/admin/fetch-all", response_model=List[SoaResponse])
def admin_get_soas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    options = [
        joinedload(StatementOfAccount.items),
        joinedload(StatementOfAccount.account),
        joinedload(StatementOfAccount.assigned_user),
        joinedload(StatementOfAccount.creator),
    ]

    role = (current_user.role or "").upper()

    if role in {"CEO", "ADMIN"}:
        query = (
            db.query(StatementOfAccount)
            .options(*options)
            .join(User, StatementOfAccount.created_by == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
        )
        return query.all()

    # Non-admin roles: only own created/assigned
    return (
        db.query(StatementOfAccount)
        .options(*options)
        .filter(
            (StatementOfAccount.created_by == current_user.id)
            | (StatementOfAccount.assigned_to == current_user.id)
        )
        .all()
    )


@router.get("/from-acc/{account_id}", response_model=List[SoaResponse])
def get_soas_for_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    options = [
        joinedload(StatementOfAccount.items),
        joinedload(StatementOfAccount.account),
        joinedload(StatementOfAccount.assigned_user),
        joinedload(StatementOfAccount.creator),
    ]

    role = (current_user.role or "").upper()

    query = db.query(StatementOfAccount).options(*options).filter(StatementOfAccount.account_id == account_id)

    if role in {"CEO", "ADMIN"}:
        query = query.join(User, StatementOfAccount.created_by == User.id).filter(
            User.related_to_company == current_user.related_to_company
        )
    else:
        query = query.filter(
            (StatementOfAccount.created_by == current_user.id)
            | (StatementOfAccount.assigned_to == current_user.id)
        )

    return query.all()


@router.post("/admin", response_model=SoaResponse, status_code=status.HTTP_201_CREATED)
def admin_create_soa(
    request: Request,
    data: SoaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (current_user.role or "").upper() not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not current_user.related_to_company:
        raise HTTPException(status_code=400, detail="Current user is not linked to any company.")

    # Ensure creator is within company
    creator = (
        db.query(User)
        .filter(
            User.id == data.created_by_id,
            User.related_to_company == current_user.related_to_company,
        )
        .first()
    )
    if not creator:
        raise HTTPException(status_code=404, detail="Created by user not found in your company.")

    account = db.query(Account).filter(Account.id == data.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    # Default tax rate from company if not explicitly provided
    default_tax_rate = Decimal("0")
    company = db.query(Company).filter(Company.id == current_user.related_to_company).first()
    if company and company.tax_rate is not None:
        default_tax_rate = Decimal(str(company.tax_rate))

    tax_rate = data.tax_rate if data.tax_rate is not None and data.tax_rate != Decimal("0") else default_tax_rate

    currency_code = data.currency or infer_currency_code(company.currency if company else None)

    assigned_to = data.assigned_to
    if (current_user.role or "").upper() == "SALES":
        assigned_to = current_user.id

    new_soa = StatementOfAccount(
        account_id=data.account_id,
        purchase_order_number=data.purchase_order_number,
        quote_number=data.quote_number,
        soa_date=data.soa_date,
        terms_of_payment=data.terms_of_payment,
        due_date=data.due_date,
        full_payment=data.full_payment,
        status=normalize_status(data.status),
        presented_date=data.presented_date,
        paid_date=data.paid_date,
        subtotal=data.subtotal or Decimal("0"),
        tax_rate=tax_rate,
        tax_amount=data.tax_amount or Decimal("0"),
        total_amount=data.total_amount or Decimal("0"),
        currency=currency_code,
        notes=data.notes,
        prepared_by=data.prepared_by,
        approved_by=data.approved_by,
        received_by=data.received_by,
        assigned_to=assigned_to,
        created_by=data.created_by_id,
        updated_at=None,
    )

    db.add(new_soa)
    db.commit()
    db.refresh(new_soa)

    # Ensure required dates are recorded when status is not Draft.
    apply_status_side_effects(new_soa, new_soa.status)
    db.commit()
    db.refresh(new_soa)

    # Create items
    if data.items:
        for idx, item in enumerate(data.items):
            soa_item = SoaItem(
                soa_id=new_soa.id,
                item_type=item.item_type,
                name=item.name,
                description=item.description,
                sku=item.sku,
                variant=item.variant,
                unit=item.unit,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_percent=item.discount_percent or Decimal("0"),
                sort_order=item.sort_order if item.sort_order is not None else idx,
                line_total=Decimal("0"),
            )
            soa_item.calculate_line_total()
            db.add(soa_item)
        db.commit()
        db.refresh(new_soa)

        new_soa.calculate_totals()
        db.commit()
        db.refresh(new_soa)

    soa_id_value = new_soa.generate_soa_id(db)
    db.execute(
        text("UPDATE statements_of_account SET soa_id = :soa_id, updated_at = NULL WHERE id = :id"),
        {"soa_id": soa_id_value, "id": new_soa.id},
    )
    db.commit()
    db.refresh(new_soa)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_soa,
        action="CREATE",
        request=request,
        new_data=serialize_instance(new_soa),
        custom_message=f"created SOA '{new_soa.soa_id or new_soa.id}'",
    )

    return new_soa


@router.put("/admin/{soa_db_id}", response_model=SoaResponse)
def admin_update_soa(
    request: Request,
    soa_db_id: int,
    data: SoaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (current_user.role or "").upper() not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    soa = (
        db.query(StatementOfAccount)
        .options(joinedload(StatementOfAccount.items))
        .filter(StatementOfAccount.id == soa_db_id)
        .first()
    )
    if not soa:
        raise HTTPException(status_code=404, detail="SOA not found")

    # Presented/Paid are locked documents: use the dedicated status endpoint.
    if (soa.status or SoaStatus.DRAFT.value) != SoaStatus.DRAFT.value:
        # In locked state, we only accept a status transition.
        non_status_fields = [
            "account_id",
            "purchase_order_number",
            "quote_number",
            "soa_date",
            "terms_of_payment",
            "due_date",
            "full_payment",
            "notes",
            "prepared_by",
            "approved_by",
            "received_by",
            "assigned_to",
            "currency",
            "subtotal",
            "tax_rate",
            "tax_amount",
            "total_amount",
            "items",
            "presented_date",
            "paid_date",
        ]

        attempted_non_status_edit = any(getattr(data, field, None) is not None for field in non_status_fields)

        if attempted_non_status_edit:
            raise HTTPException(
                status_code=400,
                detail="SOA is locked (Presented/Paid). Use the status endpoint to change status; other fields cannot be edited.",
            )

        if data.status is None:
            return soa

        new_status = normalize_status(data.status)
        if not can_transition_status(soa.status, new_status):
            raise HTTPException(status_code=400, detail=f"Invalid status transition from {soa.status} to {new_status}.")

        old_data = serialize_instance(soa)

        soa.status = new_status
        apply_status_side_effects(soa, new_status)

        db.commit()
        db.refresh(soa)

        create_audit_log(
            db=db,
            current_user=current_user,
            instance=soa,
            action="UPDATE",
            request=request,
            old_data=old_data,
            new_data=serialize_instance(soa),
            custom_message=f"updated SOA status to {soa.status}",
        )

        return soa

    old_data = serialize_instance(soa)

    # Basic fields
    for field in [
        "account_id",
        "purchase_order_number",
        "quote_number",
        "soa_date",
        "terms_of_payment",
        "due_date",
        "full_payment",
        "notes",
        "prepared_by",
        "approved_by",
        "received_by",
        "assigned_to",
        "currency",
    ]:
        value = getattr(data, field)
        if value is not None:
            setattr(soa, field, value)

    if data.tax_rate is not None:
        soa.tax_rate = data.tax_rate

    if data.status is not None:
        new_status = normalize_status(data.status)
        if not can_transition_status(soa.status, new_status):
            raise HTTPException(status_code=400, detail=f"Invalid status transition from {soa.status} to {new_status}.")
        soa.status = new_status
        apply_status_side_effects(soa, new_status)

    # Dates can be explicitly set (but status side-effects above will fill missing ones)
    if data.presented_date is not None:
        soa.presented_date = data.presented_date
    if data.paid_date is not None:
        soa.paid_date = data.paid_date

    # Replace items if provided
    if data.items is not None:
        soa.items.clear()
        db.flush()
        for idx, item in enumerate(data.items):
            soa_item = SoaItem(
                soa_id=soa.id,
                item_type=item.item_type,
                name=item.name,
                description=item.description,
                sku=item.sku,
                variant=item.variant,
                unit=item.unit,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_percent=item.discount_percent or Decimal("0"),
                sort_order=item.sort_order if item.sort_order is not None else idx,
                line_total=Decimal("0"),
            )
            soa_item.calculate_line_total()
            soa.items.append(soa_item)

    soa.calculate_totals()

    db.commit()
    db.refresh(soa)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=soa,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=serialize_instance(soa),
        custom_message=f"updated SOA '{soa.soa_id or soa.id}'",
    )

    return soa


@router.patch("/admin/{soa_db_id}/status", response_model=SoaResponse)
def admin_update_soa_status(
    request: Request,
    soa_db_id: int,
    status_value: str = Query(..., description="Draft, Presented, Paid"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (current_user.role or "").upper() not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    soa = db.query(StatementOfAccount).filter(StatementOfAccount.id == soa_db_id).first()
    if not soa:
        raise HTTPException(status_code=404, detail="SOA not found")

    old_data = serialize_instance(soa)

    new_status = normalize_status(status_value)
    if not can_transition_status(soa.status, new_status):
        raise HTTPException(status_code=400, detail=f"Invalid status transition from {soa.status} to {new_status}.")

    soa.status = new_status
    apply_status_side_effects(soa, new_status)

    db.commit()
    db.refresh(soa)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=soa,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=serialize_instance(soa),
        custom_message=f"updated SOA status to {soa.status}",
    )

    return soa


@router.delete("/admin/{soa_db_id}", status_code=status.HTTP_200_OK)
def admin_delete_soa(
    request: Request,
    soa_db_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (current_user.role or "").upper() not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    soa = db.query(StatementOfAccount).filter(StatementOfAccount.id == soa_db_id).first()
    if not soa:
        raise HTTPException(status_code=404, detail="SOA not found")

    if (soa.status or SoaStatus.DRAFT.value) != SoaStatus.DRAFT.value:
        raise HTTPException(status_code=400, detail="SOA is locked (Presented/Paid) and cannot be deleted.")

    old_data = serialize_instance(soa)
    label = soa.soa_id or str(soa.id)

    db.delete(soa)
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=soa,
        action="DELETE",
        request=request,
        old_data=old_data,
        custom_message=f"deleted SOA '{label}'",
    )

    return {"message": "SOA deleted"}
