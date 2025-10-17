# backend/schemas/auth.py
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class TerritoryBase(BaseModel):    
    name: str
    description: str    

class TerritoryCreate(TerritoryBase):
    user_id: int
    company_id: int

class TerritoryResponse(TerritoryBase):
    id: int    

    class Config:
        orm_mode = True
