from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from typing import Dict

# Import your database connection
from database import get_db

# Import Models
from models.company import Company
from models.auth import User

# Import Schemas
from schemas.company import CompanyCreate, CompanyResponse

# Import Utilities (Adjust these import paths based on your file structure)
from .auth_utils import get_current_user
from .logs_utils import serialize_instance, create_audit_log

router = APIRouter(prefix="/company", tags=["Company"])

@router.put("/update-name")
def update_company_name(
    name_data: Dict[str, str], 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    """
    Updates the company name for the organization the current user belongs to.
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
    # Note: Using current_user.related_to_company to ensure they only edit THEIR company
    company = db.query(Company).filter(Company.id == current_user.related_to_company).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company record not found.")

    # 3. Validation
    new_name = name_data.get("company_name")
    if not new_name or not new_name.strip():
        raise HTTPException(status_code=400, detail="Company name cannot be empty.")

    # 4. Preparation for Audit Log
    old_data = serialize_instance(company)

    # 5. Perform Update
    company.company_name = new_name.strip()
    db.commit()
    db.refresh(company)

    # 6. Create Audit Log
    create_audit_log(
        db=db,
        current_user=current_user,
        instance=company,
        action="UPDATE",
        request=request,
        old_data=old_data,
        new_data=serialize_instance(company),
        custom_message=f"renamed company to '{new_name}'"
    )

    return {"message": "Success", "company_name": company.company_name}

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
    )
    
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company