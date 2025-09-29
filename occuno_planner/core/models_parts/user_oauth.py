from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship, JSON, Column

from .base import UUIDType


class UserProfile(SQLModel, table=True):
    """User profile with gamification stats - FastAPI-Users compatible"""
    __tablename__ = "user_profile"

    # FastAPI-Users required fields
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    email: str = Field(max_length=255, unique=True, index=True)
    hashed_password: str = Field(max_length=255)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    is_verified: bool = Field(default=False)

    # Additional user fields
    full_name: Optional[str] = Field(default=None, max_length=255)
    profile_picture_url: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = Field(default=None)

    # Authentication fields
    google_id: Optional[str] = Field(default=None, max_length=255, unique=True, index=True)
    is_email_verified: bool = Field(default=False)

    # Core Gamification
    overall_score: int = Field(default=0)
    current_streak_days: int = Field(default=0)
    last_streak_check_date: Optional[datetime] = None

    # XP/Level System
    experience_points: int = Field(default=0)
    level: int = Field(default=1)
    experience_to_next_level: int = Field(default=100)
    total_experience_earned: int = Field(default=0)
    last_level_up_date: Optional[datetime] = None

    # Coupon System
    total_coupons_earned: int = Field(default=0)
    total_coupons_used: int = Field(default=0)

    # Mystery Box System
    mystery_boxes_earned: int = Field(default=0)
    mystery_boxes_opened: int = Field(default=0)
    mystery_boxes_from_levelup: int = Field(default=0)
    mystery_box_progress: int = Field(default=0)
    points_per_mystery_box: int = Field(default=100)

    # Streak System Enhancement
    longest_streak: int = Field(default=0)
    streak_multiplier: float = Field(default=1.0)
    streak_insurance_count: int = Field(default=0)
    last_activity_date: Optional[datetime] = None

    # Daily/Weekly Systems
    daily_login_streak: int = Field(default=0)
    last_daily_bonus_date: Optional[datetime] = None
    weekly_challenge_completed: bool = Field(default=False)
    weekly_challenge_progress: int = Field(default=0)
    weekly_challenge_target: int = Field(default=5)
    current_week_number: int = Field(default=0)
    # Daily task tracking
    daily_tasks_completed_today: int = Field(default=0)
    daily_task_goal: int = Field(default=5)
    # Social & Ranking
    rank_this_week: int = Field(default=1)
    rank_last_week: int = Field(default=1)
    seasonal_rank: int = Field(default=1)
    # Bonuses
    daily_bonus_available: bool = Field(default=True)
    consecutive_daily_bonuses: int = Field(default=0)
    # Psychological metrics
    comeback_bonus_available: bool = Field(default=False)
    days_since_last_activity: int = Field(default=0)
    progress_decay_warning: bool = Field(default=False)

    # Variable Reward System
    luck_factor: float = Field(default=1.0)
    bonus_multiplier_active: bool = Field(default=False)
    bonus_multiplier_value: float = Field(default=1.0)
    bonus_multiplier_expires: Optional[datetime] = None

    # Preferences and Config (JSON fields)
    preferred_work_hours: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    custom_reward_config: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    use_custom_rewards: bool = Field(default=False)
    limited_time_achievements_available: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(JSON))
    completion_patterns: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    # Relationships
    achievements: List["UserAchievement"] = Relationship(back_populates="user")
    earned_coupons: List["EarnedCoupon"] = Relationship(back_populates="user")
    coupon_definitions: List["UserCouponDefinition"] = Relationship(back_populates="user")
    achievement_definitions: List["UserAchievementDefinition"] = Relationship(back_populates="user")
    objectives: List["Objective"] = Relationship(back_populates="user")
    calendars: List["Calendar"] = Relationship(back_populates="user")
    oauth_accounts: List["OAuthAccount"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"lazy": "noload", "cascade": "all, delete-orphan"}
    )

    def calculate_xp_for_next_level(self) -> int:
        return min(100 + (self.level - 1) * 20, 400)

    def add_experience(self, xp: int) -> List[int]:
        self.experience_points += xp
        self.total_experience_earned += xp
        levels_gained = []
        while self.experience_points >= self.experience_to_next_level:
            self.experience_points -= self.experience_to_next_level
            self.level += 1
            levels_gained.append(self.level)
            self.experience_to_next_level = self.calculate_xp_for_next_level()
            self.mystery_boxes_earned += 1
            self.mystery_boxes_from_levelup += 1
            self.last_level_up_date = datetime.utcnow()
        return levels_gained


class OAuthAccount(SQLModel, table=True):
    """OAuth accounts linked to users (FastAPI-Users compatible)."""
    __tablename__ = "oauth_account"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)

    oauth_name: str = Field(max_length=100)
    access_token: str = Field(max_length=1024)
    expires_at: Optional[int] = None
    refresh_token: Optional[str] = None
    account_id: str = Field(max_length=320)
    account_email: str = Field(max_length=320)

    # Relationship
    user: Optional["UserProfile"] = Relationship(
        back_populates="oauth_accounts",
        sa_relationship_kwargs={"lazy": "noload"}
    )
