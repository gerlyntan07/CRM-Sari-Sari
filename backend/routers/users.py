from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from schemas.auth import UserCreate, UserResponse
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# ✅ GET all users (CEO/Admin can see subordinates from same company)
@router.get("/sales/read", response_model=List[UserResponse])
def get_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # CEO → see all users related to their company
    # Admin → see all users under same company
    # Others → only themselves
    if current_user.role.upper() in ["CEO", "Admin", "Manager", "Group Manager"]:
        users = db.query(User).filter(
            User.related_to_company == current_user.related_to_company
        ).filter(User.role == "Sales").all()
    else:
        users = db.query(User).filter(User.id == current_user.id).all()

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
        custom_message=f" - new user '{new_user.first_name} {new_user.last_name}' with role '{new_user.role}'"
    )

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
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Only users from the same company can be updated
    if user.related_to_company != current_user.related_to_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this user."
        )

    # ✅ Update user fields
    user.first_name = user_data.first_name
    user.last_name = user_data.last_name
    user.email = user_data.email
    user.role = user_data.role.upper()
    user.hashed_password = hash_password(user_data.password)

    # ✅ Ensure default picture
    if not user.profile_picture:
        user.profile_picture = DEFAULT_PROFILE_PIC

    db.commit()
    db.refresh(user)
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
    
    deleted_user_data = serialize_instance(user)

    # ✅ Create log BEFORE deletion
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=user,
        action="DELETE",
        request=request,
        new_data=deleted_user_data,
        custom_message=f" - deleted user '{user.first_name} {user.last_name}' with role '{user.role}'"
    )

    db.delete(user)
    db.commit()    

    return {"detail": f"✅ User '{user.first_name} {user.last_name}' deleted successfully."}
