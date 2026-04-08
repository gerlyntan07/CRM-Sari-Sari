from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from sqlalchemy import and_, or_

from database import get_db
from models.auth import User
from models.announcement import Announcement
from schemas.announcement import (
    AnnouncementPublishRequest,
    AnnouncementResponse,
    AnnouncementMutationResponse,
    AnnouncementClearResponse,
)
from .auth_utils import get_current_user


router = APIRouter(prefix="/announcements", tags=["Announcements"])

ALLOWED_TARGET_ROLES = {
    "ALL",
    "SALES",
    "MANAGER",
    "GROUP_MANAGER",
    "CEO",
    "ADMIN",
}


def _normalize_role(role: str | None) -> str:
    raw = (role or "").strip().upper().replace(" ", "_").replace("-", "_")
    alias_map = {
        "T_MANAGER": "GROUP_MANAGER",
        "TEAM_MANAGER": "GROUP_MANAGER",
        "GROUPMANAGER": "GROUP_MANAGER",
        "TENANT_ADMIN": "ADMIN",
        "ADMINISTRATOR": "ADMIN",
    }
    return alias_map.get(raw, raw or "UNKNOWN")


def _normalize_target_role(target_role: str | None) -> str:
    normalized = _normalize_role(target_role)
    if normalized not in ALLOWED_TARGET_ROLES:
        raise HTTPException(status_code=400, detail="Invalid target role.")
    return normalized


def _require_super_admin(current_user: User) -> None:
    if (current_user.role or "").upper() != "ADMIN":
        raise HTTPException(status_code=403, detail="Access denied. Admin privileges required.")


@router.get("/current", response_model=AnnouncementResponse)
def get_current_announcement(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Any authenticated user can read the active announcement.
    _ = current_user

    now_utc = datetime.now(timezone.utc)
    user_role_key = _normalize_role(current_user.role)

    # Prefer role-specific announcement when present.
    role_announcement = (
        db.query(Announcement)
        .filter(
            Announcement.is_active == True,
            Announcement.starts_at <= now_utc,
            or_(Announcement.ends_at.is_(None), Announcement.ends_at >= now_utc),
            Announcement.target_role == user_role_key,
        )
        .order_by(Announcement.starts_at.desc(), Announcement.created_at.desc())
        .first()
    )

    if role_announcement:
        return AnnouncementResponse(
            message=role_announcement.message,
            target_role=role_announcement.target_role,
            starts_at=role_announcement.starts_at,
            ends_at=role_announcement.ends_at,
            updated_at=role_announcement.updated_at or role_announcement.created_at,
        )

    announcement = (
        db.query(Announcement)
        .filter(
            Announcement.is_active == True,
            Announcement.starts_at <= now_utc,
            or_(Announcement.ends_at.is_(None), Announcement.ends_at >= now_utc),
            or_(Announcement.target_role == "ALL", Announcement.target_role.is_(None)),
        )
        .order_by(Announcement.starts_at.desc(), Announcement.created_at.desc())
        .first()
    )

    if not announcement:
        return AnnouncementResponse(message="", target_role="ALL", starts_at=None, ends_at=None, updated_at=None)

    return AnnouncementResponse(
        message=announcement.message,
        target_role=announcement.target_role or "ALL",
        starts_at=announcement.starts_at,
        ends_at=announcement.ends_at,
        updated_at=announcement.updated_at or announcement.created_at,
    )


@router.get("/super-admin/latest", response_model=AnnouncementResponse)
def get_latest_announcement_for_super_admin(
    target_role: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)

    normalized_target_role = None
    if target_role is not None:
        normalized_target_role = _normalize_target_role(target_role)

    query = db.query(Announcement).filter(Announcement.is_active == True)
    if normalized_target_role is not None:
        query = query.filter(Announcement.target_role == normalized_target_role)

    announcement = (
        query
        .order_by(Announcement.created_at.desc())
        .first()
    )

    if not announcement:
        return AnnouncementResponse(message="", target_role=normalized_target_role or "ALL", starts_at=None, ends_at=None, updated_at=None)

    return AnnouncementResponse(
        message=announcement.message,
        target_role=announcement.target_role or "ALL",
        starts_at=announcement.starts_at,
        ends_at=announcement.ends_at,
        updated_at=announcement.updated_at or announcement.created_at,
    )


@router.post("/super-admin/publish", response_model=AnnouncementMutationResponse)
def publish_announcement(
    payload: AnnouncementPublishRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)

    message = (payload.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Announcement message is required.")

    starts_at = payload.starts_at
    ends_at = payload.ends_at
    target_role = _normalize_target_role(payload.target_role)

    if ends_at is not None and ends_at <= starts_at:
        raise HTTPException(status_code=400, detail="End time must be later than post time.")

    overlap_filters = [
        Announcement.is_active == True,
        Announcement.target_role == target_role,
        or_(Announcement.ends_at.is_(None), Announcement.ends_at >= starts_at),
    ]

    if ends_at is not None:
        overlap_filters.append(Announcement.starts_at <= ends_at)

    overlapping_announcement = (
        db.query(Announcement)
        .filter(and_(*overlap_filters))
        .order_by(Announcement.starts_at.asc())
        .first()
    )

    if overlapping_announcement:
        raise HTTPException(
            status_code=409,
            detail="This role already has an announcement scheduled in the selected time range.",
        )

    new_announcement = Announcement(
        message=message,
        target_role=target_role,
        is_active=True,
        starts_at=starts_at,
        ends_at=ends_at,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)

    return AnnouncementMutationResponse(
        message="Announcement published successfully.",
        announcement=AnnouncementResponse(
            message=new_announcement.message,
            target_role=new_announcement.target_role,
            starts_at=new_announcement.starts_at,
            ends_at=new_announcement.ends_at,
            updated_at=new_announcement.updated_at or new_announcement.created_at,
        ),
    )


@router.delete("/super-admin/current", response_model=AnnouncementClearResponse)
def clear_current_announcement(
    target_role: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)

    normalized_target_role = None
    if target_role is not None:
        normalized_target_role = _normalize_target_role(target_role)

    query = db.query(Announcement).filter(Announcement.is_active == True)
    if normalized_target_role is not None:
        query = query.filter(Announcement.target_role == normalized_target_role)

    active_rows = query.all()

    if not active_rows:
        return AnnouncementClearResponse(message="No active announcement to clear.")

    for row in active_rows:
        row.is_active = False
        row.updated_by = current_user.id

    db.commit()
    return AnnouncementClearResponse(message="Announcement cleared successfully.")
