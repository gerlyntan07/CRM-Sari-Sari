from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.territory import TerritoryCreate, TerritoryResponse
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from models.territory import Territory
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/territories",
    tags=["territories"]
)

@router.get("/fetch", response_model=List[TerritoryResponse])
def get_territories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.related_to_company:
        return []

    territories = db.query(Territory).filter(
        Territory.company_id == current_user.related_to_company
    ).all()
    return territories



# ✅ CREATE new territory
@router.post("/assign", response_model=TerritoryResponse, status_code=status.HTTP_201_CREATED)
def assign_territory(
    data: TerritoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    # Only CEO or Admin can create users
    if current_user.role.upper() not in ["CEO", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")    
    
    assigned_user = db.query(User).filter(User.id == data.user_id).first()
    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")

    # ✅ Ssign territory
    new_territory = Territory(
        name=data.name,
        description=data.description,
        user_id=data.user_id,
        company_id=data.company_id,
    )
    db.add(new_territory)
    db.commit()
    db.refresh(new_territory)

    new_data = serialize_instance(new_territory)    

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_territory,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"assign territory '{data.name}' to user: {assigned_user.first_name} {assigned_user.last_name}"
    )

    return new_territory


# ✅ UPDATE user info
# @router.put("/updateuser/{user_id}", response_model=UserResponse)
# def update_user(
#     user_id: int,
#     user_data: UserCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     user = db.query(User).filter(User.id == user_id).first()

#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     # Only users from the same company can be updated
#     if user.related_to_company != current_user.related_to_company:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You are not authorized to update this user."
#         )

#     # ✅ Update user fields
#     user.first_name = user_data.first_name
#     user.last_name = user_data.last_name
#     user.email = user_data.email
#     user.role = user_data.role.upper()
#     user.hashed_password = hash_password(user_data.password)

#     # ✅ Ensure default picture
#     if not user.profile_picture:
#         user.profile_picture = DEFAULT_PROFILE_PIC

#     db.commit()
#     db.refresh(user)
#     return user
