import random
import string
from datetime import timedelta
from typing import Optional, Dict, Any
from urllib.parse import quote

from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.auth import User
from models.promo import PromoCode, PromoRedemption
from services.subscription_lifecycle import (
    apply_discount_lifecycle_for_subscription,
    apply_trial_lifecycle,
    get_latest_subscription,
    to_utc,
    utc_now,
)


ALLOWED_PROMO_PURPOSES = {
    "CUSTOM",
    "TRIAL_EXTENSION",
    "SUBSCRIPTION_EXTENSION",
    "PRICE_DISCOUNT_PERCENT",
    "PRICE_DISCOUNT_FIXED",
}

ALLOWED_TARGET_SCOPES = {"company", "user", "both"}

COMPANY_LEVEL_EFFECT_PURPOSES = {
    "TRIAL_EXTENSION",
    "SUBSCRIPTION_EXTENSION",
    "PRICE_DISCOUNT_PERCENT",
    "PRICE_DISCOUNT_FIXED",
}

ALPHANUMERIC = string.ascii_uppercase + string.digits


def normalize_promo_code(value: str) -> str:
    return "".join(ch for ch in (value or "").upper() if ch.isalnum())


def ensure_valid_promo_code_shape(code: str) -> None:
    if len(code) not in (6, 8):
        raise ValueError("Promo code must be exactly 6 or 8 characters.")

    if not all(ch in ALPHANUMERIC for ch in code):
        raise ValueError("Promo code must contain only letters and numbers.")

    if not any(ch.isalpha() for ch in code) or not any(ch.isdigit() for ch in code):
        raise ValueError("Promo code must combine letters and numbers.")


def build_qr_code_url(code: str) -> str:
    payload = quote(f"promo:{code}")
    return f"https://api.qrserver.com/v1/create-qr-code/?size=240x240&data={payload}"


def generate_unique_promo_code(db: Session, length: int = 8) -> str:
    if length not in (6, 8):
        raise ValueError("Promo code length must be either 6 or 8.")

    for _ in range(1000):
        code = "".join(random.choice(ALPHANUMERIC) for _ in range(length))
        if any(ch.isalpha() for ch in code) and any(ch.isdigit() for ch in code):
            exists = db.query(PromoCode).filter(PromoCode.code == code).first()
            if not exists:
                return code

    raise ValueError("Unable to generate a unique promo code. Try again.")


def validate_promo_configuration(
    *,
    purpose: str,
    target_scope: str,
    extend_days: int,
    discount_percent: Optional[float],
    discount_amount: Optional[float],
    expires_at: Optional[Any] = None,
) -> None:
    normalized_purpose = (purpose or "").strip().upper()
    normalized_scope = (target_scope or "").strip().lower()

    if normalized_purpose not in ALLOWED_PROMO_PURPOSES:
        raise ValueError("Invalid promo purpose.")

    if normalized_scope not in ALLOWED_TARGET_SCOPES:
        raise ValueError("Invalid promo target scope.")

    if normalized_purpose in {"TRIAL_EXTENSION", "SUBSCRIPTION_EXTENSION"} and extend_days <= 0:
        raise ValueError("extend_days must be greater than 0 for extension promos.")

    if normalized_purpose == "PRICE_DISCOUNT_PERCENT":
        if discount_percent is None or discount_percent <= 0:
            raise ValueError("discount_percent must be greater than 0 for percent discounts.")
        if discount_percent > 100:
            raise ValueError("discount_percent cannot exceed 100.")
        if expires_at is None:
            raise ValueError("Price discount promos must have an expiry date.")

    if normalized_purpose == "PRICE_DISCOUNT_FIXED":
        if discount_amount is None or discount_amount <= 0:
            raise ValueError("discount_amount must be greater than 0 for fixed discounts.")
        if expires_at is None:
            raise ValueError("Price discount promos must have an expiry date.")


def _validate_promo_window(promo: PromoCode) -> None:
    now = utc_now()
    starts_at = to_utc(promo.starts_at)
    expires_at = to_utc(promo.expires_at)

    if starts_at and now < starts_at:
        raise ValueError("Promo is not active yet.")

    if expires_at and now > expires_at:
        raise ValueError("Promo has already expired.")


def is_promo_window_open(promo: PromoCode) -> bool:
    now = utc_now()
    starts_at = to_utc(promo.starts_at)
    expires_at = to_utc(promo.expires_at)

    if starts_at and now < starts_at:
        return False
    if expires_at and now > expires_at:
        return False
    return True


