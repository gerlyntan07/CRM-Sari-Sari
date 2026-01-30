from fastapi import APIRouter, Depends, HTTPException, status, Request, Body, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
from decimal import Decimal
from datetime import date, timedelta

from database import get_db
from schemas.target import (
    TargetCreate, TargetUpdate, TargetResponse, UserBase, TargetBulkDelete,
    LeaderboardEntry, LeaderboardResponse, PeriodComparison, 
    HistoricalComparisonResponse, TeamPerformanceSummary, PeriodType
)
from .auth_utils import get_current_user
from models.auth import User
from models.target import Target
from models.territory import Territory
from models.deal import Deal, DealStage
from models.company import Company
from .logs_utils import serialize_instance, create_audit_log


router = APIRouter(
    prefix="/targets",
    tags=["Targets"]
)

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER"}


# =====================================================
# Helper: Model → Response
# =====================================================
def target_to_response(target: Target, db: Session = None) -> dict:
    """
    Convert Target model to response dict.
    Includes achieved_amount = sum of all CLOSED_WON deals assigned to the user
    within the target's date range.
    """
    achieved_amount = 0.0
    
    if db and target.user_id:
        # Calculate achieved amount: sum of CLOSED_WON deals for this user within the target period
        achieved_query = (
            db.query(func.sum(Deal.amount))
            .filter(
                Deal.assigned_to == target.user_id,
                Deal.stage == DealStage.CLOSED_WON.value,
                Deal.close_date >= target.start_date,
                Deal.close_date <= target.end_date
            )
            .scalar()
        )
        
        if achieved_query:
            achieved_amount = float(achieved_query)
    
    return {
        "id": target.id,
        "user_id": target.user_id,
        "target_amount": float(target.target_amount),
        "start_date": target.start_date,
        "end_date": target.end_date,
        "period_type": target.period_type,
        "period_year": target.period_year,
        "period_number": target.period_number,
        "created_at": target.created_at,
        "updated_at": target.updated_at,
        "achieved_amount": achieved_amount,
        "user": {
            "id": target.user.id,
            "first_name": target.user.first_name,
            "last_name": target.user.last_name,
            "role": target.user.role,
        } if target.user else None,
    }


# =====================================================
# Helper: Month name to number mapping
# =====================================================
MONTH_NAME_TO_NUMBER = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12
}

def get_fiscal_start_month(quota_period: str) -> int:
    """Convert quota_period string (e.g., 'January', 'April') to month number."""
    if not quota_period:
        return 1  # Default to January
    return MONTH_NAME_TO_NUMBER.get(quota_period.lower(), 1)


