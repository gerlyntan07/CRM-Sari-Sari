from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class TargetBase(BaseModel):
    user_id: int
    period: str  # Format: YYYY-MM
    target_amount: Decimal
    achieved: Optional[Decimal] = 0
    status: str = "ACTIVE"

class TargetCreate(TargetBase):
    pass

class TargetUpdate(BaseModel):
    user_id: Optional[int] = None
    period: Optional[str] = None
    target_amount: Optional[Decimal] = None
    achieved: Optional[Decimal] = None
    status: Optional[str] = None

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

    class Config:
        orm_mode = True