def _resolve_company_id(user: User, requested_company_id: Optional[int]) -> Optional[int]:
    if requested_company_id is None:
        return user.related_to_company

    role = (user.role or "").strip().upper()
    if role == "ADMIN":
        return requested_company_id

    if user.related_to_company != requested_company_id:
        raise ValueError("You can only redeem promo codes for your own organization.")

    return requested_company_id


def is_user_scope_company_effect_explicitly_allowed(promo: PromoCode) -> bool:
    data = promo.extra_data or {}
    return bool(data.get("allow_company_subscription_effects_for_user_scope"))


def is_trial_subscription(subscription: Optional[Any]) -> bool:
    if not subscription:
        return False
    return bool(subscription.is_trial) or (subscription.status or "").strip().lower() == "trial"


def get_subscription_state_block_reason(
    promo: PromoCode,
    latest_subscription: Optional[Any],
) -> Optional[str]:
    purpose = (promo.purpose or "CUSTOM").strip().upper()

    if purpose not in {"TRIAL_EXTENSION", "SUBSCRIPTION_EXTENSION"}:
        return None

    if not latest_subscription:
        return "No subscription found for this organization."

    trial_state = is_trial_subscription(latest_subscription)

    if purpose == "TRIAL_EXTENSION" and not trial_state:
        return "Increased Free Trial is only available while the company is on a trial tier."

    if purpose == "SUBSCRIPTION_EXTENSION" and trial_state:
        return "Subscription Extension is only available for non-trial tiers."

    return None


def build_promo_access_payload(
    promo: PromoCode,
    *,
    can_redeem: bool = True,
    reason: Optional[str] = None,
) -> Dict[str, Any]:
    purpose = (promo.purpose or "CUSTOM").strip().upper()
    effect_preview = "Custom promo"

    if purpose in {"TRIAL_EXTENSION", "SUBSCRIPTION_EXTENSION"}:
        effect_preview = f"Extends by {int(promo.extend_days or 0)} day(s)"
    elif purpose == "PRICE_DISCOUNT_PERCENT":
        effect_preview = f"{float(promo.discount_percent or 0)}% discount"
    elif purpose == "PRICE_DISCOUNT_FIXED":
        effect_preview = f"Fixed discount {float(promo.discount_amount or 0):.2f}"

    return {
        "id": promo.id,
        "name": promo.name,
        "description": promo.description,
        "visibility": "public" if bool(promo.is_public) else "private",
        "is_public": bool(promo.is_public),
        "purpose": promo.purpose,
        "target_scope": promo.target_scope,
        "manual_code": promo.manual_code,
        "code_length": promo.code_length,
        "effect_preview": effect_preview,
        "extend_days": promo.extend_days,
        "discount_percent": promo.discount_percent,
        "discount_amount": promo.discount_amount,
        "qr_code_url": promo.qr_code_url,
        "starts_at": promo.starts_at,
        "expires_at": promo.expires_at,
        "is_active": promo.is_active,
        "allow_company_subscription_effects_for_user_scope": is_user_scope_company_effect_explicitly_allowed(promo),
        "can_redeem": can_redeem,
        "reason": reason,
    }


