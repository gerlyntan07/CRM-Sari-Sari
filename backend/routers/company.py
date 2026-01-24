from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from typing import Dict

# Import your database connection
from database import get_db

# Import Models
from models.company import Company
from models.auth import User

# Import Schemas
# ✅ ADDED CompanyUpdate to the import list
from schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate

# Import Utilities
from .auth_utils import get_current_user
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(prefix="/company", tags=["Company"])

@router.put("/update-name")
def update_company_details(
    payload: CompanyUpdate,  # ✅ Changed from Dict to Pydantic Schema
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """
    Updates the company name, currency, and fiscal settings.
    Only CEO and ADMIN roles are permitted.
    """
    # 1. Permission Check
    user_role = (current_user.role or "").upper()
    if user_role not in ["CEO", "ADMIN"]:
        raise HTTPException(
            status_code=403, 
            detail="Access denied: Only CEOs or Admins can change company details."
        )

    # 2. Find the company linked to this user
    # Note: Using related_to_company is safer than company_id in some architectures, sticking to your logic.
    company = db.query(Company).filter(Company.id == current_user.related_to_company).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company record not found.")

    # 3. Preparation for Audit Log
    old_data = serialize_instance(company)

    # 4. Perform Update
    # Update Name
    if not payload.company_name or not payload.company_name.strip():
        raise HTTPException(status_code=400, detail="Company name cannot be empty.")
    
    company.company_name = payload.company_name.strip()

    # ✅ Update Currency (if provided)
    if payload.currency:
        company.currency = payload.currency

    # ✅ Update Quota Period (if provided)
    if payload.quota_period:
        company.quota_period = payload.quota_period

    db.commit()
    db.refresh(company)

    # 5. Create Audit Log
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=company,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=serialize_instance(company),
        custom_message="updated company global settings (name/currency/period)" # Updated message
    )

    return {"message": "Success", "company": company}

@router.post("/create", response_model=CompanyResponse)
def create_company(
    company_in: CompanyCreate, 
    db: Session = Depends(get_db)
):    
    """Creates a new company record."""
    new_company = Company(
        company_name=company_in.company_name,
        company_number=company_in.company_number,
        company_website=str(company_in.company_website) if company_in.company_website else None,
        # Default values for new companies
        currency="₱",
        quota_period="January"
    )
    
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company