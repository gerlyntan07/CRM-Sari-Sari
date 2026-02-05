from __future__ import annotations

from typing import Any, Type

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.auth import User
from models.comment import Comment
from models.account import Account
from models.contact import Contact
from models.deal import Deal
from models.task import Task
from models.meeting import Meeting
from models.call import Call
from models.quote import Quote
from models.territory import Territory
from routers.auth_utils import get_current_user
from schemas.comment import CommentCreate, CommentResponse


router = APIRouter(prefix="/comments", tags=["Comments"])


_RELATED_TYPE_MAP: dict[str, tuple[str, Type[Any]]] = {
    "account": ("related_to_account", Account),
    "contact": ("related_to_contact", Contact),
    "deal": ("related_to_deal", Deal),
    "task": ("related_to_task", Task),
    "meeting": ("related_to_meeting", Meeting),
    "call": ("related_to_call", Call),
    "quote": ("related_to_quote", Quote),
}


def _get_company_user_ids_subquery(db: Session, current_user: User):
    if not getattr(current_user, "related_to_company", None):
        return None
    return (
        db.query(User.id)
        .filter(User.related_to_company == current_user.related_to_company)
        .subquery()
    )


def _role_scoped_entity_query(db: Session, current_user: User, model: Type[Any]):
    role = (current_user.role or "").upper()
    query = db.query(model)

    if not hasattr(model, "assigned_to") or not hasattr(model, "created_by"):
        return query

    company_user_ids = _get_company_user_ids_subquery(db, current_user)

    if role in ["CEO", "ADMIN"]:
        if company_user_ids is None:
            return query.filter(or_(model.assigned_to == current_user.id, model.created_by == current_user.id))
        return query.filter(or_(model.assigned_to.in_(company_user_ids), model.created_by.in_(company_user_ids)))

    if role == "GROUP MANAGER":
        if company_user_ids is None:
            return query.filter(or_(model.assigned_to == current_user.id, model.created_by == current_user.id))

        non_admin_company_user_ids = (
            db.query(User.id)
            .filter(
                User.related_to_company == current_user.related_to_company,
                ~User.role.in_(["CEO", "Admin"]),
            )
            .subquery()
        )
        return query.filter(or_(model.assigned_to.in_(non_admin_company_user_ids), model.created_by.in_(non_admin_company_user_ids)))

    if role == "MANAGER":
        territory_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )

        if company_user_ids is not None:
            query = query.filter(or_(model.assigned_to.in_(company_user_ids), model.created_by.in_(company_user_ids)))

        return query.filter(
            or_(
                model.assigned_to.in_(territory_user_ids),
                model.assigned_to == current_user.id,
                model.created_by == current_user.id,
            )
        )

    # Sales/Marketing/others: own records only
    return query.filter(or_(model.assigned_to == current_user.id, model.created_by == current_user.id))


def _get_entity_or_403(db: Session, current_user: User, model: Type[Any], entity_id: int):
    entity = _role_scoped_entity_query(db, current_user, model).filter(model.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this record")
    return entity


@router.get("", response_model=list[CommentResponse])
def list_comments(
    related_type: str,
    related_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    related_type_normalized = (related_type or "").strip().lower()
    if related_type_normalized not in _RELATED_TYPE_MAP:
        raise HTTPException(status_code=400, detail="Invalid related_type")

    related_field_name, entity_model = _RELATED_TYPE_MAP[related_type_normalized]
    entity = _get_entity_or_403(db, current_user, entity_model, related_id)

    assigned_to_id = getattr(entity, "assigned_to", None)
    created_by_id = getattr(entity, "created_by", None)

    related_field = getattr(Comment, related_field_name)

    query = (
        db.query(Comment)
        .options(joinedload(Comment.comment_creator))
        .filter(related_field == related_id)
    )

    # Public comments are visible to all users who can access the record.
    # Private comments are visible only to:
    # - the comment creator
    # - the record's assigned_to user
    # - the record's created_by user
    allowed_private_viewer_ids = {assigned_to_id, created_by_id}
    if current_user.id not in allowed_private_viewer_ids:
        query = query.filter(
            or_(
                Comment.is_private.is_(False),
                Comment.comment_by == current_user.id,
            )
        )

    return query.order_by(Comment.created_at.desc()).all()


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    related_type_normalized = (payload.related_type or "").strip().lower()
    if related_type_normalized not in _RELATED_TYPE_MAP:
        raise HTTPException(status_code=400, detail="Invalid related_type")

    related_field_name, entity_model = _RELATED_TYPE_MAP[related_type_normalized]
    _get_entity_or_403(db, current_user, entity_model, payload.related_id)

    comment_text = (payload.comment or "").strip()
    if not comment_text:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    new_comment = Comment(
        comment=comment_text,
        comment_by=current_user.id,
        is_private=bool(payload.is_private),
    )
    setattr(new_comment, related_field_name, payload.related_id)

    db.add(new_comment)
    db.commit()

    created = (
        db.query(Comment)
        .options(joinedload(Comment.comment_creator))
        .filter(Comment.id == new_comment.id)
        .first()
    )
    return created
