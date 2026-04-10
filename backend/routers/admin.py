# backend/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, Request, Body, File, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from database import SessionLocal
from models.auth import User, UserRole
from models.company import Company
from models.subscription import Subscription, StatusList, PlanName
from models.auditlog import Auditlog
from schemas.company import CompanyCreate
from jose import jwt, JWTError
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import os
import random
import base64

router = APIRouter(prefix="/admin", tags=["Admin"])

SECRET_KEY = os.getenv("SECRET_KEY", "defaultsecretkey")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to check if user is super admin
def get_current_super_admin(request: Request, db: Session = Depends(get_db)):
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Access denied. Admin privileges required.")
    
    return user

# Get all tenants/companies with their users and subscription info
@router.get("/tenants")
def get_all_tenants(
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get all companies/tenants with their users and subscription details"""
    companies = db.query(Company).options(
        joinedload(Company.users),
        joinedload(Company.plan)
    ).all()

    user_ids = [user.id for company in companies for user in company.users]
    latest_login_logs = {}
    if user_ids:
        login_logs = db.query(Auditlog).filter(
            Auditlog.user_id.in_(user_ids),
            Auditlog.action == "LOGIN"
        ).order_by(Auditlog.timestamp.desc()).all()

        for log in login_logs:
            if log.user_id not in latest_login_logs:
                latest_login_logs[log.user_id] = log
    
    tenants_data = []
    for company in companies:
        # Exclude users with specific roles when counting
        excluded_roles = ['Admin', 'Technical Support', 'Marketing Admin']
        filtered_users = [u for u in company.users if u.role not in excluded_roles]
        
        # Count active users (excluding admin roles)
        active_users = len([u for u in filtered_users if u.is_active])
        total_users = len(filtered_users)
        
        # Get subscription info
        subscription = company.plan[0] if company.plan else None

        company_logins = [
            (u.last_login, latest_login_logs.get(u.id))
            for u in company.users
            if u.last_login is not None
        ]
        company_logins.sort(key=lambda item: item[0], reverse=True)
        latest_company_login = company_logins[0] if company_logins else None
        
        tenant_info = {
            "id": company.id,
            "company_name": company.company_name,
            "company_number": company.company_number,
            "slug": company.slug,
            "company_website": company.company_website,
            "company_logo": company.company_logo,
            "address": company.address,
            "currency": company.currency,
            "quota_period": company.quota_period,
            "tax_rate": float(company.tax_rate) if company.tax_rate else 0,
            "vat_registration_number": company.vat_registration_number,
            "tax_id_number": company.tax_id_number,
            "calendar_start_day": company.calendar_start_day,
            "backup_reminder": company.backup_reminder,
            "is_subscription_active": company.is_subscription_active,
            "tenant_number": company.tenant_number,
            "created_at": company.created_at,
            "updated_at": company.updated_at,
            "total_users": total_users,
            "active_users": active_users,
            "latest_last_login": latest_company_login[0] if latest_company_login else None,
            "latest_last_login_location": latest_company_login[1].ip_address if latest_company_login and latest_company_login[1] else None,
            "subscription": {
                "id": subscription.id if subscription else None,
                "plan_name": subscription.plan_name if subscription else None,
                "status": subscription.status if subscription else None,
                "start_date": subscription.start_date if subscription else None,
                "end_date": subscription.end_date if subscription else None,
            } if subscription else None,
            "users": [
                {
                    "id": u.id,
                    "first_name": u.first_name,
                    "last_name": u.last_name,
                    "email": u.email,
                    "role": u.role,
                    "is_active": u.is_active,
                    "created_at": u.created_at,
                    "last_login": u.last_login,
                    "last_login_location": latest_login_logs.get(u.id).ip_address if latest_login_logs.get(u.id) else None,
                } for u in company.users
            ]
        }
        tenants_data.append(tenant_info)
    
    return {
        "total_tenants": len(tenants_data),
        "tenants": tenants_data
    }

# Create a new tenant
@router.post("/tenants")
async def create_tenant(
    company_name: str = Form(...),
    company_number: str = Form(...),
    slug: Optional[str] = Form(None),
    company_website: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    company_logo: Optional[UploadFile] = File(None),
    currency: Optional[str] = Form("PHP"),
    quota_period: Optional[str] = Form("January"),
    tax_rate: Optional[float] = Form(0),
    vat_registration_number: Optional[str] = Form(None),
    tax_id_number: Optional[str] = Form(None),
    is_subscription_active: Optional[bool] = Form(True),
    calendar_start_day: Optional[str] = Form("Monday"),
    backup_reminder: Optional[str] = Form("Daily"),
    fiscal_year_start: Optional[str] = Form("January"),
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Create a new tenant/company (admin only)"""
    # Validate required fields
    if not company_name or not company_name.strip():
        raise HTTPException(status_code=400, detail="Company name is required.")
    
    if not company_number or not company_number.strip():
        raise HTTPException(status_code=400, detail="Company number is required.")
    
    # Uniqueness validation for company_name
    if db.query(Company).filter(Company.company_name == company_name).first():
        raise HTTPException(status_code=400, detail="Company name already exists.")

    # Uniqueness validation for company_number
    if db.query(Company).filter(Company.company_number == company_number).first():
        raise HTTPException(status_code=400, detail="Company number already exists.")
    
    # Handle logo file upload - convert to base64 with data URI prefix
    logo_base64 = None
    if company_logo:
        try:
            contents = await company_logo.read()
            encoded = base64.b64encode(contents).decode('utf-8')
            mime_type = company_logo.content_type or "image/png"
            logo_base64 = f"data:{mime_type};base64,{encoded}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process logo: {str(e)}")
    
    # Generate unique tenant_number
    def generate_tenant_number():
        return ''.join([str(random.randint(0, 9)) for _ in range(12)])

    tenant_number = generate_tenant_number()
    while db.query(Company).filter(Company.tenant_number == tenant_number).first():
        tenant_number = generate_tenant_number()

    # Create new company
    new_company = Company(
        company_name=company_name,
        company_number=company_number,
        slug=slug if slug else None,
        company_website=company_website if company_website else None,
        address=address if address else None,
        company_logo=logo_base64,
        currency=currency or "PHP",
        quota_period=quota_period or "January",
        tax_rate=float(tax_rate) if tax_rate else 0,
        vat_registration_number=vat_registration_number if vat_registration_number else None,
        tax_id_number=tax_id_number if tax_id_number else None,
        tenant_number=tenant_number,
        is_subscription_active=bool(is_subscription_active),
        calendar_start_day=calendar_start_day or "Monday",
        backup_reminder=backup_reminder or "Daily"
    )

    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    
    # Create subscription for the new tenant - Pro plan with 15 days trial
    subscription = Subscription(
        company_id=new_company.id,
        plan_name=PlanName.PRO.value,
        price=0.0,
        status=StatusList.TRIAL.value,
        is_trial=True,
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=15)
    )
    
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    return {
        "id": new_company.id,
        "company_name": new_company.company_name,
        "company_number": new_company.company_number,
        "slug": new_company.slug,
        "company_website": new_company.company_website,
        "address": new_company.address,
        "company_logo": new_company.company_logo,
        "currency": new_company.currency,
        "tenant_number": new_company.tenant_number,
        "is_subscription_active": new_company.is_subscription_active,
        "calendar_start_day": new_company.calendar_start_day,
        "backup_reminder": new_company.backup_reminder,
        "created_at": new_company.created_at,
        "updated_at": new_company.updated_at,
        "message": "Tenant created successfully"
    }