# =====================================================
# Helper: Calculate period dates with fiscal year support
# =====================================================
def get_period_dates(period_type: str, year: int, period_number: int = 1, fiscal_start_month: int = 1) -> tuple:
    """
    Calculate start and end dates for a given period type.
    
    Args:
        period_type: MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL, CUSTOM
        year: The fiscal year
        period_number: Which period (1-12 for monthly, 1-4 for quarterly, etc.)
        fiscal_start_month: The month the fiscal year begins (1=Jan, 4=Apr, 7=Jul, etc.)
    
    Example with fiscal_start_month=4 (April):
        - Q1 = Apr-Jun
        - Q2 = Jul-Sep
        - Q3 = Oct-Dec
        - Q4 = Jan-Mar (next calendar year)
    """
    if period_type == "MONTHLY":
        # For monthly, period_number is the fiscal month (1 = first month of fiscal year)
        actual_month = ((fiscal_start_month - 1 + period_number - 1) % 12) + 1
        actual_year = year if actual_month >= fiscal_start_month else year + 1
        
        # If fiscal year spans calendar years and we're in the second half
        if fiscal_start_month > 1 and period_number > (13 - fiscal_start_month):
            actual_year = year + 1
        else:
            actual_year = year
            
        # Recalculate based on absolute position
        months_from_fiscal_start = period_number - 1
        actual_month = fiscal_start_month + months_from_fiscal_start
        if actual_month > 12:
            actual_month -= 12
            actual_year = year + 1
        else:
            actual_year = year
            
        start = date(actual_year, actual_month, 1)
        if actual_month == 12:
            end = date(actual_year + 1, 1, 1) - timedelta(days=1)
        else:
            end = date(actual_year, actual_month + 1, 1) - timedelta(days=1)
            
    elif period_type == "QUARTERLY":
        # Q1 starts at fiscal_start_month
        quarter_offset = (period_number - 1) * 3
        start_month = fiscal_start_month + quarter_offset
        
        if start_month > 12:
            start_month -= 12
            start_year = year + 1
        else:
            start_year = year
            
        start = date(start_year, start_month, 1)
        
        end_month = start_month + 3
        end_year = start_year
        if end_month > 12:
            end_month -= 12
            end_year += 1
        end = date(end_year, end_month, 1) - timedelta(days=1)
        
    elif period_type == "SEMIANNUAL":
        if period_number == 1:
            start_month = fiscal_start_month
            start_year = year
        else:
            start_month = fiscal_start_month + 6
            start_year = year
            if start_month > 12:
                start_month -= 12
                start_year += 1
                
        start = date(start_year, start_month, 1)
        
        end_month = start_month + 6
        end_year = start_year
        if end_month > 12:
            end_month -= 12
            end_year += 1
        end = date(end_year, end_month, 1) - timedelta(days=1)
        
    elif period_type == "ANNUAL":
        start = date(year, fiscal_start_month, 1)
        if fiscal_start_month == 1:
            end = date(year, 12, 31)
        else:
            end = date(year + 1, fiscal_start_month, 1) - timedelta(days=1)
    else:  # CUSTOM
        start = date(year, 1, 1)
        end = date(year, 12, 31)
    
    return start, end


def get_period_label(period_type: str, year: int, period_number: int = 1, fiscal_start_month: int = 1) -> str:
    """Generate human-readable period label."""
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
              
    if period_type == "MONTHLY":
        # Calculate actual month based on fiscal year
        actual_month = ((fiscal_start_month - 1 + period_number - 1) % 12)
        return f"{months[actual_month]} {year}"
    elif period_type == "QUARTERLY":
        return f"Q{period_number} FY{year}"
    elif period_type == "SEMIANNUAL":
        return f"H{period_number} FY{year}"
    elif period_type == "ANNUAL":
        if fiscal_start_month == 1:
            return f"FY {year}"
        else:
            return f"FY {year}-{str(year + 1)[-2:]}"
    else:
        return f"Custom {year}"