def redeem_promo_code(
    db: Session,
    *,
    user: User,
    promo_code: str,
    company_id: Optional[int] = None,
    channel: str = "account",
) -> Dict[str, Any]:
    normalized_code = normalize_promo_code(promo_code)
    ensure_valid_promo_code_shape(normalized_code)

    promo = (
        db.query(PromoCode)
        .filter(or_(PromoCode.code == normalized_code, PromoCode.manual_code == normalized_code))
        .first()
    )

    if not promo:
        raise ValueError("Promo code not found.")

    if not promo.is_active:
        raise ValueError("Promo code is inactive.")

    _validate_promo_window(promo)

    resolved_company_id = _resolve_company_id(user, company_id)

    target_scope = (promo.target_scope or "company").strip().lower()
    if target_scope == "company" and not resolved_company_id:
        raise ValueError("This promo can only be redeemed by an organization account.")

    purpose = (promo.purpose or "CUSTOM").strip().upper()

    if (
        target_scope == "user"
        and purpose in COMPANY_LEVEL_EFFECT_PURPOSES
        and not is_user_scope_company_effect_explicitly_allowed(promo)
    ):
        raise ValueError(
            "This user-targeted promo cannot change organization subscription settings unless explicitly allowed by Super Admin."
        )

    if promo.max_total_redemptions is not None and promo.total_redemptions >= promo.max_total_redemptions:
        raise ValueError("Promo code has reached its redemption limit.")

    if promo.max_redemptions_per_company is not None and resolved_company_id:
        company_redeemed = (
            db.query(PromoRedemption)
            .filter(
                PromoRedemption.promo_id == promo.id,
                PromoRedemption.redeemed_for_company_id == resolved_company_id,
            )
            .count()
        )
        if company_redeemed >= promo.max_redemptions_per_company:
            raise ValueError("This promo has already been used by your organization.")

    if promo.max_redemptions_per_user is not None:
        user_redeemed = (
            db.query(PromoRedemption)
            .filter(
                PromoRedemption.promo_id == promo.id,
                PromoRedemption.redeemed_by_user_id == user.id,
            )
            .count()
        )
        if user_redeemed >= promo.max_redemptions_per_user:
            raise ValueError("You have already used this promo code.")

    latest_subscription = get_latest_subscription(db, resolved_company_id) if resolved_company_id else None

    subscription_state_reason = get_subscription_state_block_reason(promo, latest_subscription)
    if subscription_state_reason:
        raise ValueError(subscription_state_reason)

    now = utc_now()
    applied_effect = "Promo redeemed successfully."
    discount_applied: Optional[float] = None
    days_extended: Optional[int] = None

    if purpose == "TRIAL_EXTENSION":
        days_extended = int(promo.extend_days or 0)
        base_end = to_utc(latest_subscription.end_date) or now
        latest_subscription.end_date = base_end + timedelta(days=days_extended)
        latest_subscription.updated_at = now
        latest_subscription.trial_notification_sent_at = None
        applied_effect = f"Trial extended by {days_extended} day(s)."

    elif purpose == "SUBSCRIPTION_EXTENSION":
        days_extended = int(promo.extend_days or 0)
        base_end = to_utc(latest_subscription.end_date) or now
        latest_subscription.end_date = base_end + timedelta(days=days_extended)
        latest_subscription.updated_at = now
        applied_effect = f"Subscription extended by {days_extended} day(s)."

    elif purpose == "PRICE_DISCOUNT_PERCENT":
        if not latest_subscription:
            raise ValueError("No subscription found for this organization.")

        percent = float(promo.discount_percent or 0)
        discount_ends_at = to_utc(promo.expires_at)
        if not discount_ends_at or discount_ends_at <= now:
            raise ValueError("Discount promo is expired or has no valid expiry.")

        latest_subscription.promo_discount_is_active = True
        latest_subscription.promo_discount_type = "percent"
        latest_subscription.promo_discount_value = percent
        latest_subscription.promo_discount_code = promo.code
        latest_subscription.promo_discount_applied_at = now
        latest_subscription.promo_discount_ends_at = discount_ends_at

        apply_discount_lifecycle_for_subscription(latest_subscription)
        discount_applied = float(promo.discount_percent or 0)
        latest_subscription.updated_at = now
        applied_effect = f"Applied {percent}% discount until {discount_ends_at.isoformat()}."

    elif purpose == "PRICE_DISCOUNT_FIXED":
        if not latest_subscription:
            raise ValueError("No subscription found for this organization.")

        fixed_amount = float(promo.discount_amount or 0)
        discount_ends_at = to_utc(promo.expires_at)
        if not discount_ends_at or discount_ends_at <= now:
            raise ValueError("Discount promo is expired or has no valid expiry.")

        latest_subscription.promo_discount_is_active = True
        latest_subscription.promo_discount_type = "fixed"
        latest_subscription.promo_discount_value = fixed_amount
        latest_subscription.promo_discount_code = promo.code
        latest_subscription.promo_discount_applied_at = now
        latest_subscription.promo_discount_ends_at = discount_ends_at

        apply_discount_lifecycle_for_subscription(latest_subscription)
        discount_applied = fixed_amount
        latest_subscription.updated_at = now
        applied_effect = f"Applied fixed discount ({discount_applied:.2f}) until {discount_ends_at.isoformat()}."

    redemption = PromoRedemption(
        promo_id=promo.id,
        promo_code_snapshot=promo.code,
        redeemed_by_user_id=user.id,
        redeemed_for_company_id=resolved_company_id,
        redemption_channel=(channel or "account")[:30],
        applied_effect=applied_effect,
        discount_applied=discount_applied,
        days_extended=days_extended,
    )
    db.add(redemption)

    promo.total_redemptions = int(promo.total_redemptions or 0) + 1

    subscription_status = apply_trial_lifecycle(db, resolved_company_id, commit=False) if resolved_company_id else None

    return {
        "promo_id": promo.id,
        "promo_code": promo.code,
        "manual_code": promo.manual_code,
        "purpose": promo.purpose,
        "target_scope": promo.target_scope,
        "applied_effect": applied_effect,
        "discount_applied": discount_applied,
        "days_extended": days_extended,
        "total_redemptions": promo.total_redemptions,
        "subscription_status": subscription_status,
    }
