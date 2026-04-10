from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from types import SimpleNamespace

from database import SessionLocal
from models.auth import User
from models.promo import PromoCode, PromoRedemption
from schemas.promo import PromoRedeemRequest
from services.promo_service import (
    COMPANY_LEVEL_EFFECT_PURPOSES,
    build_promo_access_payload,
    get_subscription_state_block_reason,
    get_latest_subscription,
    is_promo_window_open,
    is_user_scope_company_effect_explicitly_allowed,
    redeem_promo_code,
)
from .auth_utils import get_current_user


router = APIRouter(prefix="/promo", tags=["Promo"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/signup/available")
def list_signup_promos(db: Session = Depends(get_db)):
    signup_trial_subscription = SimpleNamespace(is_trial=True, status="trial")

    promos = (
        db.query(PromoCode)
        .filter(PromoCode.is_active == True, PromoCode.is_public == True)
        .order_by(PromoCode.created_at.desc(), PromoCode.id.desc())
        .all()
    )

    items = []
    for promo in promos:
        if not is_promo_window_open(promo):
            continue

        # Signup creates a fresh trial subscription, so only trial-eligible promo purposes are shown.
        if get_subscription_state_block_reason(promo, signup_trial_subscription):
            continue

        items.append(build_promo_access_payload(promo, can_redeem=True))

    return {
        "total": len(items),
        "promos": items,
    }


@router.get("/available")
def list_available_promos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company_id = current_user.related_to_company
    latest_subscription = get_latest_subscription(db, company_id) if company_id else None

    promos = (
        db.query(PromoCode)
        .filter(PromoCode.is_active == True, PromoCode.is_public == True)
        .order_by(PromoCode.created_at.desc(), PromoCode.id.desc())
        .all()
    )

    items = []
    for promo in promos:
        if not is_promo_window_open(promo):
            continue

        target_scope = (promo.target_scope or "company").strip().lower()
        purpose = (promo.purpose or "CUSTOM").strip().upper()

        can_redeem = True
        reason = None

        if target_scope == "company" and not company_id:
            can_redeem = False
            reason = "Organization account required for this promo."

        if (
            can_redeem
            and target_scope == "user"
            and purpose in COMPANY_LEVEL_EFFECT_PURPOSES
            and not is_user_scope_company_effect_explicitly_allowed(promo)
        ):
            can_redeem = False
            reason = "User-targeted promo cannot apply company subscription changes unless explicitly allowed."

        if can_redeem:
            subscription_state_reason = get_subscription_state_block_reason(promo, latest_subscription)
            if subscription_state_reason:
                can_redeem = False
                reason = subscription_state_reason

        if can_redeem and promo.max_total_redemptions is not None and int(promo.total_redemptions or 0) >= promo.max_total_redemptions:
            can_redeem = False
            reason = "Promo has reached its redemption limit."

        if can_redeem and promo.max_redemptions_per_user is not None:
            user_redeemed = (
                db.query(PromoRedemption)
                .filter(
                    PromoRedemption.promo_id == promo.id,
                    PromoRedemption.redeemed_by_user_id == current_user.id,
                )
                .count()
            )
            if user_redeemed >= promo.max_redemptions_per_user:
                can_redeem = False
                reason = "Already used by this user."

        if can_redeem and company_id and promo.max_redemptions_per_company is not None:
            company_redeemed = (
                db.query(PromoRedemption)
                .filter(
                    PromoRedemption.promo_id == promo.id,
                    PromoRedemption.redeemed_for_company_id == company_id,
                )
                .count()
            )
            if company_redeemed >= promo.max_redemptions_per_company:
                can_redeem = False
                reason = "Already used by this organization."

        items.append(build_promo_access_payload(promo, can_redeem=can_redeem, reason=reason))

    return {
        "total": len(items),
        "promos": items,
    }


@router.post("/redeem")
def redeem_promo(
    payload: PromoRedeemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = redeem_promo_code(
            db,
            user=current_user,
            promo_code=payload.code,
            company_id=payload.company_id,
            channel=payload.redemption_channel,
        )
        db.commit()
        return {
            "detail": "Promo applied successfully.",
            **result,
        }
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        db.rollback()
        raise
