from typing import List, Dict, Optional, Any
from datetime import datetime
from sqlmodel import SQLModel

from .enums import ObjectiveStatus, ObjectiveType


class UserAchievementResponse(SQLModel):
    achievement_id: str
    unlocked_at: datetime


class EarnedCouponResponse(SQLModel):
    id: str
    coupon_type: str
    display_name: Optional[str] = None
    earned_at: datetime
    expires_at: datetime
    used_at: Optional[datetime] = None
    is_used: bool = False


class MysteryBoxReward(SQLModel):
    coupon_type: str
    quantity: int = 1
    bonus_multiplier: float = 1.0


class TaskCompletionResult(SQLModel):
    success: bool
    coupons_earned: int
    coupon_descriptions: List[str]
    bonus_message: Optional[str] = None
    urgency_message: Optional[str] = None
    points_awarded: int
    current_coupons: int
    total_coupons_earned: int
    mystery_box_progress: Dict[str, Any]
    mystery_boxes_available: int
    unlocked_achievements: List[UserAchievementResponse]
    celebration: Optional[str] = None


class DailyBonusResult(SQLModel):
    success: bool
    bonus_type: str
    coupons_earned: int
    coupon_descriptions: List[str]
    consecutive_days: int
    message: str
    extra_rewards: List[str]
    celebration: str


class ObjectiveStats(SQLModel):
    total: int
    by_status: Dict[ObjectiveStatus, int]
    by_type: Dict[ObjectiveType, int]
    completion_rate: float
    active_count: int
    blocked_count: int
