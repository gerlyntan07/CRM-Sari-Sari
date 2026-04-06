from datetime import datetime, timezone
from math import ceil
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from models.auth import User
from models.subscription import Subscription, StatusList, PlanName
from routers.aws_ses_utils import send_trial_ending_soon_email


TRIAL_DAYS = 15
TRIAL_WARNING_DAYS = 1


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_utc(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def get_latest_subscription(db: Session, company_id: int) -> Optional[Subscription]:
    return (
        db.query(Subscription)
        .filter(Subscription.company_id == company_id)
        .order_by(Subscription.created_at.desc(), Subscription.id.desc())
        .first()
    )


def _trial_days_remaining(end_date: Optional[datetime]) -> Optional[int]:
    trial_end_utc = to_utc(end_date)
    if not trial_end_utc:
        return None

    remaining_seconds = (trial_end_utc - utc_now()).total_seconds()
    if remaining_seconds <= 0:
        return 0

    return ceil(remaining_seconds / 86400)


def _build_payload(subscription: Optional[Subscription], *, downgraded: bool = False) -> Dict[str, Any]:
    if not subscription:
        return {
            "current_plan": PlanName.FREE.value,
            "current_status": StatusList.ACTIVE.value,
            "is_trial": False,
            "is_free_tier": True,
            "trial_days_remaining": None,
            "trial_ends_at": None,
            "show_trial_ending_banner": False,
            "show_downgraded_banner": False,
            "message": None,
        }

    is_trial = bool(subscription.is_trial) or subscription.status == StatusList.TRIAL.value
    days_remaining = _trial_days_remaining(subscription.end_date) if is_trial else None
    is_free = (subscription.plan_name or "").strip().lower() == PlanName.FREE.value.lower()

    show_trial_ending_banner = bool(
        is_trial and days_remaining is not None and 0 < days_remaining <= TRIAL_WARNING_DAYS
    )

    message = None
    if downgraded:
        message = (
            "Your 15-day Pro trial has ended. Your organization is now on the Free tier. "
            "To unlock Pro features again, please subscribe to a paid plan."
        )
    elif show_trial_ending_banner:
        message = (
            f"Your 15-day Pro trial ends in {days_remaining} day(s). "
            "Subscribe now to avoid interruption of paid features."
        )

    return {
        "current_plan": subscription.plan_name,
        "current_status": subscription.status,
        "is_trial": is_trial,
        "is_free_tier": is_free,
        "trial_days_remaining": days_remaining,
        "trial_ends_at": subscription.end_date,
        "show_trial_ending_banner": show_trial_ending_banner,
        "show_downgraded_banner": downgraded,
        "message": message,
    }


def _create_free_tier_subscription(db: Session, company_id: int) -> Subscription:
    free_subscription = Subscription(
        company_id=company_id,
        plan_name=PlanName.FREE.value,
        price=0.0,
        status=StatusList.ACTIVE.value,
        is_trial=False,
        start_date=utc_now(),
        end_date=None,
        downgraded_to_free_at=utc_now(),
    )
    db.add(free_subscription)
    return free_subscription


def apply_trial_lifecycle(db: Session, company_id: Optional[int], *, commit: bool = True) -> Dict[str, Any]:
    if not company_id:
        return _build_payload(None)

    subscription = get_latest_subscription(db, company_id)
    if not subscription:
        return _build_payload(None)

    is_trial = bool(subscription.is_trial) or subscription.status == StatusList.TRIAL.value
    end_at = to_utc(subscription.end_date)

    if is_trial and end_at and utc_now() >= end_at:
        # Expire old trial
        subscription.status = StatusList.EXPIRED.value
        subscription.is_trial = False
        subscription.updated_at = utc_now()
        subscription.downgraded_to_free_at = utc_now()

        # Create a new Free-tier active subscription as the latest effective subscription
        downgraded_subscription = _create_free_tier_subscription(db, company_id)

        if commit:
            db.commit()
            db.refresh(downgraded_subscription)

        return _build_payload(downgraded_subscription, downgraded=True)

    # Recovery path for manual testing/data edits:
    # if latest row is already EXPIRED non-Free, force effective plan to Free.
    if (
        subscription.status == StatusList.EXPIRED.value
        and (subscription.plan_name or "").strip().lower() != PlanName.FREE.value.lower()
    ):
        downgraded_subscription = _create_free_tier_subscription(db, company_id)

        if commit:
            db.commit()
            db.refresh(downgraded_subscription)

        return _build_payload(downgraded_subscription, downgraded=True)

    return _build_payload(subscription)


def process_trial_notifications(db: Session) -> int:
    """Send trial reminder emails and process auto-downgrades. Returns processed count."""
    processed = 0
    trials = (
        db.query(Subscription)
        .filter(
            Subscription.status == StatusList.TRIAL.value,
            Subscription.is_trial == True,
        )
        .all()
    )

    for subscription in trials:
        payload = apply_trial_lifecycle(db, subscription.company_id, commit=False)
        processed += 1

        # If still in trial and within warning window, send reminder once.
        if (
            payload.get("is_trial")
            and payload.get("trial_days_remaining") is not None
            and 0 < payload["trial_days_remaining"] <= TRIAL_WARNING_DAYS
            and subscription.trial_notification_sent_at is None
        ):
            tenant = (
                db.query(User)
                .filter(
                    User.related_to_company == subscription.company_id,
                    User.is_active == True,
                    User.role.ilike("ceo"),
                )
                .order_by(User.id.asc())
                .first()
            )

            if tenant:
                send_trial_ending_soon_email(
                    to_email=tenant.email,
                    first_name=tenant.first_name,
                    days_remaining=payload["trial_days_remaining"],
                )
                subscription.trial_notification_sent_at = utc_now()

    db.commit()
    return processed
