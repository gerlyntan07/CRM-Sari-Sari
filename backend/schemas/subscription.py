#backend/schemas/subscription.py
from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from datetime import datetime

class SubscriptionBase(BaseModel):
    company_id: int
    plan_name: str
    price: float
    status: str

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionResponse(SubscriptionBase):
    id: int    

    class Config:
        orm_mode = True
