# backend/routers/auth.py (should actually be routers/company.py)
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import SessionLocal
from models.company import Company
from schemas.company import CompanyCreate, CompanyResponse

router = APIRouter(prefix="/company", tags=["company"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/create", response_model=CompanyResponse)
def createCompany(user: CompanyCreate, response: Response, db: Session = Depends(get_db)):    
    # ✅ Use SQLAlchemy model, not Pydantic schema
    new_company = Company(
        company_name=user.company_name,
        company_number=user.company_number,
        company_website=str(user.company_website),
        CEO_id=user.CEO_id,
    )
    
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company
