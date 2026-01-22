from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from decimal import Decimal

from database import get_db
from schemas.target import TargetCreate, TargetUpdate, TargetResponse, UserBase, TargetBulkDelete
from .auth_utils import get_current_user
from models.auth import User
from models.target import Target
from models.territory import Territory
from models.deal import Deal, DealStage
from .logs_utils import serialize_instance, create_audit_log


router = APIRouter(
    prefix="/targets",
    tags=["Targets"]
)

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER", "SALES"}


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
                Deal.stage == DealStage.CLOSED_WON.value                
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
# ADMIN: Get Users for Target Assignment
# =====================================================
@router.get("/admin/get-users", response_model=List[UserBase])
def admin_get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    users = (
        db.query(User)
        .filter(User.related_to_company == current_user.related_to_company)
        .all()
    )

    return [
        {
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
        }
        for u in users
    ]


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

    # Prevent multiple targets - user can only have one target at a time
    existing_target = (
        db.query(Target)
        .filter(Target.user_id == data.user_id)
        .first()
    )

    if existing_target:
        raise HTTPException(
            status_code=400,
            detail="User already has an active target. Each user can only have one target at a time."
        )

    new_target = Target(
        user_id=data.user_id,
        target_amount=data.target_amount,
        start_date=data.start_date,
        end_date=data.end_date,
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
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
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
