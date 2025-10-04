# backend/schemas/auth.py
from pydantic import BaseModel, EmailStr, constr
from typing import Optional

class UserBase(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    email: EmailStr
    profile_picture: Optional[str]
    role: str
    phone_number: str

class UserCreate(UserBase):
    password: constr(min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    phone_number: str
    auth_provider: str
    profile_picture: str
    class Config:
        orm_mode = True
