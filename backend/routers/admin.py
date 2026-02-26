# backend/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from database import SessionLocal
from models.auth import User, UserRole
from models.company import Company
from models.subscription import Subscription, StatusList
from jose import jwt, JWTError
from typing import List
from datetime import datetime, timedelta
import os

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
    
    tenants_data = []
    for company in companies:
        # Count active users
        active_users = len([u for u in company.users if u.is_active])
        total_users = len(company.users)
        
        # Get subscription info
        subscription = company.plan[0] if company.plan else None
        
        tenant_info = {
            "id": company.id,
            "company_name": company.company_name,
            "company_number": company.company_number,
            "company_website": company.company_website,
            "company_logo": company.company_logo,
            "address": company.address,
            "currency": company.currency,
            "quota_period": company.quota_period,
            "tax_rate": float(company.tax_rate) if company.tax_rate else 0,
            "is_subscription_active": company.is_subscription_active,
            "created_at": company.created_at,
            "updated_at": company.updated_at,
            "total_users": total_users,
            "active_users": active_users,
            "subscription": {
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
                } for u in company.users
            ]
        }
        tenants_data.append(tenant_info)
    
    return {
        "total_tenants": len(tenants_data),
        "tenants": tenants_data
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
    
    subscription = company.plan[0] if company.plan else None
    
    return {
        "id": company.id,
        "company_name": company.company_name,
        "company_number": company.company_number,
        "company_website": company.company_website,
        "company_logo": company.company_logo,
        "address": company.address,
        "currency": company.currency,
        "quota_period": company.quota_period,
        "tax_rate": float(company.tax_rate) if company.tax_rate else 0,
        "created_at": company.created_at,
        "updated_at": company.updated_at,
        "subscription": {
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
                "is_active": u.is_active,
                "auth_provider": u.auth_provider,
                "created_at": u.created_at,
                "last_login": u.last_login,
            } for u in company.users
        ]
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
    if new_status not in [StatusList.ACTIVE.value, StatusList.CANCELLED.value, StatusList.EXPIRED.value]:
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
    now = datetime.utcnow()
    warning_date = now + timedelta(days=7)  # 7 days warning
    
    # Expiring soon (within 7 days)
    expiring_soon = db.query(Subscription).options(
        joinedload(Subscription.subscriber)
    ).filter(
        Subscription.end_date <= warning_date,
        Subscription.end_date > now,
        Subscription.status == StatusList.ACTIVE.value
    ).all()
    
    # Already expired but still active
    expired = db.query(Subscription).options(
        joinedload(Subscription.subscriber)
    ).filter(
        Subscription.end_date <= now,
        Subscription.status == StatusList.ACTIVE.value
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
        Subscription.status == StatusList.ACTIVE.value
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
