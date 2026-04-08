#backend/routers/subscription.py
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import SessionLocal
from models.subscription import Subscription, PlanName, StatusList
from models.company import Company
from schemas.subscription import SubscriptionCreate, SubscriptionResponse
from .auth_utils import get_current_user
from models.auth import User
from datetime import timedelta
from services.subscription_lifecycle import apply_trial_lifecycle, utc_now

router = APIRouter(prefix="/subscription", tags=["Subscription"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/subscribe", response_model=SubscriptionResponse)
def subscribe(user: SubscriptionCreate, response: Response, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    now = utc_now()
    incoming_plan = (user.plan_name or "").strip()
    incoming_plan_lower = incoming_plan.lower()

    # If signup sends Free, we convert to a 15-day Pro trial by default.
    if incoming_plan_lower == PlanName.FREE.value.lower():
        normalized_plan_name = PlanName.PRO.value
        normalized_status = StatusList.TRIAL.value
        price = 0.0
        is_trial = True
        start_date = now
        end_date = now + timedelta(days=15)
    else:
        allowed_plans = {
            PlanName.BASIC.value.lower(): PlanName.BASIC.value,
            PlanName.STARTER.value.lower(): PlanName.STARTER.value,
            PlanName.PRO.value.lower(): PlanName.PRO.value,
            PlanName.ENTERPRISE.value.lower(): PlanName.ENTERPRISE.value,
        }
        if incoming_plan_lower not in allowed_plans:
            raise HTTPException(status_code=400, detail="Unsupported plan name")

        normalized_plan_name = allowed_plans[incoming_plan_lower]
        normalized_status = user.status or StatusList.ACTIVE.value
        price = user.price
        is_trial = False
        start_date = user.start_date or now
        end_date = user.end_date or (now + timedelta(days=30))

    latest_subscription = (
        db.query(Subscription)
        .filter(Subscription.company_id == user.company_id)
        .order_by(Subscription.created_at.desc(), Subscription.id.desc())
        .first()
    )

    if latest_subscription:
        latest_subscription.plan_name = normalized_plan_name
        latest_subscription.price = price
        latest_subscription.status = normalized_status
        latest_subscription.is_trial = is_trial
        latest_subscription.start_date = start_date
        latest_subscription.end_date = end_date
        latest_subscription.trial_notification_sent_at = None
        latest_subscription.downgraded_to_free_at = None
        latest_subscription.updated_at = now
        subscription = latest_subscription
    else:
        subscription = Subscription(
            company_id=user.company_id,
            plan_name=normalized_plan_name,
            price=price,
            status=normalized_status,
            is_trial=is_trial,
            start_date=start_date,
            end_date=end_date,
        )
        db.add(subscription)

    # Keep company active unless explicitly suspended by super admin flows.
    company.is_subscription_active = True

    db.commit()
    db.refresh(subscription)
    return subscription


@router.get("/current")
def current_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return apply_trial_lifecycle(db, current_user.related_to_company)


@router.post("/cancel")
def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company_id = current_user.related_to_company
    if not company_id:
        raise HTTPException(status_code=400, detail="Current user is not linked to a company")

    latest_subscription = (
        db.query(Subscription)
        .filter(Subscription.company_id == company_id)
        .order_by(Subscription.created_at.desc(), Subscription.id.desc())
        .first()
    )

    if (
        latest_subscription
        and (latest_subscription.plan_name or "").strip().lower() == PlanName.FREE.value.lower()
        and (latest_subscription.status or "").strip().lower() == StatusList.ACTIVE.value.lower()
    ):
        return {
            "detail": "Already on Free tier",
            "subscription": {
                "id": latest_subscription.id,
                "plan_name": latest_subscription.plan_name,
                "status": latest_subscription.status,
            },
        }

    now = utc_now()

    if latest_subscription:
        latest_subscription.status = StatusList.CANCELLED.value
        latest_subscription.is_trial = False
        latest_subscription.updated_at = now

    free_subscription = Subscription(
        company_id=company_id,
        plan_name=PlanName.FREE.value,
        price=0.0,
        status=StatusList.ACTIVE.value,
        is_trial=False,
        start_date=now,
        end_date=None,
        downgraded_to_free_at=now,
    )
    db.add(free_subscription)

    db.commit()
    db.refresh(free_subscription)

    return {
        "detail": "Subscription cancelled. Organization moved to Free tier.",
        "subscription": {
            "id": free_subscription.id,
            "plan_name": free_subscription.plan_name,
            "status": free_subscription.status,
        },
    }