# Get specific tenant details
@router.get("/tenants/{tenant_id}")
def get_tenant_details(
    tenant_id: int,
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific tenant"""
    company = db.query(Company).options(
        joinedload(Company.users),
        joinedload(Company.plan),
        joinedload(Company.territory)
    ).filter(Company.id == tenant_id).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Tenant not found")

    user_ids = [u.id for u in company.users]
    latest_login_logs = {}
    if user_ids:
        login_logs = db.query(Auditlog).filter(
            Auditlog.user_id.in_(user_ids),
            Auditlog.action == "LOGIN"
        ).order_by(Auditlog.timestamp.desc()).all()

        for log in login_logs:
            if log.user_id not in latest_login_logs:
                latest_login_logs[log.user_id] = log
    
    subscription = company.plan[0] if company.plan else None

    company_logins = [
        (u.last_login, latest_login_logs.get(u.id))
        for u in company.users
        if u.last_login is not None
    ]
    company_logins.sort(key=lambda item: item[0], reverse=True)
    latest_company_login = company_logins[0] if company_logins else None
    
    return {
        "id": company.id,
        "company_name": company.company_name,
        "company_number": company.company_number,
        "slug": company.slug,
        "company_website": company.company_website,
        "company_logo": company.company_logo,
        "address": company.address,
        "currency": company.currency,
        "quota_period": company.quota_period,
        "tax_rate": float(company.tax_rate) if company.tax_rate else 0,
        "vat_registration_number": company.vat_registration_number,
        "tax_id_number": company.tax_id_number,
        "calendar_start_day": company.calendar_start_day,
        "backup_reminder": company.backup_reminder,
        "tenant_number": company.tenant_number,
        "is_subscription_active": company.is_subscription_active,
        "created_at": company.created_at,
        "updated_at": company.updated_at,
        "latest_last_login": latest_company_login[0] if latest_company_login else None,
        "latest_last_login_location": latest_company_login[1].ip_address if latest_company_login and latest_company_login[1] else None,
        "subscription": {
            "id": subscription.id if subscription else None,
            "plan_name": subscription.plan_name if subscription else None,
            "status": subscription.status if subscription else None,
            "start_date": subscription.start_date if subscription else None,
            "end_date": subscription.end_date if subscription else None,
        } if subscription else None,
        "territories_count": len(company.territory),
        "users": [
            {
                "id": u.id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "role": u.role,
                "phone_number": u.phone_number,
                "profile_picture": u.profile_picture,
                "is_active": u.is_active,
                "auth_provider": u.auth_provider,
                "created_at": u.created_at,
                "last_login": u.last_login,
                "last_login_location": latest_login_logs.get(u.id).ip_address if latest_login_logs.get(u.id) else None,
            } for u in company.users
        ]
    }

# Update tenant details
@router.put("/tenants/{tenant_id}")
async def update_tenant(
    tenant_id: int,
    company_name: Optional[str] = Form(None),
    company_number: Optional[str] = Form(None),
    slug: Optional[str] = Form(None),
    company_website: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    company_logo: Optional[UploadFile] = File(None),
    currency: Optional[str] = Form(None),
    quota_period: Optional[str] = Form(None),
    tax_rate: Optional[float] = Form(None),
    vat_registration_number: Optional[str] = Form(None),
    tax_id_number: Optional[str] = Form(None),
    calendar_start_day: Optional[str] = Form(None),
    backup_reminder: Optional[str] = Form(None),
    fiscal_year_start: Optional[str] = Form(None),
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Update tenant/company information (admin only)"""
    company = db.query(Company).filter(Company.id == tenant_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Update company_name if provided
    if company_name and company_name.strip():
        # Check uniqueness if changing
        if company_name != company.company_name:
            if db.query(Company).filter(
                Company.company_name == company_name,
                Company.id != tenant_id
            ).first():
                raise HTTPException(status_code=400, detail="Company name already exists.")
        company.company_name = company_name
    
    # Update company_number if provided
    if company_number and company_number.strip():
        # Check uniqueness if changing
        if company_number != company.company_number:
            if db.query(Company).filter(
                Company.company_number == company_number,
                Company.id != tenant_id
            ).first():
                raise HTTPException(status_code=400, detail="Company number already exists.")
        company.company_number = company_number
    
    # Update optional fields
    if slug is not None:
        company.slug = slug if slug.strip() else None
    if company_website is not None:
        company.company_website = company_website if company_website.strip() else None
    if address is not None:
        company.address = address if address.strip() else None
    if currency is not None:
        company.currency = currency
    if quota_period is not None:
        company.quota_period = quota_period
    if tax_rate is not None:
        company.tax_rate = float(tax_rate) if tax_rate else 0
    if vat_registration_number is not None:
        company.vat_registration_number = vat_registration_number if vat_registration_number.strip() else None
    if tax_id_number is not None:
        company.tax_id_number = tax_id_number if tax_id_number.strip() else None
    if calendar_start_day is not None:
        company.calendar_start_day = calendar_start_day
    if backup_reminder is not None:
        company.backup_reminder = backup_reminder
    
    # Handle logo upload if provided
    if company_logo:
        try:
            contents = await company_logo.read()
            encoded = base64.b64encode(contents).decode('utf-8')
            mime_type = company_logo.content_type or "image/png"
            company.company_logo = f"data:{mime_type};base64,{encoded}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process logo: {str(e)}")
    
    db.commit()
    db.refresh(company)
    
    return {
        "id": company.id,
        "company_name": company.company_name,
        "company_number": company.company_number,
        "slug": company.slug,
        "company_website": company.company_website,
        "address": company.address,
        "company_logo": company.company_logo,
        "currency": company.currency,
        "tenant_number": company.tenant_number,
        "tax_rate": float(company.tax_rate) if company.tax_rate else 0,
        "calendar_start_day": company.calendar_start_day,
        "backup_reminder": company.backup_reminder,
        "message": "Tenant updated successfully"
    }

# Delete tenant
@router.delete("/tenants/{tenant_id}")
def delete_tenant(
    tenant_id: int,
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Delete a tenant/company (admin only)"""
    company = db.query(Company).filter(Company.id == tenant_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    company_name = company.company_name
    
    # Delete company (cascade will handle related records)
    db.delete(company)
    db.commit()
    
    return {
        "message": f"Tenant '{company_name}' deleted successfully"
    }

# Get admin dashboard statistics
@router.get("/stats")
def get_admin_stats(
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get overall statistics for admin dashboard"""
    total_companies = db.query(Company).count()
    total_users = db.query(User).filter(User.role != UserRole.ADMIN.value).count()
    active_users = db.query(User).filter(
        User.is_active == True,
        User.role != UserRole.ADMIN.value
    ).count()
    
    # Get subscription breakdown
    subscriptions = db.query(Subscription.plan_name, Subscription.status).all()
    subscription_stats = {}
    for plan_name, status in subscriptions:
        key = f"{plan_name}_{status}"
        subscription_stats[key] = subscription_stats.get(key, 0) + 1
    
    return {
        "total_tenants": total_companies,
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "subscription_stats": subscription_stats
    }

# Toggle user active status (for any user in any tenant)
@router.patch("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Toggle user active/inactive status"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent toggling admin status
    if user.role == UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Cannot modify Admin users")
    
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "is_active": user.is_active,
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully"
    }

# Update subscription status
@router.patch("/subscriptions/{subscription_id}/status")
def update_subscription_status(
    subscription_id: int,
    status_data: dict = Body(...),
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Update subscription status (Active, Cancelled, Expired)"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    new_status = status_data.get("status")
    if new_status not in [StatusList.TRIAL.value, StatusList.ACTIVE.value, StatusList.CANCELLED.value, StatusList.EXPIRED.value]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    subscription.status = new_status
    subscription.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(subscription)
    
    return {
        "id": subscription.id,
        "company_id": subscription.company_id,
        "status": subscription.status,
        "message": f"Subscription status updated to {new_status}"
    }

# Get subscription alerts (expiring soon, expired)
@router.get("/subscriptions/alerts")
def get_subscription_alerts(
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get subscriptions that are expiring soon or expired"""
    now = datetime.now(timezone.utc)
    warning_date = now + timedelta(days=7)  # 7 days warning
    
    # Expiring soon (within 7 days)
    expiring_soon = db.query(Subscription).options(
        joinedload(Subscription.subscriber)
    ).filter(
        Subscription.end_date <= warning_date,
        Subscription.end_date > now,
        Subscription.status.in_([StatusList.ACTIVE.value, StatusList.TRIAL.value])
    ).all()
    
    # Already expired but still active
    expired = db.query(Subscription).options(
        joinedload(Subscription.subscriber)
    ).filter(
        Subscription.end_date <= now,
        Subscription.status.in_([StatusList.ACTIVE.value, StatusList.TRIAL.value])
    ).all()
    
    # Recently cancelled
    cancelled = db.query(Subscription).options(
        joinedload(Subscription.subscriber)
    ).filter(
        Subscription.status == StatusList.CANCELLED.value
    ).limit(10).all()
    
    def format_subscription(sub):
        days_remaining = (sub.end_date - now).days if sub.end_date > now else 0
        return {
            "id": sub.id,
            "company_id": sub.company_id,
            "company_name": sub.subscriber.company_name if sub.subscriber else "Unknown",
            "plan_name": sub.plan_name,
            "price": float(sub.price),
            "status": sub.status,
            "start_date": sub.start_date,
            "end_date": sub.end_date,
            "days_remaining": days_remaining,
            "is_expired": sub.end_date <= now
        }
    
    return {
        "expiring_soon": [format_subscription(s) for s in expiring_soon],
        "expired": [format_subscription(s) for s in expired],
        "cancelled": [format_subscription(s) for s in cancelled],
        "total_alerts": len(expiring_soon) + len(expired)
    }

# Bulk user operations
@router.patch("/users/bulk-status")
def bulk_update_user_status(
    data: dict = Body(...),
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Activate or deactivate multiple users at once"""
    user_ids = data.get("user_ids", [])
    is_active = data.get("is_active", True)
    
    if not user_ids:
        raise HTTPException(status_code=400, detail="No user IDs provided")
    
    # Get users and filter out admins
    users = db.query(User).filter(
        User.id.in_(user_ids),
        User.role != UserRole.ADMIN.value
    ).all()
    
    if not users:
        raise HTTPException(status_code=404, detail="No valid users found")
    
    updated_count = 0
    for user in users:
        user.is_active = is_active
        updated_count += 1
    
    db.commit()
    
    return {
        "updated_count": updated_count,
        "is_active": is_active,
        "message": f"{updated_count} users {'activated' if is_active else 'deactivated'} successfully"
    }

# Search across tenants and users
@router.get("/search")
def global_search(
    query: str,
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Search for companies and users across the system"""
    if not query or len(query) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    # Search companies
    companies = db.query(Company).filter(
        or_(
            Company.company_name.ilike(f"%{query}%"),
            Company.company_number.ilike(f"%{query}%"),
            Company.company_website.ilike(f"%{query}%")
        )
    ).limit(10).all()
    
    # Search users
    users = db.query(User).filter(
        or_(
            User.first_name.ilike(f"%{query}%"),
            User.last_name.ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%")
        ),
        User.role != UserRole.ADMIN.value
    ).limit(10).all()
    
    return {
        "companies": [
            {
                "id": c.id,
                "company_name": c.company_name,
                "company_number": c.company_number,
                "company_website": c.company_website
            } for c in companies
        ],
        "users": [
            {
                "id": u.id,
                "name": f"{u.first_name} {u.last_name}",
                "email": u.email,
                "role": u.role,
                "company_id": u.related_to_company
            } for u in users
        ]
    }

# Get system activity overview
@router.get("/activity")
def get_system_activity(
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get recent system activity and statistics"""
    now = datetime.utcnow()
    last_30_days = now - timedelta(days=30)
    last_7_days = now - timedelta(days=7)
    
    # New companies in last 30 days
    new_companies_30d = db.query(Company).filter(
        Company.created_at >= last_30_days
    ).count()
    
    # New users in last 30 days
    new_users_30d = db.query(User).filter(
        User.created_at >= last_30_days,
        User.role != UserRole.ADMIN.value
    ).count()
    
    # Recent logins (last 7 days)
    recent_logins = db.query(User).filter(
        User.last_login >= last_7_days,
        User.role != UserRole.ADMIN.value
    ).count()
    
    # Active subscriptions
    active_subscriptions = db.query(Subscription).filter(
        Subscription.status.in_([StatusList.ACTIVE.value, StatusList.TRIAL.value])
    ).count()
    
    return {
        "new_companies_30d": new_companies_30d,
        "new_users_30d": new_users_30d,
        "recent_logins_7d": recent_logins,
        "active_subscriptions": active_subscriptions,
        "timestamp": now
    }

# Suspend company subscription
@router.post("/companies/{company_id}/suspend")
def suspend_company_subscription(
    company_id: int,
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if not company.is_subscription_active:
        raise HTTPException(status_code=400, detail="Company subscription is already suspended")
    
    company.is_subscription_active = False
    db.commit()
    
    return {"message": f"Company '{company.company_name}' subscription has been suspended. All users will be unable to login."}

# Reactivate company subscription
@router.post("/companies/{company_id}/reactivate")
def reactivate_company_subscription(
    company_id: int,
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company.is_subscription_active:
        raise HTTPException(status_code=400, detail="Company subscription is already active")
    
    company.is_subscription_active = True
    db.commit()
    
    return {"message": f"Company '{company.company_name}' subscription has been reactivated. Users can now login."}

# Get company subscription status
@router.get("/companies/{company_id}/subscription-status")
def get_company_subscription_status(
    company_id: int,
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {
        "company_id": company.id,
        "company_name": company.company_name,
        "is_subscription_active": company.is_subscription_active,
        "status": "Active" if company.is_subscription_active else "Suspended"
    }

# Update subscription details
@router.put("/subscriptions/{subscription_id}")
def update_subscription(
    subscription_id: int,
    subscription_data: dict = Body(...),
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Update subscription details (plan, status, dates)"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Update plan_name if provided
    plan_name = subscription_data.get("plan_name")
    if plan_name:
        if plan_name not in [PlanName.FREE.value, PlanName.BASIC.value, PlanName.STARTER.value, PlanName.PRO.value, PlanName.ENTERPRISE.value]:
            raise HTTPException(status_code=400, detail="Invalid plan name")
        subscription.plan_name = plan_name
    
    # Update status if provided
    status = subscription_data.get("status")
    if status:
        if status not in [StatusList.TRIAL.value, StatusList.ACTIVE.value, StatusList.CANCELLED.value, StatusList.EXPIRED.value]:
            raise HTTPException(status_code=400, detail="Invalid status")
        subscription.status = status
    
    # Update start_date if provided
    start_date = subscription_data.get("start_date")
    if start_date:
        try:
            subscription.start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    # Update end_date if provided
    end_date = subscription_data.get("end_date")
    if end_date:
        try:
            subscription.end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    subscription.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(subscription)
    
    return {
        "id": subscription.id,
        "company_id": subscription.company_id,
        "plan_name": subscription.plan_name,
        "status": subscription.status,
        "start_date": subscription.start_date,
        "end_date": subscription.end_date,
        "message": "Subscription updated successfully"
    }
