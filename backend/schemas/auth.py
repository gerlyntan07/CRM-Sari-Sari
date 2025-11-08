from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from datetime import datetime


# ✅ Base model for shared fields
class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    phone_number: Optional[str] = None


# ✅ For creating a new user
class UserCreate(UserBase):
    company_id: Optional[int] = None  # ✅ make optional
    password: constr(min_length=6)


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[constr(min_length=6)] = None


# ✅ For login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ✅ For checking email availability
class EmailCheck(BaseModel):
    email: EmailStr


class EmailCheckResponse(BaseModel):
    detail: str

class CompanyBase(BaseModel):
    id: int
    company_name: str
    company_number: str
    company_website: Optional[str] = None
    company_logo: Optional[str] = None

    class Config:
        orm_mode = True
class CompanyOut(CompanyBase):
    pass

class UserWithCompany(UserBase):
    id: int
    auth_provider: str
    profile_picture: Optional[str] 
    company: Optional[CompanyBase] = None

    class Config:
        orm_mode = True

class UserTerritory(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


# ✅ Response model (includes extra fields)
class UserResponse(UserBase):
    id: int
    auth_provider: str
    profile_picture: Optional[str]    
    is_active: bool
    created_at: Optional[datetime]  # Date joined
    last_login: Optional[datetime]  # Last login
    company: Optional[CompanyOut] = None
    related_to_CEO: Optional[int] = None

    class Config:
        orm_mode = True

class UserWithTerritories(UserResponse):
    territory: Optional[UserTerritory] = []

    class Config:
        orm_mode = True
