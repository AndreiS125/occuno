"""
Unified SQLModel models for auxilium_planner

This module replaces both the Pydantic models (domain/models.py) and 
SQLAlchemy models (core/sqlalchemy_models.py) with a single source of truth
using SQLModel, which combines the best of both worlds.
"""

from typing import List, Optional, Dict, Any, Union
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship, JSON, Column
from sqlalchemy import Index, Text
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.types import TypeDecorator, VARCHAR
import json

# --- Enums ---
class ObjectiveType(str, Enum):
    MAIN_OBJECTIVE = "main_objective"
    SUB_OBJECTIVE = "sub_objective"
    TASK = "task"
    HABIT = "habit"

class ObjectiveStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class EnergyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# CouponType enum removed - now using per-user coupon definitions

# --- Custom Types for SQLite ---
class UUIDType(TypeDecorator):
    """Custom UUID type that stores UUIDs as strings in SQLite"""
    impl = VARCHAR
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif isinstance(value, UUID):
            return str(value)
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            return UUID(value)

class UUIDAwareJSONEncoder(json.JSONEncoder):
    """JSON encoder that handles UUID and datetime objects"""
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# --- Shared Models ---
class RecurringInfo(SQLModel):
    """Recurring information for objectives"""
    frequency: str  # "daily", "weekly", "monthly"
    interval: int = 1  # every N days/weeks/months
    days_of_week: Optional[List[int]] = None  # 0=Monday, 6=Sunday
    time_of_day: Optional[str] = None  # "09:00"
    next_occurrence: Optional[datetime] = None

# CouponDefinition class removed - replaced by UserCouponDefinition per-user system

class UserAchievementDefinition(SQLModel, table=True):
    """Per-user achievement definitions - each user can customize their achievements"""
    __tablename__ = "user_achievement_definitions"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    achievement_id: str = Field(max_length=255)  # e.g., "daily_hero"
    name: str = Field(max_length=255)  # e.g., "🦸 Daily Hero"
    description: str = Field(max_length=500)  # e.g., "Complete 3 tasks in a single day"
    criteria_code: str = Field(max_length=255)  # e.g., "daily_tasks_completed >= 3"
    icon: Optional[str] = Field(default=None, max_length=50)
    points_value: int = Field(default=0)
    is_active: bool = Field(default=True)  # User can disable achievements
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional["UserProfile"] = Relationship(back_populates="achievement_definitions")

class CustomRewardTier(SQLModel):
    """User-defined reward tier with custom segments and probabilities"""
    tier_name: str
    probability: float  # 0.0 to 1.0
    colors: List[Dict[str, str]]
    glow_color: str
    segments: List[Dict[str, Any]]

class CustomRewardConfiguration(SQLModel):
    """User's custom reward wheel configuration"""
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    configuration_name: str = "My Custom Wheel"
    is_active: bool = True
    reward_tiers: List[CustomRewardTier] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# --- Database Tables ---
class UserProfile(SQLModel, table=True):
    """User profile with gamification stats"""
    __tablename__ = "user_profile"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    username: str = Field(default="default_user", max_length=255, unique=True, index=True)
    email: Optional[str] = Field(default=None, max_length=255, unique=True, index=True)
    full_name: Optional[str] = Field(default=None, max_length=255)
    profile_picture_url: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = Field(default=None)
    is_active: bool = Field(default=True)
    
    # Authentication fields
    google_id: Optional[str] = Field(default=None, max_length=255, unique=True, index=True)
    is_email_verified: bool = Field(default=False)
    password_hash: Optional[str] = Field(default=None, max_length=255)  # For non-OAuth users
    
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
    preferred_work_hours: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(SQLiteJSON))
    custom_reward_config: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(SQLiteJSON))
    use_custom_rewards: bool = Field(default=False)
    limited_time_achievements_available: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(SQLiteJSON))
    completion_patterns: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(SQLiteJSON))
    
    # Relationships
    achievements: List["UserAchievement"] = Relationship(back_populates="user")
    earned_coupons: List["EarnedCoupon"] = Relationship(back_populates="user")
    coupon_definitions: List["UserCouponDefinition"] = Relationship(back_populates="user")
    achievement_definitions: List["UserAchievementDefinition"] = Relationship(back_populates="user")
    objectives: List["Objective"] = Relationship(back_populates="user")
    calendars: List["Calendar"] = Relationship(back_populates="user")
    
    def calculate_xp_for_next_level(self) -> int:
        """Calculate XP needed for next level based on current level."""
        return min(100 + (self.level - 1) * 20, 400)
    
    def add_experience(self, xp: int) -> List[int]:
        """Add experience points and handle level-ups. Returns list of levels gained."""
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

class Calendar(SQLModel, table=True):
    """User calendars - like Google Calendar's multiple calendars"""
    __tablename__ = "calendars"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    name: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    color: str = Field(default="#3b82f6", max_length=7)  # Hex color code
    is_default: bool = Field(default=False)
    is_visible: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional["UserProfile"] = Relationship(back_populates="calendars")
    objectives: List["Objective"] = Relationship(back_populates="calendar")

