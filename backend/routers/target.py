from fastapi import APIRouter, Depends, HTTPException, status, Request, Body, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, cast, Date
from typing import List, Optional
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta
import calendar

from database import get_db
from schemas.target import (
    TargetCreate, TargetUpdate, TargetResponse, UserBase, TargetBulkDelete,
    LeaderboardEntry, LeaderboardResponse, PeriodComparison, 
    HistoricalComparisonResponse, TeamPerformanceSummary, PeriodType,
    AnnualTargetCreate, AnnualTargetCreateResponse, GeneratedTargetInfo
)
from .auth_utils import get_current_user
from models.auth import User
from models.target import Target, TargetStatus
from models.territory import Territory
from models.deal import Deal, DealStage
from models.company import Company
from .logs_utils import serialize_instance, create_audit_log


router = APIRouter(
    prefix="/targets",
    tags=["Targets"]
)

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER"}
ALLOWED_TARGET_EDIT_ROLES = {"CEO", "ADMIN", "GROUP MANAGER"}


def _get_manager_sales_user_ids(db: Session, manager_id: int, company_id: int) -> List[int]:
    """Return SALES user IDs assigned to territories managed by manager_id within company_id."""
    if not (db and manager_id and company_id):
        return []

    rows = (
        db.query(Territory.user_id)
        .join(User, Territory.user_id == User.id)
        .filter(
            Territory.manager_id == manager_id,
            Territory.company_id == company_id,
            Territory.user_id.isnot(None),
            User.related_to_company == company_id,
            func.upper(User.role) == "SALES",
        )
        .distinct()
        .all()
    )
    return [r[0] for r in rows if r and r[0] is not None]


# =====================================================
# Helper: Model → Response
# =====================================================
def _sum_closed_won_deals_for_period(
    db: Session,
    user_id: int,
    start_date: date,
    end_date: date,
) -> Decimal:
    """Sum of CLOSED_WON deal amounts assigned to user within [start_date, end_date] (date-inclusive).

    Deal.close_date is a datetime; we compare using the date portion so deals on the end date
    (at any time) are included.
    """
    if not (db and user_id and start_date and end_date):
        return Decimal("0")

    achieved_query = (
        db.query(func.coalesce(func.sum(Deal.amount), 0))
        .filter(
            Deal.assigned_to == user_id,
            Deal.stage == DealStage.CLOSED_WON.value,
            Deal.close_date.isnot(None),
            cast(Deal.close_date, Date) >= start_date,
            cast(Deal.close_date, Date) <= end_date,
        )
        .scalar()
    )

    return Decimal(str(achieved_query or 0))


