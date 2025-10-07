from pydantic import BaseModel, EmailStr, constr
from typing import Optional

# ✅ Base model for shared fields
class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    phone_number: str


# ✅ For creating a new user
class UserCreate(UserBase):
    password: constr(min_length=6)


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
    CEO_id: int

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

# ✅ Response model (includes extra fields)
class UserResponse(UserBase):
    id: int
    auth_provider: str
    profile_picture: Optional[str]    

    class Config:
        orm_mode = True
