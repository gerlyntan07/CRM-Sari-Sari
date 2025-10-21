# backend/schemas/territory.py
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class TerritoryBase(BaseModel):    
    name: str
    description: str    

class TerritoryCreate(TerritoryBase):
    user_id: int
    company_id: int

class TerritoryManager(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str

    class Config:
        orm_mode = True

class TerritoryResponse(TerritoryBase):
    id: int        
    managed_by: Optional[TerritoryManager] = None
    created_at: datetime

    class Config:
        orm_mode = True
