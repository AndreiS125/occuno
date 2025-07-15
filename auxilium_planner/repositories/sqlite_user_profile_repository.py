from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime

from domain.models import UserProfile, UserAchievement, EarnedCoupon
from core.database import db_manager, get_db_transaction, json_serialize, json_deserialize
from core.logging_config import get_logger

class SQLiteUserProfileRepository:
    """SQLite-based repository for managing user profiles with ACID guarantees"""
    
    def __init__(self):
        self.logger = get_logger("sqlite_user_profile_repo")
    
    async def get_default_profile(self) -> Optional[UserProfile]:
        """Get the default user profile with all related data"""
        try:
            async with db_manager.get_connection() as conn:
                # Get user profile
                cursor = await conn.execute("""
                    SELECT * FROM user_profile LIMIT 1
                """)
                row = await cursor.fetchone()
                
                if not row:
                    self.logger.info("👤 No user profile found, creating default profile")
                    return await self._create_default_profile()
                
                # Convert row to dict using row keys
                profile_data = {key: row[key] for key in row.keys()}
                
                # Get achievements
                achievements = await self._get_user_achievements(conn, profile_data['id'])
                profile_data['achievements'] = achievements
                
                # Get coupons
                coupons = await self._get_user_coupons(conn, profile_data['id'])
                profile_data['earned_coupons'] = coupons
                
                # Parse JSON fields
                profile_data['preferred_work_hours'] = json_deserialize(profile_data['preferred_work_hours'])
                profile_data['completion_patterns'] = json_deserialize(profile_data['completion_patterns'])
                # Load custom_reward_config from JSON
                from domain.models import CustomRewardConfiguration
                if profile_data.get('custom_reward_config'):
                    try:
                        config_obj = json_deserialize(profile_data['custom_reward_config'])
                        if config_obj:
                            profile_data['custom_reward_config'] = CustomRewardConfiguration.parse_obj(config_obj)
                        else:
                            profile_data['custom_reward_config'] = None
                    except Exception as e:
                        self.logger.error(f"Failed to parse custom_reward_config: {e}")
                        profile_data['custom_reward_config'] = None
                else:
                    profile_data['custom_reward_config'] = None
                # Ensure use_custom_rewards is boolean
                profile_data['use_custom_rewards'] = bool(profile_data.get('use_custom_rewards', False))
                
                # Convert datetime strings back to datetime objects
                for field in ['created_at', 'last_streak_check_date', 'last_level_up_date', 
                             'last_activity_date', 'last_daily_bonus_date', 'bonus_multiplier_expires']:
                    if profile_data.get(field):
                        profile_data[field] = datetime.fromisoformat(profile_data[field])
                
                self.logger.debug(f"👤 Loading user profile: score={profile_data.get('overall_score', 0)}, "
                                f"coupons={len(profile_data.get('earned_coupons', []))}, "
                                f"mystery_boxes={profile_data.get('mystery_boxes_earned', 0)}")
                
                return UserProfile(**profile_data)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting user profile: {e}")
            raise
    
    async def _create_default_profile(self) -> UserProfile:
        """Create a default user profile"""
        async with get_db_transaction() as conn:
            profile = UserProfile()
            
            # Insert user profile
            await conn.execute("""
                INSERT INTO user_profile (
                    id, username, created_at, overall_score, current_streak_days,
                    experience_points, level, experience_to_next_level, total_experience_earned,
                    total_coupons_earned, total_coupons_used, mystery_boxes_earned,
                    mystery_boxes_opened, mystery_boxes_from_levelup, mystery_box_progress,
                    points_per_mystery_box, longest_streak, streak_multiplier, 
                    streak_insurance_count, daily_login_streak, weekly_challenge_completed,
                    weekly_challenge_progress, weekly_challenge_target, current_week_number,
                    luck_factor, bonus_multiplier_active, bonus_multiplier_value,
                    daily_tasks_completed_today, daily_task_goal, weekly_tasks_completed,
                    monthly_tasks_completed, rank_this_week, rank_last_week, seasonal_rank,
                    competitive_season, daily_bonus_available, daily_bonus_value,
                    consecutive_daily_bonuses, near_miss_count, comeback_bonus_available,
                    perfectionist_mode, days_since_last_activity, progress_decay_warning,
                    timezone, custom_reward_config, use_custom_rewards
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(profile.id), profile.username, profile.created_at.isoformat(),
                profile.overall_score, profile.current_streak_days, profile.experience_points,
                profile.level, profile.experience_to_next_level, profile.total_experience_earned,
                profile.total_coupons_earned, profile.total_coupons_used, profile.mystery_boxes_earned,
                profile.mystery_boxes_opened, profile.mystery_boxes_from_levelup, profile.mystery_box_progress,
                profile.points_per_mystery_box, profile.longest_streak, profile.streak_multiplier,
                profile.streak_insurance_count, profile.daily_login_streak, profile.weekly_challenge_completed,
                profile.weekly_challenge_progress, profile.weekly_challenge_target, profile.current_week_number,
                profile.luck_factor, profile.bonus_multiplier_active, profile.bonus_multiplier_value,
                profile.daily_tasks_completed_today, profile.daily_task_goal, profile.weekly_tasks_completed,
                profile.monthly_tasks_completed, profile.rank_this_week, profile.rank_last_week, profile.seasonal_rank,
                profile.competitive_season, profile.daily_bonus_available, profile.daily_bonus_value,
                profile.consecutive_daily_bonuses, profile.near_miss_count, profile.comeback_bonus_available,
                profile.perfectionist_mode, profile.days_since_last_activity, profile.progress_decay_warning,
                profile.timezone,
                json_serialize(profile.custom_reward_config.dict()) if profile.custom_reward_config else None,
                int(profile.use_custom_rewards)
            ))
            
            self.logger.info("👤 Created default user profile")
            return profile
    
    async def _get_user_achievements(self, conn, user_id: str) -> List[UserAchievement]:
        """Get user achievements from database"""
        cursor = await conn.execute("""
            SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?
        """, (user_id,))
        
        achievements = []
        async for row in cursor:
            achievements.append(UserAchievement(
                achievement_id=row['achievement_id'],
                unlocked_at=datetime.fromisoformat(row['unlocked_at'])
            ))
        
        return achievements
    
    async def _get_user_coupons(self, conn, user_id: str) -> List[EarnedCoupon]:
        """Get user coupons from database"""
        cursor = await conn.execute("""
            SELECT id, coupon_type, display_name, earned_at, is_used, used_at, expiration_date 
            FROM earned_coupons WHERE user_id = ?
        """, (user_id,))
        
        coupons = []
        async for row in cursor:
            coupon_data = {
                'id': UUID(row['id']),
                'coupon_type': row['coupon_type'],
                'display_name': row['display_name'],
                'earned_at': datetime.fromisoformat(row['earned_at']),
                'is_used': bool(row['is_used']),
                'expires_at': datetime.fromisoformat(row['expiration_date']) if row['expiration_date'] else datetime.utcnow()
            }
            
            if row['used_at']:
                coupon_data['used_at'] = datetime.fromisoformat(row['used_at'])
            
            coupons.append(EarnedCoupon(**coupon_data))
        
        return coupons
    
    async def ensure_default_profile(self) -> UserProfile:
        """Ensure a default profile exists and return it"""
        return await self.get_default_profile()
    
    async def update_profile(self, profile: UserProfile) -> UserProfile:
        """Update user profile with transaction safety"""
        try:
            async with get_db_transaction() as conn:
                # Update main profile
                await conn.execute("""
                    UPDATE user_profile SET
                        username = ?, overall_score = ?, current_streak_days = ?,
                        last_streak_check_date = ?, experience_points = ?, level = ?,
                        experience_to_next_level = ?, total_experience_earned = ?,
                        last_level_up_date = ?, total_coupons_earned = ?, total_coupons_used = ?,
                        mystery_boxes_earned = ?, mystery_boxes_opened = ?, mystery_boxes_from_levelup = ?,
                        mystery_box_progress = ?, points_per_mystery_box = ?, longest_streak = ?,
                        streak_multiplier = ?, streak_insurance_count = ?, last_activity_date = ?,
                        daily_login_streak = ?, last_daily_bonus_date = ?, weekly_challenge_completed = ?,
                        weekly_challenge_progress = ?, weekly_challenge_target = ?, current_week_number = ?,
                        luck_factor = ?, bonus_multiplier_active = ?, bonus_multiplier_value = ?,
                        bonus_multiplier_expires = ?, daily_tasks_completed_today = ?, daily_task_goal = ?,
                        weekly_tasks_completed = ?, monthly_tasks_completed = ?, rank_this_week = ?,
                        rank_last_week = ?, seasonal_rank = ?, competitive_season = ?,
                        daily_bonus_available = ?, daily_bonus_value = ?, consecutive_daily_bonuses = ?,
                        near_miss_count = ?, comeback_bonus_available = ?, perfectionist_mode = ?,
                        last_major_achievement = ?, days_since_last_activity = ?, progress_decay_warning = ?,
                        preferred_work_hours = ?, completion_patterns = ?, timezone = ?,
                        custom_reward_config = ?, use_custom_rewards = ?
                    WHERE id = ?
                """, (
                    profile.username, profile.overall_score, profile.current_streak_days,
                    profile.last_streak_check_date.isoformat() if profile.last_streak_check_date else None,
                    profile.experience_points, profile.level, profile.experience_to_next_level,
                    profile.total_experience_earned,
                    profile.last_level_up_date.isoformat() if profile.last_level_up_date else None,
                    profile.total_coupons_earned, profile.total_coupons_used, profile.mystery_boxes_earned,
                    profile.mystery_boxes_opened, profile.mystery_boxes_from_levelup, profile.mystery_box_progress,
                    profile.points_per_mystery_box, profile.longest_streak, profile.streak_multiplier,
                    profile.streak_insurance_count,
                    profile.last_activity_date.isoformat() if profile.last_activity_date else None,
                    profile.daily_login_streak,
                    profile.last_daily_bonus_date.isoformat() if profile.last_daily_bonus_date else None,
                    profile.weekly_challenge_completed, profile.weekly_challenge_progress,
                    profile.weekly_challenge_target, profile.current_week_number, profile.luck_factor,
                    profile.bonus_multiplier_active, profile.bonus_multiplier_value,
                    profile.bonus_multiplier_expires.isoformat() if profile.bonus_multiplier_expires else None,
                    profile.daily_tasks_completed_today, profile.daily_task_goal, profile.weekly_tasks_completed,
                    profile.monthly_tasks_completed, profile.rank_this_week, profile.rank_last_week,
                    profile.seasonal_rank, profile.competitive_season, profile.daily_bonus_available,
                    profile.daily_bonus_value, profile.consecutive_daily_bonuses, profile.near_miss_count,
                    profile.comeback_bonus_available, profile.perfectionist_mode, profile.last_major_achievement,
                    profile.days_since_last_activity, profile.progress_decay_warning,
                    json_serialize(profile.preferred_work_hours), json_serialize(profile.completion_patterns),
                    profile.timezone,
                    json_serialize(profile.custom_reward_config.dict()) if profile.custom_reward_config else None,
                    int(profile.use_custom_rewards),
                    str(profile.id)
                ))
                
                # Update achievements
                await self._update_achievements(conn, profile.id, profile.achievements)
                
                # Update coupons
                await self._update_coupons(conn, profile.id, profile.earned_coupons)
                
                self.logger.info(f"👤 Updated user profile (score: {profile.overall_score}, streak: {profile.current_streak_days})")
                return profile
                
        except Exception as e:
            self.logger.error(f"❌ Error updating user profile: {e}")
            raise
    
    async def _update_achievements(self, conn, user_id: UUID, achievements: List[UserAchievement]):
        """Update user achievements"""
        # Delete existing achievements
        await conn.execute("DELETE FROM user_achievements WHERE user_id = ?", (str(user_id),))
        
        # Insert new achievements
        for achievement in achievements:
            await conn.execute("""
                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                VALUES (?, ?, ?)
            """, (str(user_id), achievement.achievement_id, achievement.unlocked_at.isoformat()))
    
    async def _update_coupons(self, conn, user_id: UUID, coupons: List[EarnedCoupon]):
        """Update user coupons"""
        # Delete existing coupons
        await conn.execute("DELETE FROM earned_coupons WHERE user_id = ?", (str(user_id),))
        
        # Insert new coupons
        for coupon in coupons:
            await conn.execute("""
                INSERT INTO earned_coupons (id, user_id, coupon_type, coupon_value, display_name, earned_at, is_used, used_at, expiration_date, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(coupon.id), str(user_id), coupon.coupon_type.value, coupon.coupon_type.value,
                coupon.display_name,
                coupon.earned_at.isoformat(), coupon.is_used,
                coupon.used_at.isoformat() if coupon.used_at else None,
                coupon.expires_at.isoformat() if coupon.expires_at else None,
                "repository"  # Set source as repository
            ))
    
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