# =====================================================
# ADMIN: Fetch All Targets
# =====================================================
@router.get("/admin/fetch-all", response_model=List[TargetResponse])
def admin_get_targets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        targets = (
            db.query(Target)
            .join(User, Target.user_id == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif current_user.role.upper() == "GROUP MANAGER":
        targets = (
            db.query(Target)
            .join(User, Target.user_id == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .all()
        )
    elif current_user.role.upper() == "MANAGER":
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .scalar_subquery()
        )

        targets = (
            db.query(Target)
            .join(User, Target.user_id == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(
                (User.id.in_(subquery_user_ids))                
            ).all()
        )
    else:
        targets = (
            db.query(Target)
            .filter(Target.user_id == current_user.id).all()
        )

    return [target_to_response(t, db) for t in targets]


# =====================================================
# Get Company Fiscal Settings
# =====================================================
@router.get("/fiscal-settings")
def get_fiscal_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the company's fiscal year settings based on quota_period.
    Returns the fiscal start month and calculated quarter/half-year mappings.
    """
    company = db.query(Company).filter(Company.id == current_user.related_to_company).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    quota_period = company.quota_period or "January"
    fiscal_start_month = get_fiscal_start_month(quota_period)
    
    months = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"]
    
    # Calculate which months fall in each quarter based on fiscal start
    quarters = {}
    for q in range(1, 5):
        q_start = (fiscal_start_month - 1 + (q - 1) * 3) % 12
        q_end = (q_start + 2) % 12
        quarters[f"Q{q}"] = f"{months[q_start][:3]} - {months[q_end][:3]}"
    
    # Calculate half-years
    halves = {
        "H1": f"{months[fiscal_start_month - 1][:3]} - {months[(fiscal_start_month + 5) % 12][:3]}",
        "H2": f"{months[(fiscal_start_month + 6 - 1) % 12][:3]} - {months[(fiscal_start_month + 11) % 12][:3]}"
    }
    
    return {
        "quota_period": quota_period,
        "fiscal_start_month": fiscal_start_month,
        "fiscal_start_month_name": months[fiscal_start_month - 1],
        "quarters": quarters,
        "halves": halves,
        "fiscal_year_label": f"{months[fiscal_start_month - 1]} - {months[(fiscal_start_month - 2) % 12]}" if fiscal_start_month != 1 else "January - December"
    }


# =====================================================
# ADMIN: Get Users for Target Assignment
# =====================================================
@router.get("/admin/get-users", response_model=List[UserBase])
def admin_get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all calls for admin users"""
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        users = (
            db.query(User)            
            .filter(
                User.related_to_company == current_user.related_to_company,
                User.is_active == True)
            .all()
        )
    elif current_user.role.upper() == "GROUP MANAGER":
        users = (
            db.query(User)
            .filter(
                User.related_to_company == current_user.related_to_company,
                User.is_active == True)
            .filter(~User.role.in_(["CEO", "Admin", "ADMIN"]))
            .all()
        )
    elif current_user.role.upper() == "MANAGER":
        # Get sales users assigned to territories managed by this manager
        subquery_user_ids = (
            db.query(Territory.user_id)
            .filter(Territory.manager_id == current_user.id)
            .distinct()
        )

        users = (
            db.query(User)            
            .filter(
                User.related_to_company == current_user.related_to_company,
                or_(
                    User.id.in_(subquery_user_ids),  # Sales in managed territories
                    User.id == current_user.id  # Themselves
                ),
                User.is_active == True
            ).all()
        )
    else:
        users = (
            db.query(User)
            .filter(
                (User.id == current_user.id),
                User.is_active == True
            ).all()
        )

    return users


# =====================================================
# ADMIN: Create Target
# =====================================================
@router.post("/admin/create", response_model=TargetResponse, status_code=status.HTTP_201_CREATED)
def admin_create_target(
    data: TargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    target_user = (
        db.query(User)
        .filter(
            User.id == data.user_id,
            User.related_to_company == current_user.related_to_company
        )
        .first()
    )

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found in your company")

    # Check for overlapping date ranges instead of blocking all targets
    overlapping_target = (
        db.query(Target)
        .filter(
            Target.user_id == data.user_id,
            # Check if date ranges overlap
            Target.start_date <= data.end_date,
            Target.end_date >= data.start_date
        )
        .first()
    )

    if overlapping_target:
        raise HTTPException(
            status_code=400,
            detail=f"User already has a target for this period ({overlapping_target.start_date} to {overlapping_target.end_date}). Targets cannot have overlapping dates."
        )

    new_target = Target(
        user_id=data.user_id,
        target_amount=data.target_amount,
        start_date=data.start_date,
        end_date=data.end_date,
        period_type=data.period_type.value if data.period_type else "CUSTOM",
        period_year=data.period_year or data.start_date.year,
        period_number=data.period_number,
    )

    db.add(new_target)
    db.commit()
    db.refresh(new_target)

    new_target = (
        db.query(Target)
        .options(joinedload(Target.user))
        .filter(Target.id == new_target.id)
        .first()
    )

    new_data = serialize_instance(new_target)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_target,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=(
            f"created target for {target_user.first_name} {target_user.last_name} "
            f"({data.start_date} → {data.end_date})"
        )
    )

    return target_to_response(new_target, db)


# =====================================================
# ADMIN: Update Target
# =====================================================
@router.put("/admin/{target_id}", response_model=TargetResponse)
def admin_update_target(
    target_id: int,
    data: TargetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    target = (
        db.query(Target)
        .options(joinedload(Target.user))
        .filter(Target.id == target_id)
        .first()
    )

    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    if target.user.related_to_company != current_user.related_to_company:
        raise HTTPException(status_code=403, detail="Not authorized")

    old_data = serialize_instance(target)

    if data.user_id is not None:
        target.user_id = data.user_id
    if data.target_amount is not None:
        target.target_amount = data.target_amount
    if data.start_date is not None:
        target.start_date = data.start_date
    if data.end_date is not None:
        target.end_date = data.end_date

    db.commit()
    db.refresh(target)

    new_data = serialize_instance(target)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=target,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        custom_message=f"updated target ID {target.id}"
    )

    return target_to_response(target, db)


# =====================================================
# ADMIN: Delete Target
# =====================================================
@router.delete("/admin/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_target(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    # SALES role is read-only, cannot delete targets
    if current_user.role.upper() not in {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER"}:
        raise HTTPException(status_code=403, detail="Permission denied")

    target = (
        db.query(Target)
        .options(joinedload(Target.user))
        .filter(Target.id == target_id)
        .first()
    )

    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    if target.user.related_to_company != current_user.related_to_company:
        raise HTTPException(status_code=403, detail="Not authorized")

    old_data = serialize_instance(target)
    user_name = f"{target.user.first_name} {target.user.last_name}"

    db.delete(target)
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=target,
        action="DELETE",
        request=request,
        old_data=old_data,
        custom_message=f"deleted target for {user_name}"
    )

    return None


@router.post("/admin/bulk-delete", status_code=status.HTTP_200_OK)
def admin_bulk_delete_targets(
    data: TargetBulkDelete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    # SALES role is read-only, cannot delete targets
    if current_user.role.upper() not in {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER"}:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not data.target_ids:
        return {"detail": "No targets provided for deletion."}

    company_users = (
        db.query(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    targets_to_delete = db.query(Target).filter(
        Target.id.in_(data.target_ids),
        (Target.user_id.in_(company_users))
    ).all()

    if not targets_to_delete:
        raise HTTPException(status_code=404, detail="No matching targets found for deletion.")

    deleted_count = 0
    for target in targets_to_delete:
        deleted_data = serialize_instance(target)
        target_name = f"target for user {target.user_id}"
        target_user_id = target.user_id

        db.delete(target)
        
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=target,
            action="DELETE",
            request=request,
            old_data=deleted_data,
            target_user_id=target_user_id,
            custom_message=f"bulk delete target for user {target.user_id} via admin panel"
        )
        deleted_count += 1

    db.commit()

    return {"detail": f"Successfully deleted {deleted_count} target(s)."}


# =====================================================
# LEADERBOARD: Compare Sales Reps by Achievement
# =====================================================
@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    period_type: Optional[str] = Query(None, description="MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL, CUSTOM"),
    period_year: Optional[int] = Query(None, description="Year for the period"),
    period_number: Optional[int] = Query(None, description="Period number (e.g., 1-4 for quarters)"),
    start_date: Optional[date] = Query(None, description="Custom start date"),
    end_date: Optional[date] = Query(None, description="Custom end date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get leaderboard ranking of sales reps by achievement percentage.
    Admins/Managers can see all reps, Sales can only see their own rank.
    """
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Build base query for targets
    query = (
        db.query(Target)
        .join(User, Target.user_id == User.id)
        .filter(User.related_to_company == current_user.related_to_company)
        .options(joinedload(Target.user))
    )

    # Apply period filters
    filter_start = start_date
    filter_end = end_date
    
    if period_type and period_year:
        if period_type != "CUSTOM":
            filter_start, filter_end = get_period_dates(period_type, period_year, period_number or 1)
            query = query.filter(
                Target.period_type == period_type,
                Target.period_year == period_year
            )
            if period_number:
                query = query.filter(Target.period_number == period_number)
    
    if filter_start and filter_end:
        query = query.filter(
            Target.start_date <= filter_end,
            Target.end_date >= filter_start
        )

    targets = query.all()

    # Group by user and calculate totals
    user_data = {}
    for target in targets:
        user_id = target.user_id
        if user_id not in user_data:
            user_data[user_id] = {
                "user_id": user_id,
                "user_name": f"{target.user.first_name} {target.user.last_name}",
                "role": target.user.role,
                "target_amount": Decimal(0),
                "achieved_amount": Decimal(0),
                "target_count": 0
            }
        
        user_data[user_id]["target_amount"] += Decimal(str(target.target_amount))
        user_data[user_id]["target_count"] += 1
        
        # Calculate achieved amount for this target
        achieved_query = (
            db.query(func.sum(Deal.amount))
            .filter(
                Deal.assigned_to == user_id,
                Deal.stage == DealStage.CLOSED_WON.value,
                Deal.close_date >= target.start_date,
                Deal.close_date <= target.end_date
            )
            .scalar()
        )
        if achieved_query:
            user_data[user_id]["achieved_amount"] += Decimal(str(achieved_query))

    # Calculate percentages and sort
    entries = []
    for data in user_data.values():
        target_amt = data["target_amount"]
        achieved_amt = data["achieved_amount"]
        percentage = float((achieved_amt / target_amt * 100)) if target_amt > 0 else 0
        remaining = max(Decimal(0), target_amt - achieved_amt)
        
        entries.append({
            **data,
            "achievement_percentage": round(percentage, 2),
            "remaining_amount": remaining
        })

    # Sort by achievement percentage (descending)
    entries.sort(key=lambda x: x["achievement_percentage"], reverse=True)

    # Assign ranks
    for i, entry in enumerate(entries, 1):
        entry["rank"] = i

    # Calculate totals
    total_target = sum(e["target_amount"] for e in entries)
    total_achieved = sum(e["achieved_amount"] for e in entries)
    overall_achievement = float((total_achieved / total_target * 100)) if total_target > 0 else 0

    return LeaderboardResponse(
        period_type=period_type or "ALL",
        period_year=period_year,
        period_number=period_number,
        start_date=filter_start,
        end_date=filter_end,
        total_target=total_target,
        total_achieved=total_achieved,
        overall_achievement=round(overall_achievement, 2),
        entries=[LeaderboardEntry(**e) for e in entries]
    )


# =====================================================
# HISTORICAL COMPARISON: Period-over-Period Analysis
# =====================================================
@router.get("/history/{user_id}", response_model=HistoricalComparisonResponse)
def get_user_history(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get historical performance data for a specific user.
    Shows all past targets with period-over-period comparison.
    """
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        # Sales can only view their own history
        if current_user.role.upper() == "SALES" and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

    # Verify user exists in same company
    target_user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.related_to_company == current_user.related_to_company
        )
        .first()
    )

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get all targets for this user, ordered by date
    targets = (
        db.query(Target)
        .filter(Target.user_id == user_id)
        .order_by(Target.start_date.desc())
        .all()
    )

    periods = []
    for target in targets:
        # Calculate achieved amount
        achieved_query = (
            db.query(func.sum(Deal.amount))
            .filter(
                Deal.assigned_to == user_id,
                Deal.stage == DealStage.CLOSED_WON.value,
                Deal.close_date >= target.start_date,
                Deal.close_date <= target.end_date
            )
            .scalar()
        )
        achieved_amount = Decimal(str(achieved_query)) if achieved_query else Decimal(0)
        target_amount = Decimal(str(target.target_amount))
        percentage = float((achieved_amount / target_amount * 100)) if target_amount > 0 else 0

        period_label = get_period_label(
            target.period_type or "CUSTOM",
            target.period_year or target.start_date.year,
            target.period_number or 1
        )

        periods.append(PeriodComparison(
            period_label=period_label,
            period_type=target.period_type or "CUSTOM",
            period_year=target.period_year or target.start_date.year,
            period_number=target.period_number,
            start_date=target.start_date,
            end_date=target.end_date,
            target_amount=target_amount,
            achieved_amount=achieved_amount,
            achievement_percentage=round(percentage, 2)
        ))

    # Current and previous period comparison
    current_period = periods[0] if periods else None
    previous_period = periods[1] if len(periods) > 1 else None
    
    growth_percentage = None
    growth_amount = None
    
    if current_period and previous_period:
        if previous_period.achieved_amount > 0:
            growth_amount = current_period.achieved_amount - previous_period.achieved_amount
            growth_percentage = float((growth_amount / previous_period.achieved_amount) * 100)
            growth_percentage = round(growth_percentage, 2)

    return HistoricalComparisonResponse(
        user_id=user_id,
        user_name=f"{target_user.first_name} {target_user.last_name}",
        current_period=current_period,
        previous_period=previous_period,
        growth_percentage=growth_percentage,
        growth_amount=growth_amount,
        periods=periods
    )


# =====================================================
# TEAM PERFORMANCE SUMMARY
# =====================================================
@router.get("/team-summary", response_model=TeamPerformanceSummary)
def get_team_summary(
    period_type: Optional[str] = Query(None),
    period_year: Optional[int] = Query(None),
    period_number: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get team performance summary for managers to evaluate their sales team.
    Shows overall metrics and identifies top performers and those needing attention.
    """
    if current_user.role.upper() not in {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER"}:
        raise HTTPException(status_code=403, detail="Permission denied - Manager role required")

    # Get leaderboard data
    leaderboard = get_leaderboard(
        period_type=period_type,
        period_year=period_year,
        period_number=period_number,
        db=db,
        current_user=current_user
    )

    entries = leaderboard.entries
    
    above_target = [e for e in entries if e.achievement_percentage >= 100]
    below_target = [e for e in entries if e.achievement_percentage < 100]
    needs_attention = [e for e in entries if e.achievement_percentage < 50]

    return TeamPerformanceSummary(
        period_type=leaderboard.period_type,
        period_year=leaderboard.period_year,
        period_number=leaderboard.period_number,
        total_sales_reps=len(entries),
        total_target=leaderboard.total_target,
        total_achieved=leaderboard.total_achieved,
        overall_achievement=leaderboard.overall_achievement,
        above_target_count=len(above_target),
        below_target_count=len(below_target),
        top_performer=entries[0] if entries else None,
        needs_attention=needs_attention[:5]  # Top 5 who need attention
    )


# =====================================================
# QUICK TARGETS: Create targets for standard periods
# =====================================================
@router.post("/admin/create-period-targets", status_code=status.HTTP_201_CREATED)
def create_period_targets(
    user_ids: List[int] = Body(..., description="List of user IDs to create targets for"),
    period_type: str = Body(..., description="MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL"),
    year: int = Body(..., description="Year for the targets"),
    period_number: int = Body(1, description="Period number"),
    target_amount: Decimal = Body(..., description="Target amount for each user"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Bulk create targets for multiple users for a specific period.
    Uses the company's quota_period setting to calculate fiscal periods.
    Useful for quarterly/annual planning.
    """
    if current_user.role.upper() not in {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER"}:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Get company's fiscal start month
    company = db.query(Company).filter(Company.id == current_user.related_to_company).first()
    fiscal_start_month = get_fiscal_start_month(company.quota_period if company else "January")
    
    start_date, end_date = get_period_dates(period_type, year, period_number, fiscal_start_month)
    
    created_targets = []
    skipped_users = []

    for user_id in user_ids:
        # Verify user is in same company
        target_user = (
            db.query(User)
            .filter(
                User.id == user_id,
                User.related_to_company == current_user.related_to_company
            )
            .first()
        )

        if not target_user:
            skipped_users.append({"user_id": user_id, "reason": "User not found"})
            continue

        # Check for overlapping targets
        existing = (
            db.query(Target)
            .filter(
                Target.user_id == user_id,
                Target.start_date <= end_date,
                Target.end_date >= start_date
            )
            .first()
        )

        if existing:
            skipped_users.append({
                "user_id": user_id, 
                "reason": f"Already has target for this period"
            })
            continue

        new_target = Target(
            user_id=user_id,
            target_amount=target_amount,
            start_date=start_date,
            end_date=end_date,
            period_type=period_type,
            period_year=year,
            period_number=period_number,
        )

        db.add(new_target)
        created_targets.append(new_target)

    db.commit()

    return {
        "created_count": len(created_targets),
        "skipped_count": len(skipped_users),
        "skipped_users": skipped_users,
        "period": get_period_label(period_type, year, period_number, fiscal_start_month),
        "date_range": f"{start_date} to {end_date}",
        "fiscal_start_month": fiscal_start_month
    }
