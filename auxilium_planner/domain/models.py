from typing import List, Optional, Dict, Any, Union
from uuid import UUID, uuid4
from datetime import datetime, timedelta, date
from enum import Enum
from pydantic import BaseModel, Field, validator

# --- Enums ---
class ObjectiveType(str, Enum):
    MAIN_OBJECTIVE = "main_objective"  # A massive goal e.g. win a science fair
    SUB_OBJECTIVE = "sub_objective"  # a subobjective e.g. develop a prototype
    TASK = "task"  # Actual thing with no subobjectives, e.g. "Code the logic"
    HABIT = "habit"  # Something recurring e.g. do 20 pushups daily

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

class CouponType(str, Enum):
    JERK_OFF = "jerk_off"
    SCROLL_INSTAGRAM = "scroll_instagram"
    PLAY_GAMES = "play_games"
    WATCH_YOUTUBE = "watch_youtube"
    TAKE_NAP = "take_nap"
    EAT_SNACK = "eat_snack"
    WATCH_NETFLIX = "watch_netflix"
    BROWSE_REDDIT = "browse_reddit"
    LISTEN_MUSIC = "listen_music"
    CHAT_FRIENDS = "chat_friends"

# --- Gamification Models ---
class CouponDefinition(BaseModel):
    coupon_type: CouponType
    display_name: str
    description: str
    icon: Optional[str] = None
    duration_minutes: int = 15  # How long the activity lasts
    rarity: str = "common"  # common, uncommon, rare, epic, legendary

class EarnedCoupon(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    coupon_type: CouponType
    display_name: Optional[str] = None  # Preserve the exact name shown on the wheel
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime  # Same day expiration
    used_at: Optional[datetime] = None
    is_used: bool = False

class MysteryBoxReward(BaseModel):
    coupon_type: CouponType
    quantity: int = 1
    bonus_multiplier: float = 1.0  # For special rewards

class AchievementDefinition(BaseModel):
    id: str  # Changed from UUID to str to support custom achievement IDs
    name: str
    description: str
    criteria_code: str  # Python code snippet or DSL to evaluate for unlocking
    icon: Optional[str] = None
    points_value: int = 0

class UserAchievement(BaseModel):
    achievement_id: str  # Changed from UUID to str to match AchievementDefinition.id
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)

class CustomRewardTier(BaseModel):
    """User-defined reward tier with custom segments and probabilities."""
    tier_name: str
    probability: float  # 0.0 to 1.0
    colors: List[Dict[str, str]]  # List of color gradients
    glow_color: str
    segments: List[Dict[str, Any]]  # List of segment definitions

