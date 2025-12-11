from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.deal import DealBase, DealResponse, DealCreate, DealUpdate
from schemas.auth import UserResponse, UserWithTerritories
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from models.deal import Deal, DealStage, STAGE_PROBABILITY_MAP
from models.account import Account
from models.contact import Contact
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
    # Validate amount - Numeric(10, 2) means max value is 99,999,999.99
    if data.amount is not None:
        if data.amount > 99999999.99:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deal amount cannot exceed 99,999,999.99"
            )
        if data.amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deal amount cannot be negative"
            )
                    
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
    new_deal.generate_deal_id(db)
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

@router.get("/admin/fetch-all", response_model=list[DealResponse])
def admin_get_deals(    
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):        
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Get all users in the same company
    company_users = db.query(User.id).filter(User.related_to_company == current_user.related_to_company).subquery()

    deals = db.query(Deal).filter(
        (Deal.created_by.in_(company_users)) | (Deal.assigned_to.in_(company_users))
    ).all()

    return deals

@router.get("/from-acc/{accID}", response_model=list[DealResponse])
def admin_get_deals(    
    accID: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):        
    # Get all users in the same company
    company_users = db.query(User.id).filter(User.related_to_company == current_user.related_to_company).subquery()

    deals = db.query(Deal).filter(
        (Deal.created_by.in_(company_users)) | (Deal.assigned_to.in_(company_users))
    ).filter(Deal.account_id == accID).all()

    return deals

@router.post("/admin/create", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def admin_create_deal(
    data: DealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
        raise HTTPException(status_code=403, detail="Permission denied")

    if not current_user.related_to_company:
        raise HTTPException(status_code=400, detail="Current user is not linked to any company.")

    # Validate account exists and belongs to same company
    account = db.query(Account).filter(Account.id == data.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")
    
    # Check if account belongs to company
    account_creator = db.query(User).filter(User.id == account.created_by).first()
    if not account_creator or account_creator.related_to_company != current_user.related_to_company:
        raise HTTPException(status_code=403, detail="Account does not belong to your company.")

    # Validate contact if provided
    if data.primary_contact_id:
        contact = db.query(Contact).filter(Contact.id == data.primary_contact_id).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found.")
        contact_creator = db.query(User).filter(User.id == contact.created_by).first()
        if not contact_creator or contact_creator.related_to_company != current_user.related_to_company:
            raise HTTPException(status_code=403, detail="Contact does not belong to your company.")

    # Validate assigned user if provided
    if data.assigned_to:
        assigned_user = db.query(User).filter(
            User.id == data.assigned_to,
            User.related_to_company == current_user.related_to_company
        ).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found in your company.")

    # Validate amount
    if data.amount is not None:
        if data.amount > 99999999.99:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deal amount cannot exceed 99,999,999.99"
            )
        if data.amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deal amount cannot be negative"
            )

    # Calculate probability from stage
    stage_upper = data.stage.upper()
    probability = STAGE_PROBABILITY_MAP.get(DealStage(stage_upper), 10)

    new_deal = Deal(
        name=data.name,
        account_id=data.account_id,
        primary_contact_id=data.primary_contact_id,
        stage=stage_upper,
        probability=probability,
        amount=data.amount,
        currency=data.currency or 'PHP',
        close_date=data.close_date,
        description=data.description,
        assigned_to=data.assigned_to,
        created_by=current_user.id,
    )
    
    db.add(new_deal)
    db.commit()
    db.refresh(new_deal)

    # Generate deal_id
    new_deal.generate_deal_id()
    db.commit()
    db.refresh(new_deal)

    new_data = serialize_instance(new_deal)
    assigned_fragment = ""
    if data.assigned_to:
        assigned_user = db.query(User).filter(User.id == data.assigned_to).first()
        if assigned_user:
            assigned_fragment = f" assigned to '{assigned_user.first_name} {assigned_user.last_name}'"

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_deal,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"create deal '{data.name}' via admin panel{assigned_fragment}"
    )

    return new_deal

