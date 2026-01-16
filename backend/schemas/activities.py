# backend/schemas/activities.py
from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional
from datetime import datetime
from .auth import UserBase

class TaskBase(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None

    class Config:
        orm_mode = True

class MeetingBase(BaseModel):
    id: int
    subject: str
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time:  Optional[datetime] = None

    class Config:
        orm_mode = True

class CallBase(BaseModel):
    id: int
    subject: str
    direction: Optional[str] = None
    call_time: Optional[datetime] = None

    class Config:
        orm_mode = True

class QuoteBase(BaseModel):
    id: int
    quote_id: str
    status: Optional[str] = None
    presented_date: Optional[datetime] = None

    class Config:
        orm_mode = True

class DealBase(BaseModel):
    id: int
    deal_id: str
    name: str
    stage: Optional[str] = None
    close_date: Optional[datetime] = None

    class Config:
        orm_mode = True

class ContactBase(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: str
    title: Optional[str] = None

    class Config:
        orm_mode = True

class AccountActivityResponse(BaseModel):    
    tasks: Optional[list[TaskBase]] = None
    meetings: Optional[list[MeetingBase]] = []
    calls: Optional[list[CallBase]] = []
    quotes: Optional[list[QuoteBase]] = []
    deals: Optional[list[DealBase]] = []
    contacts: Optional[list[ContactBase]] = []

    class Config:
        orm_mode = True