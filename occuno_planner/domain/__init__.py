# Domain models have been migrated to core.models
# This file is kept for backward compatibility
from core.models import (
    AchievementDefinition,
    UserAchievement,
    UserProfile,
    RecurringInfo,
    Objective
)

__all__ = [
    "AchievementDefinition",
    "UserAchievement",
    "UserProfile",
    "RecurringInfo",
    "Objective"
] 