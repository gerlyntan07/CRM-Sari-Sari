from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.auth import UserCreate, UserUpdate, UserResponse, UserMeUpdate
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from .logs_utils import serialize_instance, create_audit_log
from .aws_ses_utils import send_welcome_email

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# ✅ GET all users with Sales role only (CEO/Admin/Manager can see subordinates from same company)
@router.get("/sales/read", response_model=List[UserResponse])
def get_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # CEO/Admin/Manager/Group Manager → see all Sales users related to their company
    # Others → only themselves if they have Sales role
    allowed_roles = {"CEO", "ADMIN", "MANAGER", "GROUP MANAGER"}
    current_user_role_upper = (current_user.role or "").upper()
    
    if current_user_role_upper in allowed_roles:
        # Get only Sales users from same company
        users = db.query(User).filter(
            User.related_to_company == current_user.related_to_company
        ).filter(User.role == "Sales").filter(User.is_active == True).all()
    else:
        # For non-admin users, only return themselves if they have Sales role
        users = db.query(User).filter(
            User.id == current_user.id,
            User.role == "Sales",
            User.is_active == True
        ).all()

    return users

@router.get("/all", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # CEO → see all users related to their company
    # Admin → see all users under same company
    # Others → only themselves
    if current_user.role.upper() in ["CEO", "ADMIN"]:
        users = db.query(User).filter(
            User.related_to_company == current_user.related_to_company
        ).all()
    else:
        users = db.query(User).filter(User.id == current_user.id).all()

    return users

# ✅ CREATE new user
@router.post("/createuser", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    # Only CEO or Admin can create users
    if current_user.role.upper() not in ["CEO", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Prevent duplicate emails
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Hash password
    hashed_pw = hash_password(user_data.password)

    # ✅ Assign relationships properly
    related_to_CEO = (
        current_user.id if current_user.role.upper() == "CEO"
        else current_user.related_to_CEO
    )
    related_to_company = current_user.related_to_company
    profile_pic_url = get_default_avatar(user_data.first_name)


    # ✅ Create user
    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        hashed_password=hashed_pw,
        role=user_data.role,
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


# ✅ GET single user
@router.get("/getuser/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

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
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role.upper() not in ["CEO", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")

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
    if current_user.role.upper() not in ["CEO", "ADMIN"]:
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
