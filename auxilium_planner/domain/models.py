from typing import List, Optional, Dict, Any, Union
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel, Field

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

# --- Gamification Models ---
class AchievementDefinition(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    description: str
    criteria_code: str  # Python code snippet or DSL to evaluate for unlocking
    icon: Optional[str] = None
    points_value: int = 0

class UserAchievement(BaseModel):
    achievement_id: UUID
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfile(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    username: str = "default_user"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Gamification
    overall_score: int = 0
    current_streak_days: int = 0
    last_streak_check_date: Optional[datetime] = None
    achievements: List[UserAchievement] = Field(default_factory=list)
    
    # Preferences & Patterns
    preferred_work_hours: Optional[Dict[str, Any]] = None

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
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    
    estimated_duration: Optional[timedelta] = None
    actual_duration: Optional[timedelta] = None
    actionable_steps: List[str] = Field(default_factory=list)

# --- Data Store Structure ---
class DataStore(BaseModel):
    user_profile: UserProfile
    objectives: List[Union[Objective, Task]] = Field(default_factory=list)
    achievement_definitions: List[AchievementDefinition] = Field(default_factory=list) 