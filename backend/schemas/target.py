from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class TargetBase(BaseModel):
    user_id: int
    start_date: date
    end_date: date
    target_amount: Decimal


class TargetCreate(TargetBase):
    pass


class TargetUpdate(BaseModel):
    user_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_amount: Optional[Decimal] = None

class TargetBulkDelete(BaseModel):
    target_ids: list[int]


class UserBase(BaseModel):
    id: int
    first_name: str
    last_name: str
    role: Optional[str] = None

    class Config:
        orm_mode = True


class TargetResponse(TargetBase):
    id: int
    user: Optional[UserBase] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    achieved_amount: Optional[Decimal] = None

    class Config:
        orm_mode = True