class Objective(SQLModel, table=True):
    """Unified objective/task model - now user-specific"""
    __tablename__ = "objectives"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)  # Now user-specific!
    calendar_id: Optional[UUID] = Field(default=None, foreign_key="calendars.id", sa_type=UUIDType)  # Calendar assignment
    title: str = Field(max_length=500)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    parent_id: Optional[UUID] = Field(default=None, foreign_key="objectives.id", sa_type=UUIDType)
    degree: int = Field(default=0)
    objective_type: str = Field(max_length=50)  # Store as string to avoid enum issues
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    all_day: bool = Field(default=False)
    # New: whether this objective is time-based and should appear on calendar/Gantt
    is_timed: bool = Field(default=True)
    
    priority_score: float = Field(default=0.5, ge=0.0, le=1.0)
    complexity_score: float = Field(default=0.5, ge=0.0, le=1.0)
    energy_requirement: str = Field(default="medium", max_length=20)  # Store as string to avoid enum issues
    
    status: str = Field(default="not_started", max_length=20)  # Store as string to avoid enum issues
    completion_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    
    context_tags: Optional[List[str]] = Field(default=None, sa_column=Column(SQLiteJSON))
    dependencies: Optional[List[UUID]] = Field(default=None, sa_column=Column(SQLiteJSON))
    success_criteria: Optional[List[str]] = Field(default=None, sa_column=Column(SQLiteJSON))
    
    # Gamification
    points_awarded_for_completion: int = Field(default=0)
    completion_timeliness_score: Optional[float] = None
    
    # Recurring info
    recurring: Optional[RecurringInfo] = Field(default=None, sa_column=Column(SQLiteJSON))
    
    # Task-specific fields (only used when objective_type is TASK)
    location: Optional[str] = Field(default=None, max_length=255)
    estimated_duration: Optional[float] = None  # seconds
    actual_duration: Optional[float] = None  # seconds
    actionable_steps: Optional[List[str]] = Field(default=None, sa_column=Column(SQLiteJSON))
    
    # Relationships
    user: Optional["UserProfile"] = Relationship(back_populates="objectives")
    calendar: Optional["Calendar"] = Relationship(back_populates="objectives")
    parent: Optional["Objective"] = Relationship(back_populates="children", sa_relationship_kwargs={"remote_side": "Objective.id"})
    children: List["Objective"] = Relationship(back_populates="parent", cascade_delete=True)

class UserAchievement(SQLModel, table=True):
    """User achievements"""
    __tablename__ = "user_achievements"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    achievement_id: str = Field(max_length=255)
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional[UserProfile] = Relationship(back_populates="achievements")

class UserCouponDefinition(SQLModel, table=True):
    """Per-user coupon definitions - each user can customize their own coupon types"""
    __tablename__ = "user_coupon_definitions"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    coupon_type: str = Field(max_length=50)  # e.g., "scroll_instagram"
    display_name: str = Field(max_length=255)  # e.g., "📱 Social Media"
    description: str = Field(max_length=500)  # e.g., "30 minutes of mindless scrolling"
    icon: Optional[str] = Field(default=None, max_length=50)
    duration_minutes: int = Field(default=15)
    rarity: str = Field(default="common", max_length=20)
    is_active: bool = Field(default=True)  # User can disable certain coupon types
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional[UserProfile] = Relationship(back_populates="coupon_definitions")

class EarnedCoupon(SQLModel, table=True):
    """Earned coupons"""
    __tablename__ = "earned_coupons"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    coupon_type: str = Field(max_length=50)  # Store as string to avoid enum issues
    coupon_value: str = Field(max_length=100)
    display_name: Optional[str] = Field(default=None, max_length=255)
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    is_used: bool = Field(default=False)
    used_at: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    source: Optional[str] = Field(default=None, max_length=100)
    
    # Relationships
    user: Optional[UserProfile] = Relationship(back_populates="earned_coupons")

# --- Response Models (for API) ---
class UserAchievementResponse(SQLModel):
    """Response model for user achievements"""
    achievement_id: str
    unlocked_at: datetime

class EarnedCouponResponse(SQLModel):
    """Response model for earned coupons"""
    id: UUID
    coupon_type: str
    display_name: Optional[str] = None
    earned_at: datetime
    expires_at: datetime
    used_at: Optional[datetime] = None
    is_used: bool = False

class MysteryBoxReward(SQLModel):
    """Mystery box reward response"""
    coupon_type: str
    quantity: int = 1
    bonus_multiplier: float = 1.0

class TaskCompletionResult(SQLModel):
    """Task completion result response"""
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
    """Daily bonus result response"""
    success: bool
    bonus_type: str
    coupons_earned: int
    coupon_descriptions: List[str]
    consecutive_days: int
    message: str
    extra_rewards: List[str]
    celebration: str

class ObjectiveStats(SQLModel):
    """Objective statistics response"""
    total: int
    by_status: Dict[ObjectiveStatus, int]
    by_type: Dict[ObjectiveType, int]
    completion_rate: float
    active_count: int
    blocked_count: int

# --- Create indexes for performance ---
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
