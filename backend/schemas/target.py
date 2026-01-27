from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


class PeriodType(str, Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    SEMIANNUAL = "SEMIANNUAL"
    ANNUAL = "ANNUAL"
    CUSTOM = "CUSTOM"


class TargetBase(BaseModel):
    user_id: int
    start_date: date
    end_date: date
    target_amount: Decimal
    period_type: Optional[PeriodType] = PeriodType.CUSTOM
    period_year: Optional[int] = None
    period_number: Optional[int] = None


class TargetCreate(TargetBase):
    pass


class TargetUpdate(BaseModel):
    user_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_amount: Optional[Decimal] = None
    period_type: Optional[PeriodType] = None
    period_year: Optional[int] = None
    period_number: Optional[int] = None

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


# =====================================================
# Leaderboard Schemas
# =====================================================
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    user_name: str
    role: Optional[str] = None
    target_amount: Decimal
    achieved_amount: Decimal
    achievement_percentage: float
    remaining_amount: Decimal
    target_count: int

    class Config:
        orm_mode = True


class LeaderboardResponse(BaseModel):
    period_type: str
    period_year: Optional[int] = None
    period_number: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_target: Decimal
    total_achieved: Decimal
    overall_achievement: float
    entries: List[LeaderboardEntry]

    class Config:
        orm_mode = True


# =====================================================
# Historical Comparison Schemas
# =====================================================
class PeriodComparison(BaseModel):
    period_label: str  # e.g., "Q1 2026", "Jan 2026"
    period_type: str
    period_year: int
    period_number: Optional[int] = None
    start_date: date
    end_date: date
    target_amount: Decimal
    achieved_amount: Decimal
    achievement_percentage: float

    class Config:
        orm_mode = True


class HistoricalComparisonResponse(BaseModel):
    user_id: int
    user_name: str
    current_period: Optional[PeriodComparison] = None
    previous_period: Optional[PeriodComparison] = None
    growth_percentage: Optional[float] = None  # % change from previous
    growth_amount: Optional[Decimal] = None
    periods: List[PeriodComparison]  # All historical periods

    class Config:
        orm_mode = True


# =====================================================
# Team Performance Summary
# =====================================================
class TeamPerformanceSummary(BaseModel):
    period_type: str
    period_year: Optional[int] = None
    period_number: Optional[int] = None
    total_sales_reps: int
    total_target: Decimal
    total_achieved: Decimal
    overall_achievement: float
    above_target_count: int  # Reps who met/exceeded quota
    below_target_count: int
    top_performer: Optional[LeaderboardEntry] = None
    needs_attention: List[LeaderboardEntry] = []  # Below 50%

    class Config:
        orm_mode = True
