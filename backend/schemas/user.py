from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    username: str    

class UserCreate(UserBase):
    pass

class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
