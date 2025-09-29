from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship

from .base import UUIDType


class UserAchievementDefinition(SQLModel, table=True):
    """Per-user achievement definitions - each user can customize their achievements"""
    __tablename__ = "user_achievement_definitions"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    achievement_id: str = Field(max_length=255)
    name: str = Field(max_length=255)
    description: str = Field(max_length=500)
    criteria_code: str = Field(max_length=255)
    icon: Optional[str] = Field(default=None, max_length=50)
    points_value: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["UserProfile"] = Relationship(back_populates="achievement_definitions")


class UserAchievement(SQLModel, table=True):
    """User achievements"""
    __tablename__ = "user_achievements"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    achievement_id: str = Field(max_length=255)
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["UserProfile"] = Relationship(back_populates="achievements")


class UserCouponDefinition(SQLModel, table=True):
    """Per-user coupon definitions - each user can customize their own coupon types"""
    __tablename__ = "user_coupon_definitions"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    coupon_type: str = Field(max_length=50)
    display_name: str = Field(max_length=255)
    description: str = Field(max_length=500)
    icon: Optional[str] = Field(default=None, max_length=50)
    duration_minutes: int = Field(default=15)
    rarity: str = Field(default="common", max_length=20)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["UserProfile"] = Relationship(back_populates="coupon_definitions")


class EarnedCoupon(SQLModel, table=True):
    """Earned coupons"""
    __tablename__ = "earned_coupons"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True, sa_type=UUIDType)
    user_id: UUID = Field(foreign_key="user_profile.id", sa_type=UUIDType)
    coupon_type: str = Field(max_length=50)
    coupon_value: str = Field(max_length=100)
    display_name: Optional[str] = Field(default=None, max_length=255)
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    is_used: bool = Field(default=False)
    used_at: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    source: Optional[str] = Field(default=None, max_length=100)

    # Relationships
    user: Optional["UserProfile"] = Relationship(back_populates="earned_coupons")
