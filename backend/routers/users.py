from fastapi import APIRouter, Depends, HTTPException, status, Request, Body, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas.auth import UserCreate, UserUpdate, UserResponse, UserMeUpdate, UserBulkDelete
from .auth_utils import get_current_user, hash_password, get_default_avatar, DEFAULT_AVATAR_BASE
from models.auth import User
from .logs_utils import serialize_instance, create_audit_log
from .aws_ses_utils import send_welcome_email, send_password_reset_email
from models.auth import UserRole
from sqlalchemy import or_
from models.territory import Territory
import base64

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

ALLOWED_ADMIN_ROLES = {"CEO", "ADMIN", "GROUP MANAGER", "MANAGER", "SALES"}

# ✅ GET all users with Sales role only (CEO/Admin/Manager can see subordinates from same company)
@router.get("/sales/read", response_model=List[UserResponse])
def get_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # CEO/Admin/Manager/Group Manager → see all Sales users related to their company
    # Others → only themselves if they have Sales role
    allowed_roles = {"CEO", "ADMIN"}    
    current_user_role_upper = (current_user.role or "").upper()

    target_roles1 = [UserRole.SALES.value, UserRole.MANAGER.value]
    target_roles2 = [UserRole.SALES.value]
    
    if current_user_role_upper in allowed_roles:
        users = db.query(User).filter(
            User.related_to_company == current_user.related_to_company,
            User.is_active == True
        ).all()
    elif current_user_role_upper == 'GROUP MANAGER':
        users = db.query(User).filter(
            or_(
                # Condition A: Team members criteria
                (
                    (User.related_to_company == current_user.related_to_company) &
                    (User.role.in_(target_roles1)) &
                    (User.is_active == True)
                ),
                # Condition B: Themselves
                (User.id == current_user.id)
            )
        ).all()
    elif (current_user.role).upper() == 'MANAGER':
        users = db.query(User).filter(
            or_(
                # Condition A: Team members criteria
                (
                    (User.related_to_company == current_user.related_to_company) &
                    (User.role.in_(target_roles2)) &
                    (User.is_active == True)
                ),
                # Condition B: Themselves
                (User.id == current_user.id)
            )
        ).all()
    else:
        # For non-admin users, only return themselves if they have Sales role
        users = db.query(User).filter(
            User.id == current_user.id,
            User.role.in_(target_roles2),
            User.is_active == True
        ).all()

    return users

