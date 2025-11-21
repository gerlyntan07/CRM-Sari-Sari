from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
from schemas.target import TargetCreate, TargetUpdate, TargetResponse, UserBase
from .auth_utils import get_current_user
from models.auth import User
from models.target import Target
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/targets",
    tags=["Targets"]
)

ALLOWED_ADMIN_ROLES = {'CEO', 'ADMIN', 'GROUP MANAGER'}


def target_to_response(target: Target) -> dict:
    """Convert Target model to response format"""
    return {
        "id": target.id,
        "user_id": target.user_id,
        "period": target.period,
        "target_amount": float(target.target_amount) if target.target_amount else 0.0,
        "achieved": float(target.achieved) if target.achieved else 0.0,
        "status": target.status,
        "created_at": target.created_at,
        "updated_at": target.updated_at,
        "user": {
            "id": target.user.id if target.user else None,
            "first_name": target.user.first_name if target.user else None,
            "last_name": target.user.last_name if target.user else None,
            "role": target.user.role if target.user else None,
        } if target.user else None,
    }


@router.get("/admin/fetch-all", response_model=List[TargetResponse])
def admin_get_targets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all targets for admin users"""
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Get all targets for users in the same company
    company_users = db.query(User.id).filter(
        User.related_to_company == current_user.related_to_company
    ).subquery()
    
    targets = (
        db.query(Target)
        .options(joinedload(Target.user))
        .filter(Target.user_id.in_(company_users))
        .order_by(Target.created_at.desc())
        .all()
    )
    
    return [target_to_response(target) for target in targets]


@router.get("/admin/get-users", response_model=List[UserBase])
def admin_get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all users in the same company for target assignment"""
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    users = (
        db.query(User)
        .filter(User.related_to_company == current_user.related_to_company)
        .all()
    )
    
    return [
        {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        }
        for user in users
    ]


@router.post("/admin/create", response_model=TargetResponse, status_code=status.HTTP_201_CREATED)
def admin_create_target(
    data: TargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Create a new target"""
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Verify user exists and is in the same company
    target_user = (
        db.query(User)
        .filter(
            User.id == data.user_id,
            User.related_to_company == current_user.related_to_company
        )
        .first()
    )
    
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User not found in your company."
        )
    
    # Check if target already exists for this user and period
    existing_target = (
        db.query(Target)
        .filter(
            Target.user_id == data.user_id,
            Target.period == data.period
        )
        .first()
    )
    
    if existing_target:
        raise HTTPException(
            status_code=400,
            detail=f"Target already exists for user {target_user.first_name} {target_user.last_name} for period {data.period}"
        )
    
    new_target = Target(
        user_id=data.user_id,
        period=data.period,
        target_amount=data.target_amount,
        achieved=data.achieved or 0,
        status=data.status or "ACTIVE",
        created_by=current_user.id,
    )
    
    db.add(new_target)
    db.commit()
    db.refresh(new_target)
    
    # Load user relationship
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
        custom_message=f"create target for '{target_user.first_name} {target_user.last_name}' for period {data.period}"
    )
    
    return target_to_response(new_target)


@router.put("/admin/{target_id}", response_model=TargetResponse)
def admin_update_target(
    target_id: int,
    data: TargetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Update a target"""
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    target = (
        db.query(Target)
        .options(joinedload(Target.user))
        .filter(Target.id == target_id)
        .first()
    )
    
    if not target:
        raise HTTPException(
            status_code=404,
            detail="Target not found"
        )
    
    # Verify target belongs to a user in the same company
    if target.user and target.user.related_to_company != current_user.related_to_company:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this target"
        )
    
    old_data = serialize_instance(target)
    
    # Update fields if provided
    if data.user_id is not None:
        # Verify new user exists and is in the same company
        new_user = (
            db.query(User)
            .filter(
                User.id == data.user_id,
                User.related_to_company == current_user.related_to_company
            )
            .first()
        )
        if not new_user:
            raise HTTPException(
                status_code=404,
                detail="User not found in your company."
            )
        target.user_id = data.user_id
    
    if data.period is not None:
        # Check if target already exists for this user and period (if user changed)
        check_user_id = data.user_id if data.user_id is not None else target.user_id
        existing_target = (
            db.query(Target)
            .filter(
                Target.user_id == check_user_id,
                Target.period == data.period,
                Target.id != target_id
            )
            .first()
        )
        if existing_target:
            raise HTTPException(
                status_code=400,
                detail=f"Target already exists for this user for period {data.period}"
            )
        target.period = data.period
    
    if data.target_amount is not None:
        target.target_amount = data.target_amount
    
    if data.achieved is not None:
        target.achieved = data.achieved
    
    if data.status is not None:
        target.status = data.status
    
    db.commit()
    db.refresh(target)
    
    # Reload with user relationship
    target = (
        db.query(Target)
        .options(joinedload(Target.user))
        .filter(Target.id == target_id)
        .first()
    )
    
    new_data = serialize_instance(target)
    
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=target,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        custom_message=f"update target for period {target.period}"
    )
    
    return target_to_response(target)


@router.delete("/admin/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_target(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Delete a target"""
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    target = (
        db.query(Target)
        .options(joinedload(Target.user))
        .filter(Target.id == target_id)
        .first()
    )
    
    if not target:
        raise HTTPException(
            status_code=404,
            detail="Target not found"
        )
    
    # Verify target belongs to a user in the same company
    if target.user and target.user.related_to_company != current_user.related_to_company:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this target"
        )
    
    old_data = serialize_instance(target)
    period = target.period
    user_name = f"{target.user.first_name} {target.user.last_name}" if target.user else "Unknown"
    
    db.delete(target)
    db.commit()
    
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=target,
        action="DELETE",
        request=request,
        old_data=old_data,
        custom_message=f"delete target for '{user_name}' for period {period}"
    )
    
    return None

