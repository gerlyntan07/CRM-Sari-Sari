from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from sqlalchemy import or_

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

    announcement = (
        db.query(Announcement)
        .filter(
            Announcement.is_active == True,
            Announcement.starts_at <= now_utc,
            or_(Announcement.ends_at.is_(None), Announcement.ends_at >= now_utc),
        )
        .order_by(Announcement.starts_at.desc(), Announcement.created_at.desc())
        .first()
    )

    if not announcement:
        return AnnouncementResponse(message="", starts_at=None, ends_at=None, updated_at=None)

    return AnnouncementResponse(
        message=announcement.message,
        starts_at=announcement.starts_at,
        ends_at=announcement.ends_at,
        updated_at=announcement.updated_at or announcement.created_at,
    )


@router.get("/super-admin/latest", response_model=AnnouncementResponse)
def get_latest_announcement_for_super_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)

    announcement = (
        db.query(Announcement)
        .filter(Announcement.is_active == True)
        .order_by(Announcement.created_at.desc())
        .first()
    )

    if not announcement:
        return AnnouncementResponse(message="", starts_at=None, ends_at=None, updated_at=None)

    return AnnouncementResponse(
        message=announcement.message,
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

    if ends_at is not None and ends_at <= starts_at:
        raise HTTPException(status_code=400, detail="End time must be later than post time.")

    # Keep one live announcement at a time.
    active_rows = db.query(Announcement).filter(Announcement.is_active == True).all()
    for row in active_rows:
        row.is_active = False
        row.updated_by = current_user.id

    new_announcement = Announcement(
        message=message,
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
            starts_at=new_announcement.starts_at,
            ends_at=new_announcement.ends_at,
            updated_at=new_announcement.updated_at or new_announcement.created_at,
        ),
    )


@router.delete("/super-admin/current", response_model=AnnouncementClearResponse)
def clear_current_announcement(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)

    active_rows = db.query(Announcement).filter(Announcement.is_active == True).all()

    if not active_rows:
        return AnnouncementClearResponse(message="No active announcement to clear.")

    for row in active_rows:
        row.is_active = False
        row.updated_by = current_user.id

    db.commit()
    return AnnouncementClearResponse(message="Announcement cleared successfully.")