@router.get("/read/territory", response_model=List[UserResponse])
def admin_get_calls(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all calls for admin users"""
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        users = (
            db.query(User)            
            .filter(User.related_to_company == current_user.related_to_company)
            .all()
        )
    elif current_user.role.upper() == "GROUP MANAGER":
        users = (
            db.query(User)
            .filter(User.related_to_company == current_user.related_to_company)
            .filter(~User.role.in_(["CEO", "Admin"]))
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
                (User.id == current_user.id)
            ).all()
        )

    return users

@router.get("/all", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all calls for admin users"""
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        users = (
            db.query(User)
            .filter(
                User.related_to_company == current_user.related_to_company
            )
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

# ✅ CREATE new user
@router.post("/createuser", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Create user via JSON body - for backward compatibility"""
    # Only CEO or Admin can create users
    if current_user.role.upper() not in ["CEO", "ADMIN", "MANAGER", "GROUP MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Prevent duplicate emails
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Hash password
    hashed_pw = hash_password(user_data.password)        

    # ✅ Assign relationships properly
    related_to_company = user_data.company_id if user_data.company_id else current_user.related_to_company
    
    related_to_CEO = (
        current_user.id if current_user.role.upper() == "CEO"
        else current_user.related_to_CEO
    )
    
    # Use provided profile picture or default
    profile_pic_url = user_data.profile_picture or get_default_avatar(user_data.first_name)

    # ✅ Create user
    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        hashed_password=hashed_pw,
        role=user_data.role,
        phone_number=user_data.phone_number.strip() if user_data.phone_number and user_data.phone_number.strip() else None,
        related_to_CEO=related_to_CEO,
        related_to_company=related_to_company,
        profile_picture=profile_pic_url
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_data = serialize_instance(new_user)    

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_user,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"new user '{new_user.first_name} {new_user.last_name}' with role '{new_user.role}'"
    )

    send_welcome_email(new_user.email, new_user.first_name, user_data.password, new_user.role)

    return new_user


# ✅ CREATE USER WITH FILE UPLOAD (for FormData requests)
@router.post("/createuser-form", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_with_form(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    password: str = Form(...),
    phone_number: str = Form(default=""),
    company_id: str = Form(default=""),
    profile_picture: Optional[UploadFile] = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create user via FormData with optional file upload"""
    # Only CEO or Admin can create users
    if current_user.role.upper() not in ["CEO", "ADMIN", "MANAGER", "GROUP MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Prevent duplicate emails
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Validate password
    if not password or len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")

    # Hash password
    hashed_pw = hash_password(password)        

    # Assign relationships
    company_id_int = int(company_id) if company_id and company_id.strip() else None
    related_to_company = company_id_int if company_id_int else current_user.related_to_company
    related_to_CEO = (
        current_user.id if current_user.role.upper() == "CEO"
        else current_user.related_to_CEO
    )
    
    # Handle profile picture - uploaded file or default avatar
    profile_pic_url = None
    if profile_picture and profile_picture.filename:
        try:
            file_content = await profile_picture.read()
            base64_content = base64.b64encode(file_content).decode("utf-8")
            profile_pic_url = f"data:{profile_picture.content_type};base64,{base64_content}"
        except Exception:
            profile_pic_url = get_default_avatar(first_name)
    else:
        profile_pic_url = get_default_avatar(first_name)

    # Create user
    new_user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        hashed_password=hashed_pw,
        role=role,
        phone_number=phone_number.strip() if phone_number and phone_number.strip() else None,
        related_to_CEO=related_to_CEO,
        related_to_company=related_to_company,
        profile_picture=profile_pic_url
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_data = serialize_instance(new_user)    

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_user,
        action="CREATE",
        request=None,
        new_data=new_data,
        custom_message=f"new user '{new_user.first_name} {new_user.last_name}' with role '{new_user.role}'"
    )

    send_welcome_email(new_user.email, new_user.first_name, password, new_user.role)

    return new_user


# ✅ GET single user
@router.get("/getuser/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    from sqlalchemy.orm import joinedload
    user = (
        db.query(User)
        .options(
            joinedload(User.company),
            joinedload(User.manager)
        )
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Restrict visibility to same company
    if user.related_to_company != current_user.related_to_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this user."
        )

    return user


# ✅ UPDATE user info
@router.put("/updateuser/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """Update user via JSON body - for backward compatibility"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role.upper() not in ["CEO", "ADMIN", "GROUP MANAGER", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Allow CEO/ADMIN to update any user (super admin), otherwise check company membership
    if current_user.role.upper() not in ["CEO", "ADMIN"]:
        if user.related_to_company != current_user.related_to_company:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update this user.",
            )

    if user_data.email and user_data.email != user.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user and existing_user.id != user.id:
            raise HTTPException(status_code=400, detail="Email already exists")

    old_data = serialize_instance(user)

    if user_data.first_name is not None:
        user.first_name = user_data.first_name
    if user_data.last_name is not None:
        user.last_name = user_data.last_name
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.password:
        user.hashed_password = hash_password(user_data.password)
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.phone_number is not None:
        user.phone_number = user_data.phone_number.strip() if user_data.phone_number and user_data.phone_number.strip() else None
    if user_data.profile_picture is not None:
        user.profile_picture = user_data.profile_picture

    if not user.profile_picture:
        user.profile_picture = get_default_avatar(user.first_name)

    db.commit()
    db.refresh(user)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=user,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=serialize_instance(user),
        custom_message=f"updated user '{user.first_name} {user.last_name}' with role '{user.role}'",
    )

    return user


# ✅ UPDATE USER WITH FILE UPLOAD (for FormData requests)
@router.put("/updateuser-form/{user_id}", response_model=UserResponse)
async def update_user_with_form(
    user_id: int,
    first_name: str = Form(default=""),
    last_name: str = Form(default=""),
    email: str = Form(default=""),
    role: str = Form(default=""),
    password: str = Form(default=""),
    phone_number: Optional[str] = Form(default=None),
    profile_picture: Optional[UploadFile] = File(default=None),
    delete_profile_picture: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user via FormData with optional file upload"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role.upper() not in ["CEO", "ADMIN", "GROUP MANAGER", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Allow CEO/ADMIN to update any user (super admin), otherwise check company membership
    if current_user.role.upper() not in ["CEO", "ADMIN"]:
        if user.related_to_company != current_user.related_to_company:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update this user.",
            )

    # Check email uniqueness if changing
    if email and email != user.email:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user and existing_user.id != user.id:
            raise HTTPException(status_code=400, detail="Email already exists")

    old_data = serialize_instance(user)

    # Update fields if provided (non-empty)
    if first_name and first_name.strip():
        user.first_name = first_name.strip()
    if last_name and last_name.strip():
        user.last_name = last_name.strip()
    if email and email.strip():
        user.email = email.strip()
    if role and role.strip():
        user.role = role.strip()
    if password and password.strip():
        if len(password.strip()) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        user.hashed_password = hash_password(password.strip())
    
    # Handle phone number - can be cleared (optional field)
    if phone_number is not None:
        user.phone_number = phone_number.strip() if phone_number else None

    # Handle profile picture deletion
    if delete_profile_picture == "true":
        user.profile_picture = get_default_avatar(user.first_name)
    # Handle profile picture upload
    elif profile_picture and profile_picture.filename:
        try:
            file_content = await profile_picture.read()
            base64_content = base64.b64encode(file_content).decode("utf-8")
            user.profile_picture = f"data:{profile_picture.content_type};base64,{base64_content}"
        except Exception:
            if not user.profile_picture:
                user.profile_picture = get_default_avatar(user.first_name)
    elif not user.profile_picture:
        user.profile_picture = get_default_avatar(user.first_name)

    db.commit()
    db.refresh(user)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=user,
        action="UPDATE",
        request=None,
        old_data=old_data,
        new_data=serialize_instance(user),
        custom_message=f"updated user '{user.first_name} {user.last_name}' with role '{user.role}'",
    )

    return user


# ✅ DELETE user
@router.delete("/deleteuser/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Only CEO/Admin can delete users in same company
    if current_user.role.upper() not in ["CEO", "ADMIN", "GROUP MANAGER", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    if user.related_to_company != current_user.related_to_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this user."
        )

    if user.is_active is False:
        raise HTTPException(status_code=400, detail="User is already inactive.")

    old_data = serialize_instance(user)

    user.is_active = False
    db.commit()
    db.refresh(user)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=user,
        action="DELETE",
        request=request,
        old_data=old_data,
        new_data=serialize_instance(user),
        custom_message=f"soft deleted user '{user.first_name} {user.last_name}' with role '{user.role}'"
    )

    return {"detail": f"✅ User '{user.first_name} {user.last_name}' deactivated successfully."}


# ✅ HARD DELETE user (permanent deletion from database)
@router.delete("/harddeleteuser/{user_id}", status_code=status.HTTP_200_OK)
def hard_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Only CEO/ADMIN can hard delete users
    if current_user.role.upper() not in ["CEO", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Allow CEO/ADMIN to delete any user (super admin across all companies)
    # No company restriction for CEO/ADMIN
    
    old_data = serialize_instance(user)

    try:
        db.delete(user)
        db.commit()

        create_audit_log(
            db=db,
            current_user=current_user,
            instance=user,
            action="DELETE",
            request=request,
            old_data=old_data,
            new_data=None,
            custom_message=f"hard deleted user '{old_data.get('first_name')} {old_data.get('last_name')}' (ID: {user_id})"
        )

        return {"detail": f"✅ User permanently deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete user: {str(e)}"
        )


# ✅ UPDATE current user's own profile
@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_data: UserMeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Allow users to update their own profile information and change password.
    Users can update: first_name, last_name, phone_number, profile_picture, and password.
    """
    # Query the user from the current session to ensure it's attached to this session
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    old_data = serialize_instance(user)
    old_profile_picture = user.profile_picture
    old_first_name = (user.first_name or "").strip()

    def _is_default_avatar_url(url: str | None) -> bool:
        if not url:
            return False
        if not url.startswith(f"{DEFAULT_AVATAR_BASE}/"):
            return False
        filename = url.rsplit("/", 1)[-1].lower()
        if filename == "default.png":
            return True
        return len(filename) == 5 and filename[1:] == ".png" and filename[0].isalpha()
    
    # Update first_name if provided
    if user_data.first_name is not None:
        user.first_name = user_data.first_name.strip()
    
    # Update last_name if provided
    if user_data.last_name is not None:
        user.last_name = user_data.last_name.strip()
    
    # Update phone_number if provided
    if user_data.phone_number is not None:
        user.phone_number = user_data.phone_number.strip() if user_data.phone_number.strip() else None
    
    # Update profile_picture if provided
    if user_data.profile_picture is not None:
        user.profile_picture = user_data.profile_picture
    
    # Update password if provided
    if user_data.password:
        user.hashed_password = hash_password(user_data.password)
    
    # Ensure profile picture exists (set default if not)
    if not user.profile_picture:
        user.profile_picture = get_default_avatar(user.first_name)
    else:
        new_first_name = (user.first_name or "").strip()
        first_name_changed = (
            user_data.first_name is not None and new_first_name != old_first_name
        )
        if (
            first_name_changed
            and user_data.profile_picture is None
            and _is_default_avatar_url(old_profile_picture)
        ):
            user.profile_picture = get_default_avatar(user.first_name)
    
    db.commit()
    db.refresh(user)
    
    # Create audit log for the update
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=user,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=serialize_instance(user),
        custom_message=f"updated own profile information",
    )
    
    return user


@router.delete("/admin/bulk-delete", status_code=status.HTTP_200_OK)
def admin_bulk_delete_users(
    data: UserBulkDelete = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not data.user_ids:
        return {"detail": "No users provided for deletion."}

    company_users = (
        db.query(User.id)
        .where(User.related_to_company == current_user.related_to_company)
        .subquery()
    )

    users_to_deactivate = db.query(User).filter(
        User.id.in_(data.user_ids),
        User.related_to_company == current_user.related_to_company
    ).all()

    if not users_to_deactivate:
        raise HTTPException(status_code=404, detail="No matching users found for deactivation.")

    deactivated_count = 0
    for user in users_to_deactivate:
        old_data = serialize_instance(user)
        user_name = f"{user.first_name} {user.last_name}"
        target_user_id = user.id

        # Set user as inactive instead of deleting
        user.is_active = False
        
        create_audit_log(
            db=db,
            current_user=current_user,
            instance=user,
            action="UPDATE",
            request=request,
            old_data=old_data,
            target_user_id=target_user_id,
            custom_message=f"bulk deactivate user '{user_name}' via admin panel"
        )
        deactivated_count += 1

    db.commit()

    return {"detail": f"Successfully deactivated {deactivated_count} user(s)."}


# ✅ HARD DELETE all users for a tenant (super-admin only)
@router.delete("/admin/tenants/{tenant_id}/users/delete-all", status_code=status.HTTP_200_OK)
def delete_all_users_for_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hard delete all users for a specific tenant. Super-admin only."""
    if current_user.role.upper() not in ["CEO", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Find all users related to this tenant
    users_to_delete = db.query(User).filter(
        User.related_to_company == tenant_id
    ).all()

    if not users_to_delete:
        return {"detail": "No users found for this tenant"}

    deleted_count = 0
    
    try:
        for user in users_to_delete:
            # Hard delete the user (remove completely from database)
            db.delete(user)
            deleted_count += 1
        
        db.commit()
        return {"detail": f"Successfully deleted {deleted_count} user(s) permanently"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete users: {str(e)}")


# ✅ RESET password for a specific user (super-admin only)
@router.put("/resetpassword/{user_id}", status_code=status.HTTP_200_OK)
def reset_user_password(
    user_id: int,
    password: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """Reset password for a user. Super-admin can reset any user's password."""
    
    # Only super-admin (CEO/ADMIN) can reset passwords
    if current_user.role.upper() not in ["CEO", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super-admin can reset user passwords"
        )
    
    # Validate password length
    if not password or len(password.strip()) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    
    # Find the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Super-admin can reset password for any user - no company restriction
    
    old_data = serialize_instance(user)
    
    # Store plain password for email (before hashing)
    plain_password = password.strip()
    
    # Update password
    user.hashed_password = hash_password(plain_password)
    db.commit()
    db.refresh(user)
    
    # Create audit log
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=user,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=serialize_instance(user),
        custom_message=f"reset password for user '{user.first_name} {user.last_name}'"
    )
    
    # Send password reset email with the new password
    try:
        send_password_reset_email(
            to_email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            new_password=plain_password
        )
    except Exception as e:
        # Log email error but don't fail the password reset
        print(f"⚠️ Warning: Failed to send password reset email to {user.email}: {str(e)}")
    
    return {"detail": "Password reset successfully and email sent"}
