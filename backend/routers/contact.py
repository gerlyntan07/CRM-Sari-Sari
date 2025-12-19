# backend/routers/contact.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select

from database import get_db
from schemas.contact import ContactBase, ContactResponse, ContactCreate, ContactUpdate
from .auth_utils import get_current_user
from models.auth import User
from models.contact import Contact
from models.account import Account
from .logs_utils import serialize_instance, create_audit_log
from .ws_notification import broadcast_notification

router = APIRouter(
    prefix="/contacts",
    tags=["Contacts"]
)

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER"}


def _clean_optional_string(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _push_notif(
    background_tasks: BackgroundTasks,
    log_entry,
    target_user_id: int | None,
    notif_data: dict,
):
    """
    Standardize notification payload so your frontend can:
    - mark-read using notif.id (audit_log id)
    - show unread using read=false
    """
    if not target_user_id or not log_entry:
        return

    payload = dict(notif_data)
    payload["id"] = getattr(log_entry, "id", None)
    payload["read"] = False

    # Websocket broadcast (do NOT double-send via asyncio.run)
    background_tasks.add_task(
        broadcast_notification,
        payload,
        target_user_id=target_user_id
    )


@router.post("/convertedLead", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    data: ContactBase,
    background_tasks: BackgroundTasks,
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

    # ✅ Notify assigned user (fallback to creator if no assigned_to)
    target_user_id = new_contact.assigned_to or new_contact.created_by

    log_entry = create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_contact,
        action="CREATE",
        request=request,
        new_data=new_data,
        target_user_id=target_user_id,
        custom_message=f"add new contact '{new_contact.first_name} {new_contact.last_name}' from a converted lead"
    )

    _push_notif(
        background_tasks=background_tasks,
        log_entry=log_entry,
        target_user_id=target_user_id,
        notif_data={
            "type": "contact_assignment",
            "title": f"New contact assigned: {new_contact.first_name} {new_contact.last_name}",
            "contactId": new_contact.id,
            "accountId": new_contact.account_id,
            "assignedBy": f"{current_user.first_name} {current_user.last_name}",
            "createdAt": str(getattr(new_contact, "created_at", None) or ""),
        },
    )

    return new_contact


@router.get("/admin/fetch-all", response_model=list[ContactResponse])
def admin_get_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Get all users in the same company
    company_users = db.query(User.id).filter(
        User.related_to_company == current_user.related_to_company
    ).subquery()

    contacts = db.query(Contact).filter(
        (Contact.created_by.in_(company_users)) | (Contact.assigned_to.in_(company_users))
    ).all()

    return contacts


@router.get("/from-acc/{accID}", response_model=list[ContactResponse])
def admin_get_contacts_from_account(
    accID: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get all users in the same company
    company_users = db.query(User.id).filter(
        User.related_to_company == current_user.related_to_company
    ).subquery()

    contacts = db.query(Contact).filter(
        (Contact.created_by.in_(company_users)) | (Contact.assigned_to.in_(company_users))
    ).filter(Contact.account_id == accID).all()

    return contacts


@router.post("/admin", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def admin_create_contact(
    data: ContactCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not current_user.related_to_company:
        raise HTTPException(
            status_code=400,
            detail="Current user is not linked to any company.",
        )

    first_name = _clean_optional_string(data.first_name)
    last_name = _clean_optional_string(data.last_name)

    if not first_name or not last_name:
        raise HTTPException(
            status_code=400,
            detail="First name and last name are required.",
        )

    company_users = (
        select(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    account = (
        db.query(Account)
        .filter(
            Account.id == data.account_id,
            (
                (Account.created_by.in_(company_users))
                | (Account.assigned_to.in_(company_users))
            ),
        )
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=404, detail="Account not found in your company."
        )

    assigned_user = None
    if data.assigned_to is not None:
        assigned_user = (
            db.query(User)
            .filter(
                User.id == data.assigned_to,
                User.related_to_company == current_user.related_to_company,
            )
            .first()
        )
        if not assigned_user:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found in your company.",
            )

    creator_id = data.created_by or current_user.id
    creator = (
        db.query(User)
        .filter(
            User.id == creator_id,
            User.related_to_company == current_user.related_to_company,
        )
        .first()
    )
    if not creator:
        raise HTTPException(
            status_code=404, detail="Creator is not part of your company."
        )

    new_contact = Contact(
        first_name=first_name,
        last_name=last_name,
        account_id=data.account_id,
        title=_clean_optional_string(data.title),
        department=_clean_optional_string(data.department),
        email=_clean_optional_string(data.email.lower()) if data.email else None,
        work_phone=_clean_optional_string(data.work_phone),
        mobile_phone_1=_clean_optional_string(data.mobile_phone_1),
        mobile_phone_2=_clean_optional_string(data.mobile_phone_2),
        notes=_clean_optional_string(data.notes),
        assigned_to=data.assigned_to if assigned_user else None,
        created_by=creator_id,
    )

    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)

    new_data = serialize_instance(new_contact)

    assigned_fragment = ""
    if assigned_user:
        assigned_fragment = (
            f" assigned to '{assigned_user.first_name} {assigned_user.last_name}'"
        )

    # ✅ Notify assigned user (fallback creator if unassigned)
    target_user_id = new_contact.assigned_to or new_contact.created_by

    log_entry = create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_contact,
        action="CREATE",
        request=request,
        new_data=new_data,
        target_user_id=target_user_id,
        custom_message=(
            f"create contact '{new_contact.first_name} {new_contact.last_name}'"
        ),
    )

    _push_notif(
        background_tasks=background_tasks,
        log_entry=log_entry,
        target_user_id=target_user_id,
        notif_data={
            "type": "contact_assignment",
            "title": f"New contact assigned: {new_contact.first_name} {new_contact.last_name}",
            "contactId": new_contact.id,
            "accountId": new_contact.account_id,
            "assignedBy": f"{current_user.first_name} {current_user.last_name}",
            "createdAt": str(getattr(new_contact, "created_at", None) or ""),
        },
    )

    return new_contact


@router.put("/admin/{contact_id}", response_model=ContactResponse)
def admin_update_contact(
    contact_id: int,
    data: ContactUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    company_users = (
        select(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    contact = (
        db.query(Contact)
        .filter(
            Contact.id == contact_id,
            (
                (Contact.created_by.in_(company_users))
                | (Contact.assigned_to.in_(company_users))
            ),
        )
        .first()
    )

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")

    update_data = data.model_dump(exclude_unset=True)

    if "first_name" in update_data:
        cleaned_first = _clean_optional_string(update_data["first_name"])
        if not cleaned_first:
            raise HTTPException(
                status_code=400, detail="First name cannot be empty."
            )
        update_data["first_name"] = cleaned_first

    if "last_name" in update_data:
        cleaned_last = _clean_optional_string(update_data["last_name"])
        if not cleaned_last:
            raise HTTPException(
                status_code=400, detail="Last name cannot be empty."
            )
        update_data["last_name"] = cleaned_last

    if "account_id" in update_data and update_data["account_id"] is not None:
        account = (
            db.query(Account)
            .filter(
                Account.id == update_data["account_id"],
                (
                    (Account.created_by.in_(company_users))
                    | (Account.assigned_to.in_(company_users))
                ),
            )
            .first()
        )
        if not account:
            raise HTTPException(
                status_code=404,
                detail="Account not found in your company.",
            )

    assigned_user_name = None
    old_assigned_to = contact.assigned_to

    if "assigned_to" in update_data:
        assigned_to_value = update_data["assigned_to"]
        if assigned_to_value is not None:
            assigned_user = (
                db.query(User)
                .filter(
                    User.id == assigned_to_value,
                    User.related_to_company == current_user.related_to_company,
                )
                .first()
            )
            if not assigned_user:
                raise HTTPException(
                    status_code=404,
                    detail="Assigned user not found in your company.",
                )
            assigned_user_name = (
                f"{assigned_user.first_name} {assigned_user.last_name}"
            )
        else:
            assigned_user_name = "unassigned"

    # Clean optional string fields
    for field in [
        "title",
        "department",
        "work_phone",
        "mobile_phone_1",
        "mobile_phone_2",
        "notes",
    ]:
        if field in update_data:
            update_data[field] = _clean_optional_string(update_data[field])

    if "email" in update_data:
        update_data["email"] = (
            _clean_optional_string(update_data["email"].lower())
            if update_data["email"]
            else None
        )

    old_data = serialize_instance(contact)

    for field, value in update_data.items():
        setattr(contact, field, value)

    db.commit()
    db.refresh(contact)

    new_data = serialize_instance(contact)

    reassigned_fragment = ""
    if assigned_user_name:
        reassigned_fragment = f" - reassigned to {assigned_user_name}"

    # ✅ Notify assigned user (or creator if unassigned)
    target_user_id = contact.assigned_to or contact.created_by

    log_entry = create_audit_log(
        db=db,
        current_user=current_user,
        instance=contact,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        target_user_id=target_user_id,
        custom_message=(
            f"update contact '{contact.first_name} {contact.last_name}'"
        ),
    )

    # If reassigned, show assignment notif; otherwise update notif
    was_reassigned = ("assigned_to" in update_data) and (old_assigned_to != contact.assigned_to)
    notif_type = "contact_assignment" if was_reassigned else "contact_update"
    notif_title = (
        f"New contact assigned: {contact.first_name} {contact.last_name}"
        if was_reassigned
        else f"Contact updated: {contact.first_name} {contact.last_name}"
    )

    _push_notif(
        background_tasks=background_tasks,
        log_entry=log_entry,
        target_user_id=target_user_id,
        notif_data={
            "type": notif_type,
            "title": notif_title,
            "contactId": contact.id,
            "accountId": contact.account_id,
            "assignedBy": f"{current_user.first_name} {current_user.last_name}",
            "createdAt": str(getattr(contact, "updated_at", None) or getattr(contact, "created_at", None) or ""),
        },
    )

    return contact


@router.delete("/admin/{contact_id}", status_code=status.HTTP_200_OK)
def admin_delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    company_users = (
        select(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    contact = (
        db.query(Contact)
        .filter(
            Contact.id == contact_id,
            (
                (Contact.created_by.in_(company_users))
                | (Contact.assigned_to.in_(company_users))
            ),
        )
        .first()
    )

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")

    deleted_data = serialize_instance(contact)
    contact_name = f"{contact.first_name} {contact.last_name}"

    db.delete(contact)
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=contact,
        action="DELETE",
        request=request,
        old_data=deleted_data,
        # optional: if you want this to appear in the target user's history
        target_user_id=(contact.assigned_to or contact.created_by),
        custom_message=(f"delete contact '{contact_name}' via admin panel"),
    )

    return {"detail": f"Contact '{contact_name}' deleted successfully."}
