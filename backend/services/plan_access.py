from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.auth import User
from services.subscription_lifecycle import apply_trial_lifecycle


def get_current_plan(db: Session, current_user: User) -> str:
    status = apply_trial_lifecycle(db, current_user.related_to_company)
    return (status.get("current_plan") or "Free").strip().lower()


def is_current_plan(db: Session, current_user: User, plan_name: str) -> bool:
    return get_current_plan(db, current_user) == (plan_name or "").strip().lower()


def enforce_starter_restriction(db: Session, current_user: User, feature_name: str):
    """
    Block selected features for Starter tier.
    """
    if is_current_plan(db, current_user, "starter"):
        raise HTTPException(
            status_code=403,
            detail=f"{feature_name} is not available on the Starter plan. Please upgrade to Pro or Enterprise.",
        )
