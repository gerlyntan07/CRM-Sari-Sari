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



# # ✅ CREATE new territory
@router.post("/assign", status_code=status.HTTP_201_CREATED)
async def assign_territory(
    data: TerritoryCreate, # Ensure your Pydantic model accepts user_ids: List[int]
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ["CEO", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")   

    # 1. Validate Manager
    managed_by_user = None
    if data.manager_id:
        managed_by_user = db.query(User).filter(User.id == data.manager_id).first()
        if not managed_by_user:
            raise HTTPException(status_code=404, detail="Assigned manager not found") 

    created_territories = []

    # 2. LOOP through the list of User IDs and create a row for each
    if data.user_ids:
        for uid in data.user_ids:
            # Check if this specific combo already exists to avoid crashing on UniqueConstraint
            existing = db.query(Territory).filter(
                Territory.company_id == data.company_id,
                Territory.name == data.name,
                Territory.user_id == uid
            ).first()

            if existing:
                continue # Skip if this specific user is already assigned to this territory name

            new_territory = Territory(
                name=data.name,
                description=data.description,
                manager_id=data.manager_id,
                user_id=uid, # Set the specific user for this row
                company_id=data.company_id,
            )
            db.add(new_territory)
            created_territories.append(new_territory)
    
    # Handle case where no users are assigned (Create 1 row with user_id=None)
    else:
         new_territory = Territory(
            name=data.name,
            description=data.description,
            manager_id=data.manager_id,
            user_id=None,
            company_id=data.company_id,
        )
         db.add(new_territory)
         created_territories.append(new_territory)

    db.commit()
    
    # 3. Notification Logic (Notify each user about their specific new row)
    for terr in created_territories:
        db.refresh(terr)
        if terr.user_id:
            notification_data = {
                "id": terr.id,
                "type": "territory_assignment",
                "territoryName": terr.name,
                "assignedBy": f"{current_user.first_name} {current_user.last_name}",
                "createdAt": str(terr.created_at)
            }
            asyncio.create_task(broadcast_notification(notification_data, target_user_id=terr.user_id))

    return {"message": "Territories assigned", "count": len(created_territories)}



# @router.get("/myterritory", response_model=List[TerritoryResponse])
# def get_my_territories(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     if not current_user.related_to_company:
#         return []

#     # Fetch only territories assigned to this user
#     territories = db.query(Territory).filter(
#         Territory.user_id == current_user.id
#     ).all()
#     return territories


# @router.delete("/{territory_id}")
# def delete_territory(
#     territory_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
#     request: Request = None
# ):
#     territory = db.query(Territory).filter(Territory.id == territory_id).first()
#     if not territory:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Territory not found")
#     if territory.company_id != current_user.related_to_company and current_user.role not in ['CEO', 'Admin', 'Manager', 'Group Manager']:
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to delete this territory")
    
#     deleted_data = serialize_instance(territory)
#     entity_id = deleted_data.get("id")
    
#     db.delete(territory)
#     db.commit()    

#     create_audit_log(
#         db=db,
#         current_user=current_user,
#         instance=territory,
#         action="DELETE",
#         request=request,
#         old_data=deleted_data,        
#         custom_message=f"delete territory '{entity_id}' permanently"
#     )

#     return deleted_data


# @router.put("/{territory_id}", response_model=TerritoryResponse)
# async def update_territory(
#     territory_id: int,
#     data: TerritoryUpdate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
#     request: Request = None
# ):
#     territory = db.query(Territory).filter(Territory.id == territory_id).first()
#     if not territory:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="Territory not found"
#         )

#     allowed_roles = {"CEO", "ADMIN", "MANAGER", "GROUP MANAGER"}
#     user_role = (current_user.role or "").upper()

#     if (
#         territory.company_id != current_user.related_to_company
#         and user_role not in allowed_roles
#     ):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have permission to update this territory",
#         )

#     old_data = serialize_instance(territory)

#     if data.name is not None:
#         territory.name = data.name

#     if data.description is not None:
#         territory.description = data.description

#     assigned_user = None
#     if data.user_id is not None:
#         assigned_user = db.query(User).filter(User.id == data.user_id).first()
#         if not assigned_user:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Assigned user not found",
#             )
#         territory.user_id = data.user_id

#         if assigned_user.related_to_company:
#             territory.company_id = assigned_user.related_to_company

#     if data.company_id is not None:
#         territory.company_id = data.company_id

#     db.commit()
#     db.refresh(territory)

#     new_data = serialize_instance(territory)

#     message = "update territory '{name}'".format(name=territory.name)
#     if assigned_user:
#         message += f" assign to user: {assigned_user.first_name} {assigned_user.last_name}"

#     create_audit_log(
#         db=db,
#         current_user=current_user,
#         instance=territory,
#         action="UPDATE",
#         request=request,
#         old_data=old_data,
#         new_data=new_data,
#         custom_message=message,
#     )

#     return territory