@router.put("/admin/{deal_id}", response_model=DealResponse)
def admin_update_deal(
    deal_id: int,
    data: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
        raise HTTPException(status_code=403, detail="Permission denied")

    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Verify deal belongs to same company
    company_users = db.query(User.id).filter(User.related_to_company == current_user.related_to_company).subquery()
    deal_creator = db.query(User).filter(User.id == deal.created_by).first()
    if not deal_creator or deal_creator.related_to_company != current_user.related_to_company:
        raise HTTPException(status_code=403, detail="Not authorized to access this deal")

    old_data = serialize_instance(deal)

    # Update fields if provided
    if data.name is not None:
        deal.name = data.name
    
    if data.account_id is not None:
        account = db.query(Account).filter(Account.id == data.account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found.")
        account_creator = db.query(User).filter(User.id == account.created_by).first()
        if not account_creator or account_creator.related_to_company != current_user.related_to_company:
            raise HTTPException(status_code=403, detail="Account does not belong to your company.")
        deal.account_id = data.account_id

    if data.primary_contact_id is not None:
        if data.primary_contact_id == 0:  # Allow clearing contact
            deal.primary_contact_id = None
        else:
            contact = db.query(Contact).filter(Contact.id == data.primary_contact_id).first()
            if not contact:
                raise HTTPException(status_code=404, detail="Contact not found.")
            contact_creator = db.query(User).filter(User.id == contact.created_by).first()
            if not contact_creator or contact_creator.related_to_company != current_user.related_to_company:
                raise HTTPException(status_code=403, detail="Contact does not belong to your company.")
            deal.primary_contact_id = data.primary_contact_id

    if data.stage is not None:
        stage_upper = data.stage.upper()
        deal.stage = stage_upper
        # Update probability based on stage
        probability = STAGE_PROBABILITY_MAP.get(DealStage(stage_upper), deal.probability)
        deal.probability = probability

    if data.amount is not None:
        if data.amount > 99999999.99:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deal amount cannot exceed 99,999,999.99"
            )
        if data.amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deal amount cannot be negative"
            )
        deal.amount = data.amount

    if data.currency is not None:
        deal.currency = data.currency

    if data.close_date is not None:
        deal.close_date = data.close_date

    if data.description is not None:
        deal.description = data.description

    if data.assigned_to is not None:
        if data.assigned_to == 0:  # Allow clearing assignment
            deal.assigned_to = None
        else:
            assigned_user = db.query(User).filter(
                User.id == data.assigned_to,
                User.related_to_company == current_user.related_to_company
            ).first()
            if not assigned_user:
                raise HTTPException(status_code=404, detail="Assigned user not found in your company.")
            deal.assigned_to = data.assigned_to

    db.commit()
    db.refresh(deal)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=deal,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=serialize_instance(deal),
        custom_message=f"updated deal '{deal.name}' via admin panel"
    )

    return deal

@router.delete("/admin/{deal_id}", status_code=status.HTTP_200_OK)
def admin_delete_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    if current_user.role.upper() not in ['CEO', 'ADMIN', 'GROUP MANAGER']:
        raise HTTPException(status_code=403, detail="Permission denied")

    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Verify deal belongs to same company
    deal_creator = db.query(User).filter(User.id == deal.created_by).first()
    if not deal_creator or deal_creator.related_to_company != current_user.related_to_company:
        raise HTTPException(status_code=403, detail="Not authorized to access this deal")

    old_data = serialize_instance(deal)
    deal_name = deal.name

    db.delete(deal)
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=deal,
        action="DELETE",
        request=request,
        old_data=old_data,
        custom_message=f"deleted deal '{deal_name}' via admin panel"
    )

    return {"detail": f"Deal '{deal_name}' deleted successfully."}