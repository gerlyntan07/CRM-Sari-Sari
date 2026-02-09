from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict

# Import your database connection
from database import get_db

# Import Models
from models.company import Company
from models.auth import User

# Import Schemas
# ✅ ADDED CompanyUpdate to the import list
from schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate, CompanyInvoiceInfo

# Import Utilities
from .auth_utils import get_current_user
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(prefix="/company", tags=["Company"])


@router.get("/invoice-info", response_model=CompanyInvoiceInfo)
def get_company_invoice_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns company info needed for invoice printing, including CEO email."""
    if not current_user.related_to_company:
        raise HTTPException(status_code=400, detail="Current user is not linked to any company.")

    company = (
        db.query(Company)
        .filter(Company.id == current_user.related_to_company)
        .first()
    )
    if not company:
        raise HTTPException(status_code=404, detail="Company record not found.")

    ceo = (
        db.query(User)
        .filter(User.related_to_company == company.id)
        .filter(func.lower(User.role) == "ceo")
        .filter(User.is_active == True)
        .order_by(User.id.asc())
        .first()
    )

    return {
        "company_name": company.company_name,
        "company_number": company.company_number,
        "company_logo": (company.company_logo if company.company_logo else None),
        "company_website": (company.company_website if company.company_website else None),
        "address": (company.address if company.address else None),
        "ceo_name": (ceo.first_name if ceo else None),
        "ceo_email": (ceo.email if ceo else None),
    }

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

    # ✅ Update Tax Rate (if provided)
    if payload.tax_rate is not None:
        company.tax_rate = payload.tax_rate

    # ✅ Update Company Logo (if provided or explicitly set to empty/null to remove)
    if payload.company_logo is not None:
        company.company_logo = payload.company_logo if payload.company_logo else None
        
    if payload.address is not None:
        company.address = payload.address if payload.address else None
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
        quota_period="January",
        tax_rate=0
    )
    
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company