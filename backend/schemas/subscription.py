#backend/schemas/subscription.py
from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from datetime import datetime

class SubscriptionBase(BaseModel):
    company_id: int
    plan_name: str
    price: float = 0
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionResponse(SubscriptionBase):
    id: int
    is_trial: bool = False
    trial_notification_sent_at: Optional[datetime] = None
    downgraded_to_free_at: Optional[datetime] = None

    class Config:
        orm_mode = True