def target_to_response(target: Target, db: Session = None) -> dict:
    """
    Convert Target model to response dict.
    Includes achieved_amount = sum of all CLOSED_WON deals assigned to the user
    within the target's date range.
    """
    achieved_amount = float(
        _sum_closed_won_deals_for_period(db, target.user_id, target.start_date, target.end_date)
    )
    
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
        "created_by": target.created_by,
        "status": target.status,
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
            .order_by(Target.created_at.desc())
            .all()
        )
    elif current_user.role.upper() == "GROUP MANAGER":
        # GROUP MANAGER sees all targets except archived ones (Inactive status)
        targets = (
            db.query(Target)
            .join(User, Target.user_id == User.id)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
            .filter((Target.status != TargetStatus.INACTIVE.value) | (Target.status.is_(None)))
            .order_by(Target.created_at.desc())
            .all()
        )
    elif current_user.role.upper() == "MANAGER":
        managed_sales_user_ids = _get_manager_sales_user_ids(
            db, current_user.id, current_user.related_to_company
        )

        # Managers can view:
        # - their own targets
        # - targets of SALES assigned to territories they manage
        targets = (
            db.query(Target)
            .join(User, Target.user_id == User.id)
            .filter(
                User.related_to_company == current_user.related_to_company,
                or_(
                    User.id == current_user.id,
                    User.id.in_(managed_sales_user_ids) if managed_sales_user_ids else False,
                ),
            )
            .order_by(Target.created_at.desc())
            .all()
        )
    else:
        targets = (
            db.query(Target)
            .filter(Target.user_id == current_user.id)
            .order_by(Target.created_at.desc())
            .all()
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
    if current_user.role.upper() not in ALLOWED_TARGET_EDIT_ROLES:
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
        created_by=current_user.id,
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
    if current_user.role.upper() not in ALLOWED_TARGET_EDIT_ROLES:
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
    # Only CEO/ADMIN/GROUP MANAGER can delete targets
    if current_user.role.upper() not in ALLOWED_TARGET_EDIT_ROLES:
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

    user_name = f"{target.user.first_name} {target.user.last_name}"
    target_user_id = target.user_id
    
    # GROUP MANAGER can only archive targets they created
    if current_user.role.upper() == "GROUP MANAGER":
        if target.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="You can only archive targets you created")
        
        # Soft delete (mark as INACTIVE)
        old_status = target.status
        target.status = TargetStatus.INACTIVE.value
        db.commit()

        create_audit_log(
            db=db,
            current_user=current_user,
            instance=target,
            action="UPDATE",
            request=request,
            old_data={"status": old_status},
            new_data={"status": target.status},
            target_user_id=target_user_id,
            custom_message=f"archived target for {user_name}"
        )
    else:
        # ADMIN/CEO perform hard delete
        old_data = serialize_instance(target)
        db.delete(target)
        db.commit()

        create_audit_log(
            db=db,
            current_user=current_user,
            instance=target,
            action="DELETE",
            request=request,
            old_data=old_data,
            target_user_id=target_user_id,
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
    # Only CEO/ADMIN/GROUP MANAGER can bulk delete targets
    if current_user.role.upper() not in ALLOWED_TARGET_EDIT_ROLES:
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

    # GROUP MANAGER can only archive targets they created
    if current_user.role.upper() == "GROUP MANAGER":
        for target in targets_to_delete:
            if target.created_by != current_user.id:
                raise HTTPException(status_code=403, detail="You can only archive targets you created")

    deleted_count = 0
    for target in targets_to_delete:
        target_name = f"target for user {target.user_id}"
        target_user_id = target.user_id
        
        if current_user.role.upper() == "GROUP MANAGER":
            # Soft delete (mark as INACTIVE)
            old_status = target.status
            target.status = TargetStatus.INACTIVE.value
            
            create_audit_log(
                db=db,
                current_user=current_user,
                instance=target,
                action="UPDATE",
                request=request,
                old_data={"status": old_status},
                new_data={"status": target.status},
                target_user_id=target_user_id,
                custom_message=f"bulk archive target for user {target.user_id} via group manager panel"
            )
        else:
            # ADMIN/CEO perform hard delete
            deleted_data = serialize_instance(target)
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

    # Managers can only see:
    # - sales reps in territories they manage
    # - themselves (if they have targets)
    if current_user.role.upper() == "MANAGER":
        managed_sales_user_ids = _get_manager_sales_user_ids(
            db, current_user.id, current_user.related_to_company
        )
        allowed_user_ids = list({*(managed_sales_user_ids or []), current_user.id})
        if not allowed_user_ids:
            return LeaderboardResponse(
                period_type=period_type or "ALL",
                period_year=period_year,
                period_number=period_number,
                start_date=None,
                end_date=None,
                total_target=Decimal(0),
                total_achieved=Decimal(0),
                overall_achievement=0,
                entries=[],
            )
        query = query.filter(User.id.in_(allowed_user_ids))

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
        user_data[user_id]["achieved_amount"] += _sum_closed_won_deals_for_period(
            db, user_id, target.start_date, target.end_date
        )

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
    period_type: Optional[str] = Query(None, description="Filter history to a specific period type (MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL, CUSTOM)"),
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

    # Managers can only view history for:
    # - themselves
    # - SALES in territories they manage
    if current_user.role.upper() == "MANAGER":
        if user_id != current_user.id:
            managed_sales_user_ids = _get_manager_sales_user_ids(
                db, current_user.id, current_user.related_to_company
            )
            if user_id not in managed_sales_user_ids:
                raise HTTPException(status_code=403, detail="Permission denied")

    allowed_period_types = {"MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL", "CUSTOM"}
    normalized_period_type = period_type.upper().strip() if period_type else None
    if normalized_period_type and normalized_period_type not in allowed_period_types:
        raise HTTPException(status_code=400, detail=f"Invalid period_type. Must be one of: {', '.join(sorted(allowed_period_types))}")

    # Get all targets for this user, ordered by date
    targets_query = db.query(Target).filter(Target.user_id == user_id)

    # If requested, filter to a single period type so comparisons are meaningful (e.g., month-over-month).
    if normalized_period_type:
        if normalized_period_type == "CUSTOM":
            targets_query = targets_query.filter(or_(Target.period_type.is_(None), Target.period_type == "CUSTOM"))
        else:
            targets_query = targets_query.filter(Target.period_type == normalized_period_type)

    targets = targets_query.order_by(Target.start_date.desc()).all()

    periods = []
    for target in targets:
        # Calculate achieved amount
        achieved_amount = _sum_closed_won_deals_for_period(db, user_id, target.start_date, target.end_date)
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
    # Pick the period that contains today's date; if none, use the most recent past period.
    current_period = None
    previous_period = None
    if periods:
        today = date.today()

        active_index = next(
            (i for i, p in enumerate(periods) if p.start_date <= today <= p.end_date),
            None,
        )

        if active_index is not None:
            current_period = periods[active_index]
            previous_period = periods[active_index + 1] if active_index + 1 < len(periods) else None
        else:
            past_index = next(
                (i for i, p in enumerate(periods) if p.end_date < today),
                None,
            )
            if past_index is not None:
                current_period = periods[past_index]
                previous_period = periods[past_index + 1] if past_index + 1 < len(periods) else None
            else:
                # All periods are in the future; fall back to earliest available.
                current_period = periods[-1]
                previous_period = periods[-2] if len(periods) > 1 else None
    
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
    if current_user.role.upper() not in ALLOWED_TARGET_EDIT_ROLES:
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
            created_by=current_user.id,
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


# =====================================================
# ANNUAL TARGET GENERATION: Create targets from annual amount
# =====================================================
def create_period_targets_from_annual(
    user_id: int,
    annual_amount: Decimal,
    period_type: str,
    generation_date: date,
    period_year: int,
    period_number: int,
    fiscal_start_month: int,
    prorate_first_period: bool,
    db: Session,
    created_by: int = None,
) -> List[dict]:
    """
    Generate target records for a user starting from generation_date.
    The annual_amount is divided according to period_type.
    The first (current) period can be prorated using remaining calendar days.
    Subsequent periods in the same calendar year are full amount.
    
    Returns a list of dicts with target info for logging.
    """
    annual_amount = Decimal(str(annual_amount))
    targets_created: List[dict] = []

    period_type = (period_type or "").upper()

    divisors = {
        "MONTHLY": 12,
        "QUARTERLY": 4,
        "SEMIANNUAL": 2,
        "ANNUAL": 1,
    }
    totals = {
        "MONTHLY": 12,
        "QUARTERLY": 4,
        "SEMIANNUAL": 2,
        "ANNUAL": 1,
    }

    if period_type not in divisors:
        return targets_created

    full_period_amount = (annual_amount / divisors[period_type]).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    start_pn = max(1, int(period_number or 1))
    end_pn = totals[period_type]

    for pn in range(start_pn, end_pn + 1):
        # Period boundaries:
        # - MONTHLY: calendar months to match current UI
        # - QUARTERLY/SEMIANNUAL/ANNUAL: fiscal periods using company quota_period
        if period_type == "MONTHLY":
            month = pn
            if month < 1 or month > 12:
                continue
            period_start = date(period_year, month, 1)
            if month == 12:
                period_end = date(period_year, 12, 31)
            else:
                period_end = date(period_year, month + 1, 1) - timedelta(days=1)
        else:
            period_start, period_end = get_period_dates(period_type, period_year, pn, fiscal_start_month)

        # Decide proration only for the first generated period
        is_first = (pn == start_pn)
        start_date = period_start
        amount = full_period_amount
        is_prorated = False

        if is_first and prorate_first_period:
            # Only prorate if generation_date falls inside this period
            if generation_date > period_start and generation_date <= period_end:
                days_in_period = (period_end - period_start).days + 1
                remaining_days = (period_end - generation_date).days + 1
                amount = (full_period_amount * Decimal(remaining_days) / Decimal(days_in_period)).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                start_date = generation_date
                is_prorated = True
            elif generation_date > period_end:
                # generation_date is past this period; skip it
                continue

        # overlap check
        existing = (
            db.query(Target)
            .filter(
                Target.user_id == user_id,
                Target.start_date <= period_end,
                Target.end_date >= start_date,
            )
            .first()
        )

        if existing:
            continue

        new_target = Target(
            user_id=user_id,
            target_amount=amount,
            start_date=start_date,
            end_date=period_end,
            period_type=period_type,
            period_year=period_year,
            period_number=pn,
            created_by=created_by,
        )
        db.add(new_target)

        targets_created.append(
            {
                "start_date": start_date,
                "end_date": period_end,
                "target_amount": amount,
                "period_number": pn,
                "is_prorated": is_prorated,
            }
        )

    return targets_created


@router.post("/admin/create-annual-targets", response_model=AnnualTargetCreateResponse, status_code=status.HTTP_201_CREATED)
def create_annual_targets(
    data: AnnualTargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Create targets for a user based on annual amount.
    
    The annual amount is the base target (e.g., 12,000,000 for the year).
    Depending on the period_type selected, it will be automatically divided:
    - MONTHLY: Annual / 12 per month
    - QUARTERLY: Annual / 4 per quarter  
    - SEMIANNUAL: Annual / 2 per half
    - ANNUAL: Full annual amount
    
    The first period can be prorated based on remaining days if prorate_first_period is True.
    
    Example: If annual target is 12M and period_type is MONTHLY:
    - Each month's target = 1M
    - If starting mid-February (15 days remaining out of 28):
      February target = 1M * (15/28) = ~535,714
    """
    if current_user.role.upper() not in ALLOWED_TARGET_EDIT_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Verify target user exists in same company
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
    
    company = db.query(Company).filter(Company.id == current_user.related_to_company).first()
    fiscal_start_month = get_fiscal_start_month(company.quota_period if company else "January")

    generation_date = data.generation_date or date.today()
    annual_amount = Decimal(str(data.annual_amount))
    period_type = data.period_type.value

    selected_year = data.period_year or generation_date.year
    selected_period_number = int(data.period_number or 1)
    
    # Calculate period amount for display
    if period_type == "MONTHLY":
        period_amount = (annual_amount / 12).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    elif period_type == "QUARTERLY":
        period_amount = (annual_amount / 4).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    elif period_type == "SEMIANNUAL":
        period_amount = (annual_amount / 2).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    else:  # ANNUAL
        period_amount = annual_amount
    
    # Create the targets
    targets_created = create_period_targets_from_annual(
        user_id=data.user_id,
        annual_amount=annual_amount,
        period_type=period_type,
        generation_date=generation_date,
        period_year=selected_year,
        period_number=selected_period_number,
        fiscal_start_month=fiscal_start_month,
        prorate_first_period=data.prorate_first_period,
        db=db,
        created_by=current_user.id,
    )
    
    if not targets_created:
        raise HTTPException(
            status_code=400, 
            detail="No targets could be created. The user may already have targets overlapping the requested periods."
        )
    
    db.commit()
    
    # Create audit log
    user_name = f"{target_user.first_name} {target_user.last_name}"
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=None,
        action="CREATE",
        request=request,
        custom_message=(
            f"created {len(targets_created)} {period_type.lower()} targets for {user_name} "
            f"from annual amount {annual_amount:,.2f} starting {generation_date}"
        )
    )
    
    return AnnualTargetCreateResponse(
        user_id=data.user_id,
        user_name=user_name,
        annual_amount=annual_amount,
        period_type=period_type,
        period_amount=period_amount,
        created_count=len(targets_created),
        targets_created=[GeneratedTargetInfo(**t) for t in targets_created],
        message=f"Successfully created {len(targets_created)} {period_type.lower()} target(s) for {user_name}"
    )


# =====================================================
# HELPER: Get period amount preview (for frontend)
# =====================================================
@router.get("/admin/preview-period-amount")
def preview_period_amount(
    annual_amount: Decimal = Query(..., description="Annual target amount"),
    period_type: str = Query(..., description="MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Preview what the period amount will be based on annual amount.
    Useful for showing the user what their monthly/quarterly/etc. target will be.
    """
    annual = Decimal(str(annual_amount))
    
    if period_type == "MONTHLY":
        period_amount = (annual / 12).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        num_periods = 12
    elif period_type == "QUARTERLY":
        period_amount = (annual / 4).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        num_periods = 4
    elif period_type == "SEMIANNUAL":
        period_amount = (annual / 2).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        num_periods = 2
    elif period_type == "ANNUAL":
        period_amount = annual
        num_periods = 1
    else:
        raise HTTPException(status_code=400, detail="Invalid period type")
    
    return {
        "annual_amount": float(annual),
        "period_type": period_type,
        "period_amount": float(period_amount),
        "num_periods": num_periods,
        "breakdown": {
            "MONTHLY": float((annual / 12).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
            "QUARTERLY": float((annual / 4).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
            "SEMIANNUAL": float((annual / 2).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
            "ANNUAL": float(annual)
        }
    }
