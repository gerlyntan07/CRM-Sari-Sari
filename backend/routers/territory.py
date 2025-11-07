from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.territory import TerritoryCreate, TerritoryResponse
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from models.territory import Territory
from .logs_utils import serialize_instance, create_audit_log
from routers.ws_notification import broadcast_notification
import asyncio 

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
async def assign_territory(
    data: TerritoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    # Only CEO or Admin can assign territories
    if current_user.role.upper() not in ["CEO", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")    

    # Find the assigned user
    assigned_user = db.query(User).filter(User.id == data.user_id).first()
    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")

    # Assign territory
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

    # Create audit log
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_territory,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"assign territory '{data.name}' to user: {assigned_user.first_name} {assigned_user.last_name}"
    )

    # Prepare notification
    notification_data = {
        "id": new_territory.id,
        "type": "territory_assignment",
        "territoryName": new_territory.name,
        "assignedBy": f"{current_user.first_name} {current_user.last_name}",
        "createdAt": str(new_territory.created_at)
    }

    # Broadcast notification asynchronously
    asyncio.create_task(
        broadcast_notification(notification_data, target_user_id=assigned_user.id)
    )

    return new_territory



@router.get("/myterritory", response_model=List[TerritoryResponse])
def get_my_territories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.related_to_company:
        return []

    # Fetch only territories assigned to this user
    territories = db.query(Territory).filter(
        Territory.user_id == current_user.id
    ).all()
    return territories


@router.delete("/{id}")
def delete_territory(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    territory = db.query(Territory).filter(Territory.id == id).first()
    if not territory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Territory not found")
    if territory.company_id != current_user.related_to_company and current_user.role not in ['CEO', 'Admin', 'Manager', 'Group Manager']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to delete this territory")
    
    db.delete(territory)
    db.commit()

    deleted_data = serialize_instance(territory)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=deleted_data,
        action="DELETE",
        request=request,
        new_data=deleted_data,
        custom_message=f"delete territory '{id}' permanently"
    )

    return deleted_data