class CustomRewardConfiguration(BaseModel):
    """User's custom reward wheel configuration."""
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    configuration_name: str = "My Custom Wheel"
    is_active: bool = True
    reward_tiers: List[CustomRewardTier] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfile(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    username: str = "default_user"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Core Gamification
    overall_score: int = 0
    current_streak_days: int = 0
    last_streak_check_date: Optional[datetime] = None
    achievements: List[UserAchievement] = Field(default_factory=list)
    
    # XP/Level System - NEW
    experience_points: int = 0
    level: int = 1
    experience_to_next_level: int = 100  # XP needed for next level
    total_experience_earned: int = 0
    last_level_up_date: Optional[datetime] = None
    
    # Coupon System (Replaces XP/Level)
    earned_coupons: List[EarnedCoupon] = Field(default_factory=list)
    total_coupons_earned: int = 0
    total_coupons_used: int = 0
    favorite_coupon_types: List[CouponType] = Field(default_factory=list)
    
    # Mystery Box System (Now awards on level-up)
    mystery_boxes_earned: int = 0
    mystery_boxes_opened: int = 0
    mystery_boxes_from_levelup: int = 0  # Track boxes from leveling up
    
    # Legacy fields for point-based mystery boxes (keep for compatibility)
    mystery_box_progress: int = 0
    points_per_mystery_box: int = 100
    
    # Streak System Enhancement
    longest_streak: int = 0
    streak_multiplier: float = 1.0
    streak_insurance_count: int = 0  # Free "streak saves"
    last_activity_date: Optional[datetime] = None
    
    # Daily/Weekly Systems
    daily_login_streak: int = 0
    last_daily_bonus_date: Optional[datetime] = None
    weekly_challenge_completed: bool = False
    weekly_challenge_progress: int = 0
    weekly_challenge_target: int = 5
    current_week_number: int = 0
    
    # Variable Reward System
    luck_factor: float = 1.0  # Affects bonus chances
    bonus_multiplier_active: bool = False
    bonus_multiplier_value: float = 1.0
    bonus_multiplier_expires: Optional[datetime] = None
    
    # Custom Reward Configuration
    custom_reward_config: Optional[CustomRewardConfiguration] = None
    use_custom_rewards: bool = False  # Whether to use custom config or default
    
    # Progress Tracking
    daily_tasks_completed_today: int = 0
    daily_task_goal: int = 3
    weekly_tasks_completed: int = 0
    monthly_tasks_completed: int = 0
    
    # Social Competition (Simulated)
    rank_this_week: int = 1
    rank_last_week: int = 1
    seasonal_rank: int = 1
    competitive_season: int = 1
    
    # FOMO Mechanics
    limited_time_achievements_available: List[str] = Field(default_factory=list)
    daily_bonus_available: bool = True
    daily_bonus_value: int = 10
    consecutive_daily_bonuses: int = 0
    
    # Psychological Hooks
    near_miss_count: int = 0  # Almost completed challenges
    comeback_bonus_available: bool = False
    perfectionist_mode: bool = False  # All-or-nothing mentality
    last_major_achievement: Optional[datetime] = None
    
    # Progress Decay (Loss Aversion)
    days_since_last_activity: int = 0
    progress_decay_warning: bool = False
    
    # Preferences & Patterns
    preferred_work_hours: Optional[Dict[str, Any]] = None
    completion_patterns: Optional[Dict[str, Any]] = None
    
    # Personal Information
    timezone: str = "UTC"
    
    def calculate_xp_for_next_level(self) -> int:
        """Calculate XP needed for next level based on current level."""
        # XP requirement increases by 20 each level: 100, 120, 140, 160... up to max 400
        return min(100 + (self.level - 1) * 20, 400)
    
    def add_experience(self, xp: int) -> List[int]:
        """Add experience points and handle level-ups. Returns list of levels gained."""
        self.experience_points += xp
        self.total_experience_earned += xp
        
        levels_gained = []
        
        # Check for level-ups
        while self.experience_points >= self.experience_to_next_level:
            self.experience_points -= self.experience_to_next_level
            self.level += 1
            levels_gained.append(self.level)
            
            # Update XP requirement for next level
            self.experience_to_next_level = self.calculate_xp_for_next_level()
            
            # Award mystery box on level-up
            self.mystery_boxes_earned += 1
            self.mystery_boxes_from_levelup += 1
            self.last_level_up_date = datetime.utcnow()
        
        return levels_gained

# --- Core Objective Models ---
class RecurringInfo(BaseModel):
    frequency: str  # "daily", "weekly", "monthly"
    interval: int = 1  # every N days/weeks/months
    days_of_week: Optional[List[int]] = None  # 0=Monday, 6=Sunday
    time_of_day: Optional[str] = None  # "09:00"
    next_occurrence: Optional[datetime] = None

class BaseObjective(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    degree: int = 0  # Depth in hierarchy
    objective_type: ObjectiveType
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    all_day: bool = False  # Explicit all-day flag - no more datetime inference!
    
    priority_score: float = Field(default=0.5, ge=0.0, le=1.0)
    complexity_score: float = Field(default=0.5, ge=0.0, le=1.0)
    energy_requirement: EnergyLevel = EnergyLevel.MEDIUM
    
    status: ObjectiveStatus = ObjectiveStatus.NOT_STARTED
    completion_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    
    context_tags: List[str] = Field(default_factory=list)
    dependencies: List[UUID] = Field(default_factory=list)
    
    success_criteria: List[str] = Field(default_factory=list)
    
    # Gamification
    points_awarded_for_completion: int = 0
    completion_timeliness_score: Optional[float] = None
    
    # Recurring info
    recurring: Optional[RecurringInfo] = None

class Objective(BaseObjective):
    objective_type: ObjectiveType = ObjectiveType.SUB_OBJECTIVE

class Task(BaseObjective):
    objective_type: ObjectiveType = ObjectiveType.TASK
    location: Optional[str] = None
    
    estimated_duration: Optional[timedelta] = None
    actual_duration: Optional[timedelta] = None
    actionable_steps: List[str] = Field(default_factory=list)
    
    @validator('estimated_duration', pre=True)
    def parse_estimated_duration(cls, v):
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return timedelta(seconds=v)
        if isinstance(v, timedelta):
            return v
        return v
    
    @validator('actual_duration', pre=True)
    def parse_actual_duration(cls, v):
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return timedelta(seconds=v)
        if isinstance(v, timedelta):
            return v
        return v


# --- Data Store Structure ---
class DataStore(BaseModel):
    user_profile: UserProfile
    objectives: List[Union[Objective, Task]] = Field(default_factory=list)
    achievement_definitions: List[AchievementDefinition] = Field(default_factory=list)
    coupon_definitions: List[CouponDefinition] = Field(default_factory=list) 