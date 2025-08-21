"""
SQLAlchemy models for auxilium_planner

These models mirror the existing SQLite schema while providing
proper ORM capabilities and maintaining API compatibility.
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey,
    create_engine, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.types import TypeDecorator, VARCHAR
from datetime import datetime
from uuid import UUID, uuid4
import json

Base = declarative_base()

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

class JSONType(TypeDecorator):
    """Custom JSON type for SQLite with UUID support"""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return json.dumps(value, cls=UUIDAwareJSONEncoder)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return None

class UserProfileModel(Base):
    """SQLAlchemy model for user profiles"""
    __tablename__ = 'user_profile'

    id = Column(UUIDType, primary_key=True, default=uuid4)
    username = Column(String(255), nullable=False, default="default_user")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Core Gamification
    overall_score = Column(Integer, default=0)
    current_streak_days = Column(Integer, default=0)
    last_streak_check_date = Column(DateTime)
    
    # XP/Level System
    experience_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    experience_to_next_level = Column(Integer, default=100)
    total_experience_earned = Column(Integer, default=0)
    last_level_up_date = Column(DateTime)
    
    # Coupon System
    total_coupons_earned = Column(Integer, default=0)
    total_coupons_used = Column(Integer, default=0)
    favorite_coupon_types = Column(JSONType)  # List[CouponType]
    
    # Mystery Box System
    mystery_boxes_earned = Column(Integer, default=0)
    mystery_boxes_opened = Column(Integer, default=0)
    mystery_boxes_from_levelup = Column(Integer, default=0)
    mystery_box_progress = Column(Integer, default=0)
    points_per_mystery_box = Column(Integer, default=100)
    
    # Streak System Enhancement
    longest_streak = Column(Integer, default=0)
    streak_multiplier = Column(Float, default=1.0)
    streak_insurance_count = Column(Integer, default=0)
    last_activity_date = Column(DateTime)
    
    # Daily/Weekly Systems
    daily_login_streak = Column(Integer, default=0)
    last_daily_bonus_date = Column(DateTime)
    weekly_challenge_completed = Column(Boolean, default=False)
    weekly_challenge_progress = Column(Integer, default=0)
    weekly_challenge_target = Column(Integer, default=5)
    current_week_number = Column(Integer, default=0)
    
    # Variable Reward System
    luck_factor = Column(Float, default=1.0)
    bonus_multiplier_active = Column(Boolean, default=False)
    bonus_multiplier_value = Column(Float, default=1.0)
    bonus_multiplier_expires = Column(DateTime)
    
    # Custom Reward Configuration
    custom_reward_config = Column(JSONType)  # CustomRewardConfiguration
    use_custom_rewards = Column(Boolean, default=False)
    
    # Progress Tracking
    daily_tasks_completed_today = Column(Integer, default=0)
    daily_task_goal = Column(Integer, default=3)
    weekly_tasks_completed = Column(Integer, default=0)
    monthly_tasks_completed = Column(Integer, default=0)
    
    # Social Competition (Simulated)
    rank_this_week = Column(Integer, default=1)
    rank_last_week = Column(Integer, default=1)
    seasonal_rank = Column(Integer, default=1)
    competitive_season = Column(Integer, default=1)
    
    # FOMO Mechanics
    limited_time_achievements_available = Column(JSONType)  # List[str]
    daily_bonus_available = Column(Boolean, default=True)
    daily_bonus_value = Column(Integer, default=10)
    consecutive_daily_bonuses = Column(Integer, default=0)
    
    # Psychological Hooks
    near_miss_count = Column(Integer, default=0)
    comeback_bonus_available = Column(Boolean, default=False)
    perfectionist_mode = Column(Boolean, default=False)
    last_major_achievement = Column(DateTime)
    
    # Progress Decay (Loss Aversion)
    days_since_last_activity = Column(Integer, default=0)
    progress_decay_warning = Column(Boolean, default=False)
    
    # Preferences & Patterns
    preferred_work_hours = Column(JSONType)
    completion_patterns = Column(JSONType)
    timezone = Column(String(50), default="UTC")
    
    # Relationships
    achievements = relationship("UserAchievementModel", back_populates="user", cascade="all, delete-orphan")
    earned_coupons = relationship("EarnedCouponModel", back_populates="user", cascade="all, delete-orphan")

class ObjectiveModel(Base):
    """SQLAlchemy model for objectives and tasks"""
    __tablename__ = 'objectives'

    id = Column(UUIDType, primary_key=True, default=uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    parent_id = Column(UUIDType, ForeignKey('objectives.id', ondelete='CASCADE'))
    degree = Column(Integer, default=0)
    objective_type = Column(String(50), nullable=False)  # ObjectiveType enum value
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    start_date = Column(DateTime)
    due_date = Column(DateTime)
    all_day = Column(Boolean, default=False)
    
    priority_score = Column(Float, default=0.5)
    complexity_score = Column(Float, default=0.5)
    energy_requirement = Column(String(20), default='medium')  # EnergyLevel enum value
    
    status = Column(String(20), default='not_started')  # ObjectiveStatus enum value
    completion_percentage = Column(Float, default=0.0)
    
    context_tags = Column(JSONType)  # List[str]
    dependencies = Column(JSONType)  # List[UUID]
    success_criteria = Column(JSONType)  # List[str]
    
    # Gamification
    points_awarded_for_completion = Column(Integer, default=0)
    completion_timeliness_score = Column(Float)
    
    # Recurring info
    recurring = Column(JSONType)  # RecurringInfo
    
    # Task-specific fields (only used when objective_type is TASK)
    location = Column(String(255))
    estimated_duration = Column(Float)  # seconds
    actual_duration = Column(Float)  # seconds
    actionable_steps = Column(JSONType)  # List[str]
    
    # Relationships
    parent = relationship("ObjectiveModel", remote_side=[id], back_populates="children")
    children = relationship("ObjectiveModel", back_populates="parent", cascade="all, delete-orphan")

class UserAchievementModel(Base):
    """SQLAlchemy model for user achievements"""
    __tablename__ = 'user_achievements'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUIDType, ForeignKey('user_profile.id', ondelete='CASCADE'), nullable=False)
    achievement_id = Column(String(255), nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("UserProfileModel", back_populates="achievements")
    
    __table_args__ = (
        Index('idx_user_achievements_user_id', 'user_id'),
        Index('idx_user_achievements_unique', 'user_id', 'achievement_id', unique=True),
    )

class EarnedCouponModel(Base):
    """SQLAlchemy model for earned coupons"""
    __tablename__ = 'earned_coupons'

    id = Column(UUIDType, primary_key=True, default=uuid4)
    user_id = Column(UUIDType, ForeignKey('user_profile.id', ondelete='CASCADE'), nullable=False)
    coupon_type = Column(String(100), nullable=False)  # CouponType enum value
    coupon_value = Column(String(100), nullable=False)
    display_name = Column(String(255))
    earned_at = Column(DateTime, default=datetime.utcnow)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime)
    expiration_date = Column(DateTime)
    source = Column(String(100))
    
    # Relationships
    user = relationship("UserProfileModel", back_populates="earned_coupons")
    
    __table_args__ = (
        Index('idx_earned_coupons_user_id', 'user_id'),
        Index('idx_earned_coupons_is_used', 'is_used'),
    )



# Additional indexes for performance
Index('idx_objectives_parent_id', ObjectiveModel.parent_id)
Index('idx_objectives_status', ObjectiveModel.status)
Index('idx_objectives_due_date', ObjectiveModel.due_date)
Index('idx_objectives_type', ObjectiveModel.objective_type)
