from pydantic import BaseModel, EmailStr, constr

class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

class UserCreate(UserBase):
    first_name: constr(max_length=50)
    last_name: constr(max_length=50)
    password: constr(min_length=6)

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    auth_provider: str

    class Config:
        orm_mode = True
