from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.lead import LeadCreate, LeadResponse, LeadStatusUpdate, LeadUpdate
from schemas.auth import UserResponse, UserWithTerritories
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from models.lead import Lead
from models.account import Account
from models.contact import Contact
from models.deal import Deal
from .logs_utils import serialize_instance, create_audit_log
from sqlalchemy.orm import joinedload
from .ws_notification import broadcast_notification
import asyncio
from datetime import datetime



router = APIRouter(
    prefix="/leads",
    tags=["Leads"]
)

@router.get("/admin/getLeads", response_model=List[LeadResponse])
def get_leads_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ✅ Get all leads whose owners belong to the same company as the current user
    leads = (
        db.query(Lead)
        .join(User, Lead.lead_owner == User.id)
        .filter(User.related_to_company == current_user.related_to_company)
        .all()
    )

    return leads


@router.get("/getUsers", response_model=list[UserWithTerritories])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).filter(User.related_to_company == current_user.related_to_company).all()
    return users

# ✅ CREATE new territory
@router.post("/create", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):                
    lead_owner = db.query(User).filter(User.id == data.lead_owner).first()
    if not lead_owner:
        raise HTTPException(status_code=404, detail="Assigned user not found")

    new_lead = Lead(
        first_name=data.first_name,
        last_name=data.last_name,
        company_name=data.company_name,
        title=data.title,
        department=data.department,
        email=data.email,
        work_phone=data.work_phone,
        mobile_phone_1=data.mobile_phone_1,
        mobile_phone_2=data.mobile_phone_2,
        address=data.address,
        notes=data.notes,
        status=data.status,
        source=data.source,
        territory_id=data.territory_id,
        lead_owner=data.lead_owner,
        created_by=current_user.id,
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    
    notif_data = {
        "type": "lead_assignment",
        "title": f"New Lead Assigned: {new_lead.first_name} {new_lead.last_name}",
        "company": new_lead.company_name,
        "assignedBy": f"{current_user.first_name} {current_user.last_name}",
        "createdAt": str(new_lead.created_at),
        "read": False,
    }

    try:
        asyncio.run(broadcast_notification(notif_data, target_user_id=data.lead_owner))
    except RuntimeError:
        loop = asyncio.get_event_loop()
        loop.create_task(broadcast_notification(notif_data, target_user_id=data.lead_owner))

    # ✅ Create audit log
    new_data = serialize_instance(new_lead)    

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=new_lead,
        action="CREATE",
        request=request,
        new_data=new_data,
        custom_message=f"add lead '{data.title}' to user: {lead_owner.first_name} {lead_owner.last_name}"
    )

    return new_lead


@router.put("/convert/{lead_id}", response_model=LeadResponse)
def convert_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.status = 'Converted'
    db.commit()
    db.refresh(lead)

    new_data = serialize_instance(lead)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=lead,
        action="UPDATE",
        request=request,
        new_data=new_data,
        custom_message=f"converted lead '{lead.first_name} {lead.last_name}'"
    )

    return lead

