"""Backup reminder processor for scheduled in-app notifications."""

from datetime import datetime

import pytz
from sqlalchemy.orm import Session

from models.auditlog import Auditlog
from models.auth import User
from models.company import Company

MANILA_TZ = pytz.timezone("Asia/Manila")
BACKUP_REMINDER_MESSAGE = "Please remember to back up your CRM data today."


def _should_notify_today(frequency: str, now_ph: datetime) -> bool:
    freq = (frequency or "Daily").strip().lower()

    if freq == "daily":
        return True
    if freq == "weekly":
        return now_ph.weekday() == 0  # Monday
    if freq == "monthly":
        return now_ph.day == 1
    if freq == "quarterly":
        return now_ph.day == 1 and now_ph.month in (1, 4, 7, 10)
    if freq == "yearly":
        return now_ph.day == 1 and now_ph.month == 1

    return True


def process_backup_reminders(db: Session, now_ph: datetime | None = None) -> int:
    """Create backup reminder notifications for active Admin/CEO users."""
    now = now_ph or datetime.now(MANILA_TZ)
    created_notifications = 0

    companies = db.query(Company).all()

    for company in companies:
        if not _should_notify_today(company.backup_reminder or "Daily", now):
            continue

        target_users = (
            db.query(User)
            .filter(
                User.related_to_company == company.id,
                User.is_active == True,
                User.role.in_(["Admin", "CEO"]),
            )
            .all()
        )

        for user in target_users:
            db.add(
                Auditlog(
                    user_id=user.id,
                    name="System",
                    action="BACKUP_REMINDER",
                    description=BACKUP_REMINDER_MESSAGE,
                    entity_type="Company",
                    entity_id=str(company.id),
                    success=True,
                    is_read=False,
                )
            )
            created_notifications += 1

    db.commit()
    return created_notifications
