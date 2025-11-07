from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.lead import LeadCreate, LeadResponse
from schemas.auth import UserResponse, UserWithTerritories
from .auth_utils import get_current_user, hash_password,get_default_avatar
from models.auth import User
from models.lead import Lead
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
