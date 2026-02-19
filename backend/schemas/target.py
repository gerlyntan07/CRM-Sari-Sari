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


# =====================================================
# Annual Target Generation Schema
# =====================================================
class AnnualTargetCreate(BaseModel):
    """
    Schema for creating targets based on annual amount.
    The annual amount is divided according to the period type.
    """
    user_id: int
    annual_amount: Decimal  # Base annual target (e.g., 12,000,000)
    period_type: PeriodType  # MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL
    # The selected year/period from the UI. For QUARTERLY/SEMIANNUAL/ANNUAL this is treated as fiscal year.
    # For MONTHLY this is treated as calendar year (Jan-Dec) to match the current UI.
    period_year: Optional[int] = None
    period_number: Optional[int] = None
    generation_date: Optional[date] = None  # Date to start generating targets (defaults to today)
    prorate_first_period: bool = True  # Whether to prorate the first partial period


class GeneratedTargetInfo(BaseModel):
    """Info about a single generated target period."""
    start_date: date
    end_date: date
    target_amount: Decimal
    period_number: Optional[int] = None
    is_prorated: bool = False


class AnnualTargetCreateResponse(BaseModel):
    """Response for annual target creation."""
    user_id: int
    user_name: str
    annual_amount: Decimal
    period_type: str
    period_amount: Decimal  # Full period amount before proration
    created_count: int
    targets_created: List[GeneratedTargetInfo]
    message: str


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
    created_by: Optional[int] = None
    status: Optional[str] = None

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
