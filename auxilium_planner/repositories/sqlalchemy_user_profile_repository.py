"""
SQLAlchemy-based user profile repository

This repository replaces the SQLite-based user profile repository while
maintaining complete API compatibility and preserving all existing behavior.
"""

from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from domain.models import (
    UserProfile, UserAchievement, EarnedCoupon, CustomRewardConfiguration,
    CouponType, EnergyLevel
)
from core.sqlalchemy_database import sqlalchemy_db_manager
from core.sqlalchemy_models import (
    UserProfileModel, UserAchievementModel, EarnedCouponModel
)
from core.logging_config import get_logger

class SQLAlchemyUserProfileRepository:
    """SQLAlchemy-based repository for managing user profiles with ACID guarantees"""
    
    def __init__(self):
        self.logger = get_logger("sqlalchemy_user_profile_repo")
    
    def _model_to_pydantic(self, model: UserProfileModel) -> UserProfile:
        """Convert SQLAlchemy model to Pydantic model"""
        if not model:
            return None
        
        # Convert achievements
        achievements = []
        for ach_model in model.achievements:
            achievements.append(UserAchievement(
                achievement_id=ach_model.achievement_id,
                unlocked_at=ach_model.unlocked_at
            ))
        
        # Convert coupons
        coupons = []
        for coupon_model in model.earned_coupons:
            coupon_data = {
                'id': coupon_model.id,
                'coupon_type': CouponType(coupon_model.coupon_type),
                'display_name': coupon_model.display_name,
                'earned_at': coupon_model.earned_at,
                'is_used': coupon_model.is_used,
                'expires_at': coupon_model.expiration_date or datetime.utcnow()
            }
            if coupon_model.used_at:
                coupon_data['used_at'] = coupon_model.used_at
            
            coupons.append(EarnedCoupon(**coupon_data))
        
        # Convert custom reward config
        custom_reward_config = None
        if model.custom_reward_config:
            try:
                custom_reward_config = CustomRewardConfiguration.parse_obj(model.custom_reward_config)
            except Exception as e:
                self.logger.error(f"Failed to parse custom_reward_config: {e}")
                custom_reward_config = None
        
        # Create UserProfile with all fields
        profile_data = {
            'id': model.id,
            'username': model.username,
            'created_at': model.created_at,
            'overall_score': model.overall_score,
            'current_streak_days': model.current_streak_days,
            'last_streak_check_date': model.last_streak_check_date,
            'achievements': achievements,
            'experience_points': model.experience_points,
            'level': model.level,
            'experience_to_next_level': model.experience_to_next_level,
            'total_experience_earned': model.total_experience_earned,
            'last_level_up_date': model.last_level_up_date,
            'earned_coupons': coupons,
            'total_coupons_earned': model.total_coupons_earned,
            'total_coupons_used': model.total_coupons_used,
            'favorite_coupon_types': [CouponType(ct) for ct in (model.favorite_coupon_types or [])] if model.favorite_coupon_types else [],
            'mystery_boxes_earned': model.mystery_boxes_earned,
            'mystery_boxes_opened': model.mystery_boxes_opened,
            'mystery_boxes_from_levelup': model.mystery_boxes_from_levelup,
            'mystery_box_progress': model.mystery_box_progress,
            'points_per_mystery_box': model.points_per_mystery_box,
            'longest_streak': model.longest_streak,
            'streak_multiplier': model.streak_multiplier,
            'streak_insurance_count': model.streak_insurance_count,
            'last_activity_date': model.last_activity_date,
            'daily_login_streak': model.daily_login_streak,
            'last_daily_bonus_date': model.last_daily_bonus_date,
            'weekly_challenge_completed': model.weekly_challenge_completed,
            'weekly_challenge_progress': model.weekly_challenge_progress,
            'weekly_challenge_target': model.weekly_challenge_target,
            'current_week_number': model.current_week_number,
            'luck_factor': model.luck_factor,
            'bonus_multiplier_active': model.bonus_multiplier_active,
            'bonus_multiplier_value': model.bonus_multiplier_value,
            'bonus_multiplier_expires': model.bonus_multiplier_expires,
            'custom_reward_config': custom_reward_config,
            'use_custom_rewards': model.use_custom_rewards,
            'daily_tasks_completed_today': model.daily_tasks_completed_today,
            'daily_task_goal': model.daily_task_goal,
            'weekly_tasks_completed': model.weekly_tasks_completed,
            'monthly_tasks_completed': model.monthly_tasks_completed,
            'rank_this_week': model.rank_this_week,
            'rank_last_week': model.rank_last_week,
            'seasonal_rank': model.seasonal_rank,
            'competitive_season': model.competitive_season,
            'limited_time_achievements_available': model.limited_time_achievements_available if model.limited_time_achievements_available is not None else [],
            'daily_bonus_available': model.daily_bonus_available,
            'daily_bonus_value': model.daily_bonus_value,
            'consecutive_daily_bonuses': model.consecutive_daily_bonuses,
            'near_miss_count': model.near_miss_count,
            'comeback_bonus_available': model.comeback_bonus_available,
            'perfectionist_mode': model.perfectionist_mode,
            'last_major_achievement': model.last_major_achievement,
            'days_since_last_activity': model.days_since_last_activity,
            'progress_decay_warning': model.progress_decay_warning,
            'preferred_work_hours': model.preferred_work_hours,
            'completion_patterns': model.completion_patterns,
            'timezone': model.timezone
        }
        
        return UserProfile(**profile_data)
    
    def _pydantic_to_model(self, profile: UserProfile, model: UserProfileModel = None) -> UserProfileModel:
        """Convert Pydantic model to SQLAlchemy model"""
        if model is None:
            model = UserProfileModel()
        
        # Update all fields
        model.id = profile.id
        model.username = profile.username
        model.created_at = profile.created_at
        model.overall_score = profile.overall_score
        model.current_streak_days = profile.current_streak_days
        model.last_streak_check_date = profile.last_streak_check_date
        model.experience_points = profile.experience_points
        model.level = profile.level
        model.experience_to_next_level = profile.experience_to_next_level
        model.total_experience_earned = profile.total_experience_earned
        model.last_level_up_date = profile.last_level_up_date
        model.total_coupons_earned = profile.total_coupons_earned
        model.total_coupons_used = profile.total_coupons_used
        model.favorite_coupon_types = [ct.value for ct in profile.favorite_coupon_types]
        model.mystery_boxes_earned = profile.mystery_boxes_earned
        model.mystery_boxes_opened = profile.mystery_boxes_opened
        model.mystery_boxes_from_levelup = profile.mystery_boxes_from_levelup
        model.mystery_box_progress = profile.mystery_box_progress
        model.points_per_mystery_box = profile.points_per_mystery_box
        model.longest_streak = profile.longest_streak
        model.streak_multiplier = profile.streak_multiplier
        model.streak_insurance_count = profile.streak_insurance_count
        model.last_activity_date = profile.last_activity_date
        model.daily_login_streak = profile.daily_login_streak
        model.last_daily_bonus_date = profile.last_daily_bonus_date
        model.weekly_challenge_completed = profile.weekly_challenge_completed
        model.weekly_challenge_progress = profile.weekly_challenge_progress
        model.weekly_challenge_target = profile.weekly_challenge_target
        model.current_week_number = profile.current_week_number
        model.luck_factor = profile.luck_factor
        model.bonus_multiplier_active = profile.bonus_multiplier_active
        model.bonus_multiplier_value = profile.bonus_multiplier_value
        model.bonus_multiplier_expires = profile.bonus_multiplier_expires
        model.custom_reward_config = profile.custom_reward_config.dict() if profile.custom_reward_config else None
        model.use_custom_rewards = profile.use_custom_rewards
        model.daily_tasks_completed_today = profile.daily_tasks_completed_today
        model.daily_task_goal = profile.daily_task_goal
        model.weekly_tasks_completed = profile.weekly_tasks_completed
        model.monthly_tasks_completed = profile.monthly_tasks_completed
        model.rank_this_week = profile.rank_this_week
        model.rank_last_week = profile.rank_last_week
        model.seasonal_rank = profile.seasonal_rank
        model.competitive_season = profile.competitive_season
        model.limited_time_achievements_available = profile.limited_time_achievements_available
        model.daily_bonus_available = profile.daily_bonus_available
        model.daily_bonus_value = profile.daily_bonus_value
        model.consecutive_daily_bonuses = profile.consecutive_daily_bonuses
        model.near_miss_count = profile.near_miss_count
        model.comeback_bonus_available = profile.comeback_bonus_available
        model.perfectionist_mode = profile.perfectionist_mode
        model.last_major_achievement = profile.last_major_achievement
        model.days_since_last_activity = profile.days_since_last_activity
        model.progress_decay_warning = profile.progress_decay_warning
        model.preferred_work_hours = profile.preferred_work_hours
        model.completion_patterns = profile.completion_patterns
        model.timezone = profile.timezone
        
        return model
    
    async def get_default_profile(self) -> Optional[UserProfile]:
        """Get the default user profile with all related data"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                # Get user profile with relationships
                model = session.query(UserProfileModel).first()
                
                if not model:
                    self.logger.info("👤 No user profile found, creating default profile")
                    return await self._create_default_profile()
                
                profile = self._model_to_pydantic(model)
                
                self.logger.debug(f"👤 Loading user profile: score={profile.overall_score}, "
                                f"coupons={len(profile.earned_coupons)}, "
                                f"mystery_boxes={profile.mystery_boxes_earned}")
                
                return profile
                
        except Exception as e:
            self.logger.error(f"❌ Error getting user profile: {e}")
            raise
    
    async def _create_default_profile(self) -> UserProfile:
        """Create a default user profile"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                profile = UserProfile()
                model = self._pydantic_to_model(profile)
                
                session.add(model)
                # Session will be committed by the context manager
                
                self.logger.info("👤 Created default user profile")
                return profile
                
        except Exception as e:
            self.logger.error(f"❌ Error creating default user profile: {e}")
            raise
    
    async def ensure_default_profile(self) -> UserProfile:
        """Ensure a default profile exists and return it"""
        return await self.get_default_profile()
    
    async def update_profile(self, profile: UserProfile) -> UserProfile:
        """Update user profile with transaction safety"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                # Get or create the profile model
                model = session.query(UserProfileModel).filter_by(id=profile.id).first()
                if not model:
                    model = UserProfileModel()
                    session.add(model)
                
                # Update the model with profile data
                self._pydantic_to_model(profile, model)
                
                # Clear and recreate achievements
                session.query(UserAchievementModel).filter_by(user_id=profile.id).delete()
                for achievement in profile.achievements:
                    ach_model = UserAchievementModel(
                        user_id=profile.id,
                        achievement_id=achievement.achievement_id,
                        unlocked_at=achievement.unlocked_at
                    )
                    session.add(ach_model)
                
                # Clear and recreate coupons
                session.query(EarnedCouponModel).filter_by(user_id=profile.id).delete()
                for coupon in profile.earned_coupons:
                    coupon_model = EarnedCouponModel(
                        id=coupon.id,
                        user_id=profile.id,
                        coupon_type=coupon.coupon_type.value,
                        coupon_value=coupon.coupon_type.value,
                        display_name=coupon.display_name,
                        earned_at=coupon.earned_at,
                        is_used=coupon.is_used,
                        used_at=coupon.used_at,
                        expiration_date=coupon.expires_at,
                        source="repository"
                    )
                    session.add(coupon_model)
                
                # Session will be committed by the context manager
                
                self.logger.info(f"👤 Updated user profile (score: {profile.overall_score}, streak: {profile.current_streak_days})")
                return profile
                
        except Exception as e:
            self.logger.error(f"❌ Error updating user profile: {e}")
            raise
    
    async def add_points(self, points: int) -> UserProfile:
        """Add points to user's score"""
        try:
            profile = await self.get_default_profile()
            profile.overall_score += points
            
            updated_profile = await self.update_profile(profile)
            self.logger.info(f"🎯 Added {points} points (total: {updated_profile.overall_score})")
            
            return updated_profile
            
        except Exception as e:
            self.logger.error(f"❌ Error adding points: {e}")
            raise
    
    async def update_score(self, points: int) -> UserProfile:
        """Add points to user's score (alias for add_points)"""
        return await self.add_points(points)
    
    async def update_streak(self, new_streak: int, check_date: datetime = None) -> UserProfile:
        """Update user's streak with optional specific date"""
        try:
            profile = await self.get_default_profile()
            old_streak = profile.current_streak_days
            profile.current_streak_days = new_streak
            profile.last_streak_check_date = check_date or datetime.utcnow()
            
            updated_profile = await self.update_profile(profile)
            self.logger.info(f"🔥 Streak updated: {old_streak} → {new_streak} days")
            
            return updated_profile
            
        except Exception as e:
            self.logger.error(f"❌ Error updating streak: {e}")
            raise
    
    async def add_achievement(self, achievement: UserAchievement) -> Optional[UserProfile]:
        """Add an achievement to the user profile"""
        try:
            profile = await self.get_default_profile()
            
            # Check if achievement already exists
            for ach in profile.achievements:
                if ach.achievement_id == achievement.achievement_id:
                    return profile  # Already has this achievement
            
            profile.achievements.append(achievement)
            await self.update_profile(profile)
            return profile
            
        except Exception as e:
            self.logger.error(f"❌ Error adding achievement: {e}")
            raise
    
    # Legacy methods for compatibility
    async def get(self) -> Optional[UserProfile]:
        """Legacy method - redirects to get_default_profile"""
        self.logger.debug("Legacy get() method called, redirecting to get_default_profile()")
        return await self.get_default_profile()
    
    async def create(self, profile: UserProfile) -> UserProfile:
        """Legacy method - redirects to update_profile"""
        self.logger.debug("Legacy create() method called, redirecting to update_profile()")
        return await self.update_profile(profile)
    
    async def save(self, profile: UserProfile) -> UserProfile:
        """Save a user profile (alias for update_profile)"""
        return await self.update_profile(profile)
    
    async def save_profile(self, profile: UserProfile) -> UserProfile:
        """Save a user profile (alias for update_profile)"""
        return await self.update_profile(profile)
    
    async def update(self, updates: dict) -> Optional[UserProfile]:
        """Update the user profile with specific fields"""
        try:
            profile = await self.get_default_profile()
            if not profile:
                return None
            
            # Update fields
            for key, value in updates.items():
                if hasattr(profile, key):
                    setattr(profile, key, value)
            
            await self.update_profile(profile)
            return profile
            
        except Exception as e:
            self.logger.error(f"❌ Error updating profile fields: {e}")
            raise
