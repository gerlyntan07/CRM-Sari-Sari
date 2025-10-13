from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.auth import User
from schemas.auth import UserCreate, UserResponse
from .auth_utils import get_current_user, hash_password, get_default_avatar

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# ✅ GET all users (CEO can see subordinates)
@router.get("/all", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.upper() == "CEO":
        users = db.query(User).filter(
            (User.id == current_user.id) | (User.related_to_CEO == current_user.id)
        ).all()
    else:
        users = db.query(User).filter(User.id == current_user.id).all()

    return users


# ✅ CREATE new user
@router.post("/createuser", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only CEO or Admin can create users
    if current_user.role not in ["CEO", "Admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Prevent duplicates
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Hash password
    hashed_pw = hash_password(user_data.password)

    # Assign CEO relationship
    related_to_CEO = current_user.id if current_user.role == "CEO" else current_user.related_to_CEO

    # Create new user
    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        hashed_password=hashed_pw,
        role=user_data.role,
        related_to_CEO=related_to_CEO
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ✅ GET single user by ID
@router.get("/getuser/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # CEO restriction
    if current_user.role.upper() == "CEO":
        if user.id != current_user.id and user.related_to_CEO != current_user.id:
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

    # Restrict CEO to their scope
    if current_user.role.upper() == "CEO":
        if user.id != current_user.id and user.related_to_CEO != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update this user."
            )

    # Update fields
    user.first_name = user_data.first_name
    user.last_name = user_data.last_name
    user.email = user_data.email
    user.role = user_data.role.upper()
    user.hashed_password = hash_password(user_data.password)

    db.commit()
    db.refresh(user)

    return user


# ✅ DELETE user
@router.delete("/deleteuser/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role.upper() == "CEO":
        if user.related_to_CEO != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to delete this user."
            )

    db.delete(user)
    db.commit()

    return {"detail": f"✅ User '{user.first_name} {user.last_name}' deleted successfully."}
