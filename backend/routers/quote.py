from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, text
from typing import List
from decimal import Decimal

from database import get_db
from schemas.quote import (
    QuoteCreate, QuoteResponse, QuoteUpdate, QuoteBulkDelete,
    QuoteItemCreate, QuoteItemUpdate, QuoteItemResponse
)
from .auth_utils import get_current_user

from models.auth import User
from models.quote import Quote, QuoteStatus, QuoteItem
from models.contact import Contact
from models.account import Account
from models.deal import Deal
from models.territory import Territory
from models.company import Company

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
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        deals = (
            db.query(Quote)
            .options(joinedload(Quote.items))
            .join(User, Quote.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif current_user.role.upper() == "GROUP MANAGER":
        deals = (
            db.query(Quote)
            .options(joinedload(Quote.items))
            .join(User, Quote.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .filter(Quote.status != "Inactive")  # Exclude archived quotes
            .all()
        )
    elif current_user.role.upper() == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )

        deals = (
            db.query(Quote)
            .options(joinedload(Quote.items))
            .join(User, Quote.assigned_to == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                (User.id.in_(subquery_user_ids)) | 
                (Quote.assigned_to == current_user.id) |
                (Quote.created_by == current_user.id)
            )
            .filter(Quote.status != "Inactive")  # Exclude archived quotes
            .all()
        )
    else:
        deals = (
            db.query(Quote)
            .options(joinedload(Quote.items))
            .filter(
                (Quote.assigned_to == current_user.id) | 
                (Quote.created_by == current_user.id)
            )
            .filter(Quote.status != "Inactive")  # Exclude archived quotes
            .all()
        )

    return deals


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
    
    if current_user.role.upper() == "SALES":
        assigned_to = current_user.id
    else:
        assigned_to = data.assigned_to

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

    # Get company's default tax rate if not provided in request
    default_tax_rate = Decimal('0')
    if current_user.related_to_company:
        company = db.query(Company).filter(Company.id == current_user.related_to_company).first()
        if company and company.tax_rate is not None:
            default_tax_rate = Decimal(str(company.tax_rate))

    # Use provided tax_rate or fall back to company default
    quote_tax_rate = data.tax_rate if data.tax_rate is not None and data.tax_rate != Decimal('0') else default_tax_rate

    new_quote = Quote(
        deal_id=data.deal_id,
        contact_id=data.contact_id,
        account_id=account_id_final,
        subtotal=data.subtotal or Decimal('0'),
        tax_rate=quote_tax_rate,
        tax_amount=data.tax_amount or Decimal('0'),
        discount_type=data.discount_type,
        discount_value=data.discount_value or Decimal('0'),
        discount_amount=data.discount_amount or Decimal('0'),
        total_amount=data.total_amount,
        currency=data.currency or "PHP",
        presented_date=data.presented_date,
        validity_days=data.validity_days,
        status=normalize_status(data.status),
        assigned_to=assigned_to,
        created_by=data.created_by_id,
        notes=data.notes,
        updated_at=None,
    )

    db.add(new_quote)
    db.commit()
    db.refresh(new_quote)

    # Create quote items if provided
    if data.items:
        created_items = []
        for idx, item_data in enumerate(data.items):
            quote_item = QuoteItem(
                quote_id=new_quote.id,
                item_type=item_data.item_type,
                name=item_data.name,
                description=item_data.description,
                sku=item_data.sku,
                variant=item_data.variant,
                unit=item_data.unit,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                discount_percent=item_data.discount_percent or Decimal('0'),
                sort_order=item_data.sort_order if item_data.sort_order is not None else idx,
                line_total=Decimal('0'),  # Will be calculated
            )
            quote_item.calculate_line_total()
            db.add(quote_item)
            created_items.append(quote_item)
        
        db.commit()
        
        # Auto-generate SKU for items that don't have one
        for item in created_items:
            db.refresh(item)
            if not item.sku:
                item.generate_sku(db)
        db.commit()
        
        db.refresh(new_quote)
        
        # Recalculate quote totals
        new_quote.calculate_totals()
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
        joinedload(Quote.items),
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
    
    # Auto-assign to current user if they are SALES
    if current_user.role.upper() == "SALES":
        update_data["assigned_to"] = current_user.id
        assigned_user_name = f"{current_user.first_name} {current_user.last_name}"
    elif "assigned_to" in update_data and update_data["assigned_to"]:
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

    # Handle items update separately
    items_data = update_data.pop("items", None)

    for field, value in update_data.items():
        setattr(quote, field, value)

    db.commit()
    db.refresh(quote)

    # If items were provided, replace all existing items
    if items_data is not None:
        # Delete existing items
        db.query(QuoteItem).filter(QuoteItem.quote_id == quote.id).delete()
        db.commit()
        
        # Add new items (items_data is a list of dicts from model_dump)
        created_items = []
        for idx, item_data in enumerate(items_data):
            quote_item = QuoteItem(
                quote_id=quote.id,
                item_type=item_data.get("item_type", "Product"),
                name=item_data.get("name"),
                description=item_data.get("description"),
                sku=item_data.get("sku"),
                variant=item_data.get("variant"),
                unit=item_data.get("unit"),
                quantity=item_data.get("quantity", 1),
                unit_price=item_data.get("unit_price", 0),
                discount_percent=item_data.get("discount_percent") or Decimal('0'),
                sort_order=item_data.get("sort_order") if item_data.get("sort_order") is not None else idx,
                line_total=Decimal('0'),
            )
            quote_item.calculate_line_total()
            db.add(quote_item)
            created_items.append(quote_item)
        
        db.commit()
        
        # Auto-generate SKU for items that don't have one
        for item in created_items:
            db.refresh(item)
            if not item.sku:
                item.generate_sku(db)
        db.commit()
        
        db.refresh(quote)
        
        # Recalculate quote totals
        quote.calculate_totals()
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

    quote_label = quote.quote_id or f"Quote #{quote.id}"
    
    # Manager/Territory Manager/Sales archives (sets to Inactive), Admin/CEO hard deletes
    if (current_user.role or "").upper() in ["MANAGER", "GROUP MANAGER", "SALES"]:
        old_status = quote.status
        quote.status = "Inactive"
        db.commit()
        
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=quote,
            action="UPDATE",
            request=request,
            old_data={"status": old_status},
            new_data={"status": "Inactive"},
            custom_message=f"archive quote '{quote_label}' (set to Inactive)",
        )

        return {"detail": f"Quote '{quote_label}' archived successfully."}
    else:
        # Hard delete for Admin/CEO
        deleted_data = serialize_instance(quote)
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


@router.post("/admin/bulk-delete", status_code=status.HTTP_200_OK)
def admin_bulk_delete_quotes(
    data: QuoteBulkDelete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not data.quote_ids:
        return {"detail": "No quotes provided for deletion."}

    company_users = (
        db.query(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    quotes_to_delete = db.query(Quote).filter(
        Quote.id.in_(data.quote_ids),
        ((Quote.created_by.in_(company_users)) | (Quote.assigned_to.in_(company_users)))
    ).all()

    if not quotes_to_delete:
        raise HTTPException(status_code=404, detail="No matching quotes found for deletion.")

    deleted_count = 0
    
    # Manager/Territory Manager/Sales archives (sets to Inactive), Admin/CEO hard deletes
    if (current_user.role or "").upper() in ["MANAGER", "GROUP MANAGER", "SALES"]:
        for quote in quotes_to_delete:
            old_status = quote.status
            quote.status = "Inactive"
            
            create_audit_log(
                db=db,
                current_user=current_user,
                instance=quote,
                action="UPDATE",
                request=request,
                old_data={"status": old_status},
                new_data={"status": "Inactive"},
                custom_message=f"bulk archive quote '#{quote.id}' (set to Inactive)"
            )
            deleted_count += 1
    else:
        # Hard delete for Admin/CEO
        for quote in quotes_to_delete:
            deleted_data = serialize_instance(quote)
            quote_name = f"quote #{quote.id}"
            target_user_id = quote.assigned_to or quote.created_by

            db.delete(quote)
            
            create_audit_log(
                db=db,
                current_user=current_user,
                instance=quote,
                action="DELETE",
                request=request,
                old_data=deleted_data,
                target_user_id=target_user_id,
                custom_message=f"bulk delete quote '#{quote.id}' via admin panel"
            )
            deleted_count += 1

    db.commit()

    return {"detail": f"Successfully archived {deleted_count} quote(s)." if (current_user.role or "").upper() in ["MANAGER", "GROUP MANAGER"] else f"Successfully deleted {deleted_count} quote(s)."}


# ==================== QUOTE ITEMS ENDPOINTS ====================

def get_quote_for_user(db: Session, quote_id: int, current_user: User) -> Quote:
    """Helper function to get a quote ensuring user has access."""
    company_users = (
        select(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    quote = db.query(Quote).options(
        joinedload(Quote.items),
        joinedload(Quote.deal),
        joinedload(Quote.account),
        joinedload(Quote.contact),
    ).filter(
        Quote.id == quote_id,
        ((Quote.created_by.in_(company_users)) | (Quote.assigned_to.in_(company_users)))
    ).first()

    return quote


@router.get("/admin/{quote_id}/items", response_model=List[QuoteItemResponse])
def get_quote_items(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all line items for a specific quote."""
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    quote = get_quote_for_user(db, quote_id, current_user)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    return quote.items

@router.get("/from-acc/{accID}", response_model=list[QuoteResponse])
def admin_get_quotes_from_acc(
    accID: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_users = db.query(User.id).filter(
        User.related_to_company == current_user.related_to_company
    ).subquery()

    quotes = db.query(Quote).filter(
        (Quote.created_by.in_(company_users)) | (Quote.assigned_to.in_(company_users))
    ).filter(Quote.account_id == accID).all()

    return quotes

@router.post("/admin/{quote_id}/items", response_model=QuoteItemResponse, status_code=status.HTTP_201_CREATED)
def add_quote_item(
    quote_id: int,
    data: QuoteItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Add a new line item to a quote."""
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    quote = get_quote_for_user(db, quote_id, current_user)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    # Determine sort order
    max_sort = db.query(QuoteItem).filter(QuoteItem.quote_id == quote_id).count()
    sort_order = data.sort_order if data.sort_order is not None else max_sort

    quote_item = QuoteItem(
        quote_id=quote_id,
        item_type=data.item_type,
        name=data.name,
        description=data.description,
        sku=data.sku,
        variant=data.variant,
        unit=data.unit,
        quantity=data.quantity,
        unit_price=data.unit_price,
        discount_percent=data.discount_percent or Decimal('0'),
        sort_order=sort_order,
        line_total=Decimal('0'),
    )
    quote_item.calculate_line_total()

    db.add(quote_item)
    db.commit()
    db.refresh(quote_item)

    # Auto-generate SKU if not provided
    if not quote_item.sku:
        quote_item.generate_sku(db)
        db.commit()
        db.refresh(quote_item)

    # Recalculate quote totals
    db.refresh(quote)
    quote.calculate_totals()
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="UPDATE",
        request=request,
        custom_message=f"add item '{data.name}' to quote '{quote.quote_id or quote.id}'",
    )

    return quote_item


@router.post("/admin/{quote_id}/items/bulk", response_model=List[QuoteItemResponse], status_code=status.HTTP_201_CREATED)
def add_quote_items_bulk(
    quote_id: int,
    items: List[QuoteItemCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Add multiple line items to a quote at once."""
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    quote = get_quote_for_user(db, quote_id, current_user)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    if not items:
        raise HTTPException(status_code=400, detail="No items provided.")

    max_sort = db.query(QuoteItem).filter(QuoteItem.quote_id == quote_id).count()
    created_items = []

    for idx, item_data in enumerate(items):
        quote_item = QuoteItem(
            quote_id=quote_id,
            item_type=item_data.item_type,
            name=item_data.name,
            description=item_data.description,
            sku=item_data.sku,
            variant=item_data.variant,
            unit=item_data.unit,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            discount_percent=item_data.discount_percent or Decimal('0'),
            sort_order=item_data.sort_order if item_data.sort_order is not None else max_sort + idx,
            line_total=Decimal('0'),
        )
        quote_item.calculate_line_total()
        db.add(quote_item)
        created_items.append(quote_item)

    db.commit()
    
    # Auto-generate SKU for items that don't have one
    for item in created_items:
        db.refresh(item)
        if not item.sku:
            item.generate_sku(db)
    db.commit()
    
    for item in created_items:
        db.refresh(item)

    # Recalculate quote totals
    db.refresh(quote)
    quote.calculate_totals()
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="UPDATE",
        request=request,
        custom_message=f"add {len(created_items)} items to quote '{quote.quote_id or quote.id}'",
    )

    return created_items


@router.put("/admin/{quote_id}/items/{item_id}", response_model=QuoteItemResponse)
def update_quote_item(
    quote_id: int,
    item_id: int,
    data: QuoteItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Update an existing line item in a quote."""
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    quote = get_quote_for_user(db, quote_id, current_user)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    quote_item = db.query(QuoteItem).filter(
        QuoteItem.id == item_id,
        QuoteItem.quote_id == quote_id
    ).first()

    if not quote_item:
        raise HTTPException(status_code=404, detail="Quote item not found.")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(quote_item, field, value)

    # Recalculate line total
    quote_item.calculate_line_total()

    db.commit()
    db.refresh(quote_item)

    # Recalculate quote totals
    db.refresh(quote)
    quote.calculate_totals()
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="UPDATE",
        request=request,
        custom_message=f"update item '{quote_item.name}' in quote '{quote.quote_id or quote.id}'",
    )

    return quote_item


@router.delete("/admin/{quote_id}/items/{item_id}", status_code=status.HTTP_200_OK)
def delete_quote_item(
    quote_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Delete a line item from a quote."""
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    quote = get_quote_for_user(db, quote_id, current_user)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    quote_item = db.query(QuoteItem).filter(
        QuoteItem.id == item_id,
        QuoteItem.quote_id == quote_id
    ).first()

    if not quote_item:
        raise HTTPException(status_code=404, detail="Quote item not found.")

    item_name = quote_item.name
    db.delete(quote_item)
    db.commit()

    # Recalculate quote totals
    db.refresh(quote)
    quote.calculate_totals()
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="UPDATE",
        request=request,
        custom_message=f"delete item '{item_name}' from quote '{quote.quote_id or quote.id}'",
    )

    return {"detail": f"Item '{item_name}' deleted successfully."}


@router.delete("/admin/{quote_id}/items", status_code=status.HTTP_200_OK)
def delete_all_quote_items(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Delete all line items from a quote."""
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    quote = get_quote_for_user(db, quote_id, current_user)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    item_count = db.query(QuoteItem).filter(QuoteItem.quote_id == quote_id).count()
    db.query(QuoteItem).filter(QuoteItem.quote_id == quote_id).delete()
    db.commit()

    # Recalculate quote totals (will be 0)
    db.refresh(quote)
    quote.calculate_totals()
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="UPDATE",
        request=request,
        custom_message=f"delete all {item_count} items from quote '{quote.quote_id or quote.id}'",
    )

    return {"detail": f"Deleted {item_count} items from quote."}


@router.post("/admin/{quote_id}/recalculate", response_model=QuoteResponse)
def recalculate_quote_totals(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Recalculate quote totals based on line items, tax, and discount settings."""
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    quote = get_quote_for_user(db, quote_id, current_user)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    old_total = quote.total_amount

    # Recalculate all line item totals first
    for item in quote.items:
        item.calculate_line_total()

    # Recalculate quote totals
    quote.calculate_totals()
    db.commit()
    db.refresh(quote)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="UPDATE",
        request=request,
        custom_message=f"recalculate quote '{quote.quote_id or quote.id}' totals: {old_total} -> {quote.total_amount}",
    )

    return quote


@router.patch("/admin/{quote_id}/items/reorder", response_model=List[QuoteItemResponse])
def reorder_quote_items(
    quote_id: int,
    item_order: List[int] = Query(..., description="List of item IDs in desired order"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Reorder line items in a quote by providing item IDs in desired order."""
    if (current_user.role or "").upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    quote = get_quote_for_user(db, quote_id, current_user)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found.")

    # Update sort_order for each item
    for idx, item_id in enumerate(item_order):
        item = db.query(QuoteItem).filter(
            QuoteItem.id == item_id,
            QuoteItem.quote_id == quote_id
        ).first()
        if item:
            item.sort_order = idx

    db.commit()
    db.refresh(quote)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=quote,
        action="UPDATE",
        request=request,
        custom_message=f"reorder items in quote '{quote.quote_id or quote.id}'",
    )

    return quote.items

