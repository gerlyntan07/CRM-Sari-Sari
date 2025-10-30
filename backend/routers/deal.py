from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.deal import DealBase, DealResponse
from schemas.auth import UserResponse, UserWithTerritories
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from models.deal import Deal
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(
    prefix="/deals",
    tags=["Deals"]
)

@router.post("/convertedLead", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    data: DealBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):                    
    new_deal = Deal(
        name=data.name,
        account_id=data.account_id,
        primary_contact_id=data.primary_contact_id,
        stage=data.stage,
        probability=data.probability,
        amount=data.amount,
        currency=data.currency,
        description=data.description,
        assigned_to=data.assigned_to,
        created_by=current_user.id,  # safer to use current_user
    )
    
    # Step 1: Add and commit once to get the DB-assigned id
    db.add(new_deal)
    db.commit()
    db.refresh(new_deal)

    # Step 2: Generate and save deal_id like D25-00001
    new_deal.generate_deal_id()
    db.commit()
    db.refresh(new_deal)

    # Step 3: Log and return
    new_data = serialize_instance(new_deal)    
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_deal,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"add '{data.name}' deal from a converted lead"
    )

    return new_deal