@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Check authorization
    if current_user.role not in ['CEO', 'Admin', 'Group Manager'] and \
        current_user.id != lead.lead_owner and \
        current_user.id != lead.created_by:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this lead"
            )

    old_data = serialize_instance(lead)
    
    # Update fields if provided
    if data.first_name is not None:
        lead.first_name = data.first_name
    if data.last_name is not None:
        lead.last_name = data.last_name
    if data.company_name is not None:
        lead.company_name = data.company_name
    if data.title is not None:
        lead.title = data.title
    if data.department is not None:
        lead.department = data.department
    if data.email is not None:
        lead.email = data.email
    if data.work_phone is not None:
        lead.work_phone = data.work_phone
    if data.mobile_phone_1 is not None:
        lead.mobile_phone_1 = data.mobile_phone_1
    if data.mobile_phone_2 is not None:
        lead.mobile_phone_2 = data.mobile_phone_2
    if data.address is not None:
        lead.address = data.address
    if data.notes is not None:
        lead.notes = data.notes
    if data.source is not None:
        lead.source = data.source
    if data.status is not None:
        lead.status = data.status
    if data.territory_id is not None:
        lead.territory_id = data.territory_id
    if data.lead_owner is not None:
        # Verify the new lead owner exists
        new_owner = db.query(User).filter(User.id == data.lead_owner).first()
        if not new_owner:
            raise HTTPException(status_code=404, detail="Assigned user not found")
        lead.lead_owner = data.lead_owner
    
    db.commit()
    db.refresh(lead)

    new_data = serialize_instance(lead)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=lead,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        custom_message=f"updated lead '{lead.first_name} {lead.last_name}'"
    )

    return lead

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    lead = db.query(Lead).options(joinedload(Lead.assigned_to)).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Check authorization - only CEO, Admin, Group Manager, or lead owner/creator can delete
    if current_user.role not in ['CEO', 'Admin', 'Group Manager'] and \
        current_user.id != lead.lead_owner and \
        current_user.id != lead.created_by:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this lead"
            )
    
    # Verify lead belongs to same company
    if lead.assigned_to and lead.assigned_to.related_to_company != current_user.related_to_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this lead"
        )

    old_data = serialize_instance(lead)
    lead_name = f"{lead.first_name} {lead.last_name}"
    
    # If lead is converted, find and delete associated Account, Contact, and Deal
    if lead.status == 'Converted':
        # Find account by matching company name and creator (from conversion)
        # Account name should match lead company_name, and created_by should match lead creator
        account = db.query(Account).filter(
            Account.name == lead.company_name,
            Account.created_by == lead.created_by
        ).first()
        
        if account:
            # Find contact associated with this account and matching lead's email
            contact = db.query(Contact).filter(
                Contact.account_id == account.id,
                Contact.email == lead.email
            ).first()
            
            # Find deal associated with this account that was created from lead conversion
            # Deal description typically contains "Converted from Lead" or "Initial deal from lead conversion"
            deal = db.query(Deal).filter(
                Deal.account_id == account.id,
                Deal.description.like('%Converted from Lead%')
            ).first()
            
            # If no deal found with that description, try to find by account and contact
            if not deal and contact:
                deal = db.query(Deal).filter(
                    Deal.account_id == account.id,
                    Deal.primary_contact_id == contact.id
                ).first()
            
            # Delete in order: Deal -> Contact -> Account (due to foreign key constraints)
            if deal:
                deal_old_data = serialize_instance(deal)
                db.delete(deal)
                create_audit_log(
                    db=db,
                    current_user=current_user,
                    instance=deal,
                    action="DELETE",
                    request=request,
                    old_data=deal_old_data,
                    custom_message=f"deleted deal '{deal.name}' (from converted lead '{lead_name}')"
                )
            
            if contact:
                contact_old_data = serialize_instance(contact)
                db.delete(contact)
                create_audit_log(
                    db=db,
                    current_user=current_user,
                    instance=contact,
                    action="DELETE",
                    request=request,
                    old_data=contact_old_data,
                    custom_message=f"deleted contact '{contact.first_name} {contact.last_name}' (from converted lead '{lead_name}')"
                )
            
            if account:
                account_old_data = serialize_instance(account)
                db.delete(account)
                create_audit_log(
                    db=db,
                    current_user=current_user,
                    instance=account,
                    action="DELETE",
                    request=request,
                    old_data=account_old_data,
                    custom_message=f"deleted account '{account.name}' (from converted lead '{lead_name}')"
                )
    
    db.delete(lead)
    db.commit()

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=lead,
        action="DELETE",
        request=request,
        old_data=old_data,
        custom_message=f"deleted lead '{lead_name}'"
    )

    return None

@router.get("/sales/getLeads")
def get_sales_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    leads = (
        db.query(Lead)
        .options(
            joinedload(Lead.assigned_to),
            joinedload(Lead.creator),
            joinedload(Lead.territory)
        )
        .filter(Lead.lead_owner == current_user.id)
        .all()
    )

    lead_list = []
    for lead in leads:
        lead_list.append({
            "id": lead.id,
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "company_name": lead.company_name,
            "title": lead.title,
            "department": lead.department,
            "email": lead.email,
            "work_phone": lead.work_phone,
            "mobile_phone_1": lead.mobile_phone_1,
            "mobile_phone_2": lead.mobile_phone_2,
            "address": lead.address,
            "notes": lead.notes,
            "status": lead.status,
            "source": lead.source,
            "territory": lead.territory.name if lead.territory else None,
            "assigned_to": {
                "id": lead.assigned_to.id if lead.assigned_to else None,
                "first_name": lead.assigned_to.first_name if lead.assigned_to else None,
                "last_name": lead.assigned_to.last_name if lead.assigned_to else None,
            },
            "created_by": {
                "id": lead.creator.id if lead.creator else None,
                "first_name": lead.creator.first_name if lead.creator else None,
                "last_name": lead.creator.last_name if lead.creator else None,
                "territory": {
                "id": lead.territory.id if lead.territory else None,
                "name": lead.territory.name if lead.territory else None
            },
            },        
            "created_at": lead.created_at,
            "updated_at": lead.updated_at,
        })
    return lead_list

@router.get("/get/{lead}", response_model=LeadResponse)
def get_lead(
    lead: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Optional: check if current_user has access to this lead
    if lead.assigned_to.related_to_company != current_user.related_to_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this lead"
        )    

    return lead

@router.put("/{lead_id}/update/status", response_model=LeadResponse)
def update_lead_status(
    lead_id: int,
    data: LeadStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    if current_user.role not in ['CEO', 'Admin', 'Group Manager'] and \
        current_user.id != lead.assigned_to.id and \
        current_user.id != lead.creator.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this lead"
            )

    old_data = serialize_instance(lead)
    lead.status = data.status    
    db.commit()
    db.refresh(lead)

    new_data = serialize_instance(lead)

    create_audit_log(
        db=db,
        current_user=current_user,
        instance=lead,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=new_data,
        custom_message=f"updated lead status of '{lead.first_name} {lead.last_name}'"
    )

    return lead