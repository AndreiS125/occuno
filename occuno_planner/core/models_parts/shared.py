from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlmodel import SQLModel

class RecurringInfo(SQLModel):
    """Recurring information for objectives"""
    frequency: str  # "daily", "weekly", "monthly"
    interval: int = 1  # every N days/weeks/months
    days_of_week: Optional[List[int]] = None  # 0=Monday, 6=Sunday
    time_of_day: Optional[str] = None  # "09:00"
    next_occurrence: Optional[datetime] = None

class CustomRewardTier(SQLModel):
    """User-defined reward tier with custom segments and probabilities"""
    tier_name: str
    probability: float  # 0.0 to 1.0
    colors: List[Dict[str, str]]
    glow_color: str
    segments: List[Dict[str, Any]]

class CustomRewardConfiguration(SQLModel):
    """User's custom reward wheel configuration"""
    id: UUID
    user_id: UUID
    configuration_name: str = "My Custom Wheel"
    is_active: bool = True
    reward_tiers: List[CustomRewardTier] = []
    created_at: datetime
    updated_at: datetime
