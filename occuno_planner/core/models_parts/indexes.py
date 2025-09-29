from sqlalchemy import Index

from .calendar_objective import Objective
from .achievements_coupons import UserAchievement, EarnedCoupon


def create_indexes():
    """Create database indexes for performance"""
    return [
        Index('idx_objectives_parent_id', Objective.parent_id),
        Index('idx_objectives_status', Objective.status),
        Index('idx_objectives_due_date', Objective.due_date),
        Index('idx_objectives_type', Objective.objective_type),
        Index('idx_user_achievements_user_id', UserAchievement.user_id),
        Index('idx_user_achievements_unique', UserAchievement.user_id, UserAchievement.achievement_id, unique=True),
        Index('idx_earned_coupons_user_id', EarnedCoupon.user_id),
        Index('idx_earned_coupons_is_used', EarnedCoupon.is_used),
    ]
