from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship, JSON, Column

from .base import UUIDType
from .shared import RecurringInfo


class Calendar(SQLModel, table=True):
    """User calendars - like Google Calendar's multiple calendars"""
    __tablename__ = "calendars"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    name: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    color: str = Field(default="#3b82f6", max_length=7)
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
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    calendar_id: Optional[UUID] = Field(default=None, foreign_key="calendars.id", sa_type=UUIDType)
    title: str = Field(max_length=500)
    description: Optional[str] = Field(default=None)
    parent_id: Optional[UUID] = Field(default=None, foreign_key="objectives.id", sa_type=UUIDType)
    degree: int = Field(default=0)
    objective_type: str = Field(max_length=50)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    all_day: bool = Field(default=False)
    is_timed: bool = Field(default=True)

    priority_score: float = Field(default=0.5, ge=0.0, le=1.0)
    complexity_score: float = Field(default=0.5, ge=0.0, le=1.0)
    energy_requirement: str = Field(default="medium", max_length=20)

    status: str = Field(default="not_started", max_length=20)
    completion_percentage: float = Field(default=0.0, ge=0.0, le=100.0)

    context_tags: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    dependencies: Optional[List[UUID]] = Field(default=None, sa_column=Column(JSON))
    success_criteria: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))

    # Gamification
    points_awarded_for_completion: int = Field(default=0)
    completion_timeliness_score: Optional[float] = None

    # Recurring info
    recurring: Optional[RecurringInfo] = Field(default=None, sa_column=Column(JSON))

    # Task-specific fields (only used when objective_type is TASK)
    location: Optional[str] = Field(default=None, max_length=255)
    estimated_duration: Optional[float] = None
    actual_duration: Optional[float] = None
    actionable_steps: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))

    # Relationships
    user: Optional["UserProfile"] = Relationship(back_populates="objectives")
    calendar: Optional[Calendar] = Relationship(back_populates="objectives")
    parent: Optional["Objective"] = Relationship(back_populates="children", sa_relationship_kwargs={"remote_side": "Objective.id"})
    children: List["Objective"] = Relationship(back_populates="parent", cascade_delete=True)
