import random
import logging
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from dataclasses import dataclass

from core.config import settings
from domain.models import (
    UserProfile, ObjectiveStatus, CouponType, CouponDefinition, 
    EarnedCoupon, MysteryBoxReward, AchievementDefinition,
    ObjectiveType, UserAchievement
)
from repositories.user_profile_repository import UserProfileRepository
from repositories.objective_repository import ObjectiveRepository

class GamificationService:
    """Service for managing coupon-based gamification system with real-world rewards."""
    
    def __init__(self):
        self.user_repo = UserProfileRepository()
        self.objective_repo = ObjectiveRepository()
        self._achievement_definitions = self._load_achievement_definitions()
        self._coupon_definitions = self._load_coupon_definitions()
    
    def _load_coupon_definitions(self) -> List[CouponDefinition]:
        """Load all available coupon types with their properties."""
        return [
            CouponDefinition(
                coupon_type=CouponType.JERK_OFF,
                display_name="🍆 Jerk Off",
                description="15 minutes of self-pleasure time",
                duration_minutes=15,
                rarity="uncommon"
            ),
            CouponDefinition(
                coupon_type=CouponType.SCROLL_INSTAGRAM,
                display_name="📱 Scroll Instagram",
                description="30 minutes of mindless scrolling",
                duration_minutes=30,
                rarity="common"
            ),
            CouponDefinition(
                coupon_type=CouponType.PLAY_GAMES,
                display_name="🎮 Play Games",
                description="45 minutes of gaming time",
                duration_minutes=45,
                rarity="rare"
            ),
            CouponDefinition(
                coupon_type=CouponType.WATCH_YOUTUBE,
                display_name="📺 Watch YouTube",
                description="30 minutes of YouTube videos",
                duration_minutes=30,
                rarity="common"
            ),
            CouponDefinition(
                coupon_type=CouponType.TAKE_NAP,
                display_name="😴 Take Nap",
                description="30 minute power nap",
                duration_minutes=30,
                rarity="uncommon"
            ),
            CouponDefinition(
                coupon_type=CouponType.EAT_SNACK,
                display_name="🍿 Eat Snack",
                description="Guilt-free snack time",
                duration_minutes=15,
                rarity="common"
            ),
            CouponDefinition(
                coupon_type=CouponType.WATCH_NETFLIX,
                display_name="📺 Watch Netflix",
                description="60 minutes of Netflix binge",
                duration_minutes=60,
                rarity="rare"
            ),
            CouponDefinition(
                coupon_type=CouponType.BROWSE_REDDIT,
                display_name="🔍 Browse Reddit",
                description="30 minutes of Reddit browsing",
                duration_minutes=30,
                rarity="common"
            ),
            CouponDefinition(
                coupon_type=CouponType.LISTEN_MUSIC,
                display_name="🎵 Listen Music",
                description="30 minutes of music time",
                duration_minutes=30,
                rarity="common"
            ),
            CouponDefinition(
                coupon_type=CouponType.CHAT_FRIENDS,
                display_name="💬 Chat Friends",
                description="45 minutes of social time",
                duration_minutes=45,
                rarity="uncommon"
            )
        ]
    
    def _load_achievement_definitions(self) -> List[AchievementDefinition]:
        """Load achievement definitions updated for coupon system."""
        return [
            # Common Achievements
            AchievementDefinition(
                id="first_steps",
                name="🌟 First Steps",
                description="Your journey begins! Complete your first task",
                criteria_code="completed_tasks >= 1",
                points_value=50
            ),
            AchievementDefinition(
                id="coupon_collector",
                name="🎫 Coupon Collector", 
                description="Earn your first 5 coupons",
                criteria_code="total_coupons_earned >= 5",
                points_value=75
            ),
            AchievementDefinition(
                id="daily_hero",
                name="🦸 Daily Hero",
                description="Complete 3 tasks in a single day",
                criteria_code="daily_tasks_today >= 3",
                points_value=100
            ),
            
            # Rare Achievements
            AchievementDefinition(
                id="streak_master",
                name="🔥 Streak Master",
                description="Maintain a 7-day streak (Rare)",
                criteria_code="current_streak >= 7",
                points_value=300
            ),
            AchievementDefinition(
                id="task_crusher",
                name="💪 Task Crusher", 
                description="Complete 25 tasks (Rare)",
                criteria_code="completed_tasks >= 25",
                points_value=500
            ),
            AchievementDefinition(
                id="coupon_master",
                name="🎭 Coupon Master",
                description="Earn 50 coupons (Rare)",
                criteria_code="total_coupons_earned >= 50",
                points_value=400
            ),
            
            # Epic Achievements
            AchievementDefinition(
                id="mystery_box_legend",
                name="📦 Mystery Box Legend",
                description="Open 20 mystery boxes (Epic)",
                criteria_code="mystery_boxes_opened >= 20",
                points_value=1000
            ),
            AchievementDefinition(
                id="streak_legend",
                name="🌟 Streak Legend",
                description="Maintain a 30-day streak (Epic)",
                criteria_code="current_streak >= 30",
                points_value=2000
            ),
            AchievementDefinition(
                id="indulgence_master",
                name="🏆 Indulgence Master",
                description="Use 100 coupons (Epic)",
                criteria_code="total_coupons_used >= 100",
                points_value=1500
            ),
            
            # Limited-Time Achievements
            AchievementDefinition(
                id="weekend_warrior",
                name="⚔️ Weekend Warrior",
                description="Complete 5 tasks during weekend (Limited Time!)",
                criteria_code="weekend_tasks >= 5",
                points_value=250
            ),
            AchievementDefinition(
                id="midnight_grinder",
                name="🌙 Midnight Grinder",
                description="Complete a task after 11 PM (Limited Time!)",
                criteria_code="late_night_tasks >= 1",
                points_value=150
            )
        ]
    
    def _create_coupon_with_expiration(self, coupon_type: CouponType, bonus_multiplier: float = 1.0) -> EarnedCoupon:
        """Create a coupon with reasonable expiration time."""
        now = datetime.utcnow()
        
        # Calculate minimum viable expiration (12 hours from now)
        minimum_expiration = now + timedelta(hours=12)
        
        # Set expiration to end of current day (11:59 PM)
        end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # If end of day is less than 12 hours away, extend to next day
        if end_of_day < minimum_expiration:
            # Give them until end of next day instead
            next_day = now + timedelta(days=1)
            end_of_day = next_day.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        return EarnedCoupon(
            coupon_type=coupon_type,
            earned_at=now,
            expires_at=end_of_day,
            is_used=False
        )
    
    def _get_random_coupon_type(self, rarity_boost: float = 1.0) -> CouponType:
        """Get a random coupon type based on rarity weights."""
        # Define rarity weights (higher = more common)
        weights = {
            "common": 60,
            "uncommon": 25,
            "rare": 12,
            "epic": 2,
            "legendary": 1
        }
        
        # Apply rarity boost
        if rarity_boost > 1.0:
            weights["rare"] = int(weights["rare"] * rarity_boost)
            weights["epic"] = int(weights["epic"] * rarity_boost)
            weights["legendary"] = int(weights["legendary"] * rarity_boost)
        
        # Create weighted list
        weighted_coupons = []
        for coupon_def in self._coupon_definitions:
            weight = weights.get(coupon_def.rarity, 1)
            weighted_coupons.extend([coupon_def.coupon_type] * weight)
        
        return random.choice(weighted_coupons)
    
    def _map_to_backend_coupon_type(self, frontend_coupon_type: str) -> CouponType:
        """Map frontend coupon types to existing backend CouponType enum values."""
        # Direct mappings for frontend types that match backend types
        direct_mappings = {
            "watch_youtube": CouponType.WATCH_YOUTUBE,
            "scroll_instagram": CouponType.SCROLL_INSTAGRAM,
            "play_games": CouponType.PLAY_GAMES,
            "take_nap": CouponType.TAKE_NAP,
            "power_nap": CouponType.TAKE_NAP,
            "eat_snack": CouponType.EAT_SNACK,
            "snack_break": CouponType.EAT_SNACK,
            "browse_reddit": CouponType.BROWSE_REDDIT,
            "listen_music": CouponType.LISTEN_MUSIC,
            "chat_friends": CouponType.CHAT_FRIENDS,
        }
        
        # Check for direct mapping first
        if frontend_coupon_type in direct_mappings:
            return direct_mappings[frontend_coupon_type]
        
        # Intelligent mappings for new frontend types
        intelligent_mappings = {
            # Gaming related
            "game_marathon": CouponType.PLAY_GAMES,
            "retro_gaming": CouponType.PLAY_GAMES,
            
            # Entertainment related  
            "movie_marathon": CouponType.WATCH_NETFLIX,
            "watch_netflix": CouponType.WATCH_NETFLIX,
            
            # Social/Media related
            "social_media": CouponType.SCROLL_INSTAGRAM,
            "music_session": CouponType.LISTEN_MUSIC,
            "one_song": CouponType.LISTEN_MUSIC,
            
            # Food related
            "food_festival": CouponType.EAT_SNACK,
            "coffee_break": CouponType.EAT_SNACK,
            
            # Relaxation related
            "mini_meditation": CouponType.TAKE_NAP,
            "short_walk": CouponType.TAKE_NAP,
            
            # Reading/Learning
            "quick_read": CouponType.BROWSE_REDDIT,
            "check_email": CouponType.BROWSE_REDDIT,
            
            # Creative
            "creative_time": CouponType.LISTEN_MUSIC,
        }
        
        if frontend_coupon_type in intelligent_mappings:
            return intelligent_mappings[frontend_coupon_type]
        
        # Fallback to most common coupon type for unknown types
        logging.warning(f"Unknown frontend coupon type: {frontend_coupon_type}, falling back to SCROLL_INSTAGRAM")
        return CouponType.SCROLL_INSTAGRAM
    
    async def process_task_completion(self, task_id: UUID) -> Dict[str, Any]:
        """Process task completion with XP rewards only (no coupons)."""
        task = await self.objective_repo.get_by_id(task_id)
        if not task or task.status != ObjectiveStatus.COMPLETED:
            return {"success": False, "message": "Task not found or not completed"}
        
        user_profile = await self.user_repo.ensure_default_profile()
        
        # === XP CALCULATION FOR TASKS ===
        base_xp = settings.points_per_task if hasattr(settings, 'points_per_task') else 25
        
        # Calculate XP bonuses
        complexity_bonus = int(base_xp * task.complexity_score * 0.5)  # 50% of objective bonus
        priority_bonus = int(base_xp * task.priority_score * 0.5)
        
        # Timeliness bonus for tasks
        timeliness_xp_bonus = 0
        if task.due_date:
            now = datetime.utcnow().replace(tzinfo=task.due_date.tzinfo) if task.due_date.tzinfo else datetime.utcnow()
            task_due = task.due_date.replace(tzinfo=None) if task.due_date.tzinfo else task.due_date
            now_naive = now.replace(tzinfo=None) if now.tzinfo else now
            
            days_early = (task_due - now_naive).days
            if days_early > 0:
                timeliness_xp_bonus = min(days_early * 10, base_xp // 2)  # Up to 50% bonus for early completion
        
        # Calculate total XP for task
        total_task_xp = int(base_xp + complexity_bonus + priority_bonus + timeliness_xp_bonus)
        
        # Apply streak multiplier
        if user_profile.current_streak_days >= 7:
            streak_multiplier = 1.0 + (user_profile.current_streak_days * 0.02)  # 2% per day for tasks
            total_task_xp = int(total_task_xp * streak_multiplier)
        
        # === AWARD XP AND HANDLE LEVEL-UPS ===
        old_level = user_profile.level
        levels_gained = user_profile.add_experience(total_task_xp)
        
        # === NO COUPON EARNING - ONLY XP ===
        # Coupons are only earned through mystery boxes from leveling up
        
        # === TIMELINESS TRACKING ===
        urgency_message = ""
        if task.due_date:
            now = datetime.utcnow().replace(tzinfo=task.due_date.tzinfo) if task.due_date.tzinfo else datetime.utcnow()
            task_due = task.due_date.replace(tzinfo=None) if task.due_date.tzinfo else task.due_date
            now_naive = now.replace(tzinfo=None) if now.tzinfo else now
            
            days_early = (task_due - now_naive).days
            if days_early > 0:
                urgency_message = f"⚡ Early completion bonus: +{timeliness_xp_bonus} XP!"
                task.completion_timeliness_score = 1.0
            elif days_early < 0:  # Late but still completed
                urgency_message = "⚠️ Late completion, but good job not giving up!"
                task.completion_timeliness_score = -0.5
        
        # === LEGACY MYSTERY BOX PROGRESS (Keep for compatibility) ===
        base_points = settings.points_per_task if hasattr(settings, 'points_per_task') else 25
        user_profile.mystery_box_progress += base_points
        mystery_box_earned = False
        
        if user_profile.mystery_box_progress >= user_profile.points_per_mystery_box:
            user_profile.mystery_box_progress = 0
            user_profile.mystery_boxes_earned += 1
            # Increase next mystery box requirement linearly
            user_profile.points_per_mystery_box += 25
            mystery_box_earned = True
        
        # === DAILY PROGRESS TRACKING ===
        user_profile.daily_tasks_completed_today += 1
        daily_goal_progress = user_profile.daily_tasks_completed_today / user_profile.daily_task_goal
        
        # Update score for points-based systems
        user_profile.overall_score += base_points
        
        # === ACHIEVEMENT CHECKING ===
        unlocked_achievements = await self._check_achievements(user_profile)
        
        # Add achievement XP bonus
        achievement_xp = len(unlocked_achievements) * 50
        if achievement_xp > 0:
            user_profile.add_experience(achievement_xp)
        
        # === STREAK UPDATE ===
        streak_result = await self._update_streak_system(user_profile)
        
        # === WEEKLY CHALLENGE PROGRESS ===
        weekly_progress = await self._update_weekly_challenge(user_profile)
        
        # === EXPIRE OLD COUPONS ===
        await self._expire_old_coupons(user_profile)
        
        # Save updated profile
        await self.user_repo.save_profile(user_profile)
        
        # === RESPONSE (XP ONLY) ===
        return {
            "success": True,
            # XP System
            "xp_earned": total_task_xp,
            "achievement_xp": achievement_xp,
            "total_xp_earned": total_task_xp + achievement_xp,
            "xp_breakdown": {
                "base_xp": base_xp,
                "complexity_bonus": complexity_bonus,
                "priority_bonus": priority_bonus,
                "timeliness_bonus": timeliness_xp_bonus,
                "achievement_bonus": achievement_xp
            },
            "level_info": {
                "current_level": user_profile.level,
                "current_xp": user_profile.experience_points,
                "xp_to_next_level": user_profile.experience_to_next_level,
                "levels_gained": levels_gained,
                "leveled_up": len(levels_gained) > 0
            },
            "mystery_boxes_earned": len(levels_gained),  # Boxes from level-up
            
            # NO COUPON DATA - Only XP
            "urgency_message": urgency_message,
            "points_awarded": base_points,
            "current_coupons": len([c for c in user_profile.earned_coupons if not c.is_used]),
            "total_coupons_earned": user_profile.total_coupons_earned,
            "daily_progress": {
                "completed": user_profile.daily_tasks_completed_today,
                "goal": user_profile.daily_task_goal,
                "percentage": min(daily_goal_progress * 100, 100)
            },
            "mystery_box_progress": {
                "current": user_profile.mystery_box_progress,
                "needed": user_profile.points_per_mystery_box,
                "earned": mystery_box_earned
            },
            "mystery_boxes_available": user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened,
            "unlocked_achievements": unlocked_achievements,
            "streak": streak_result,
            "weekly_challenge": weekly_progress,
            
            # Celebration message (XP only)
            "celebration": f"🎯 TASK COMPLETE! +{total_task_xp} XP earned!"
        }
    
    async def _expire_old_coupons(self, user_profile: UserProfile) -> None:
        """Remove expired coupons from user profile."""
        now = datetime.utcnow()
        expired_count = 0
        
        # Remove expired coupons
        active_coupons = []
        for coupon in user_profile.earned_coupons:
            if coupon.expires_at > now:
                active_coupons.append(coupon)
            else:
                expired_count += 1
        
        user_profile.earned_coupons = active_coupons
        
        if expired_count > 0:
            print(f"🗑️ Expired {expired_count} coupons")
    
    async def use_coupon(self, coupon_id: UUID) -> Dict[str, Any]:
        """Use a coupon to redeem the reward."""
        user_profile = await self.user_repo.ensure_default_profile()
        
        # Find the coupon
        coupon = None
        for c in user_profile.earned_coupons:
            if c.id == coupon_id and not c.is_used:
                coupon = c
                break
        
        if not coupon:
            return {"success": False, "message": "Coupon not found or already used"}
        
        # Check if expired
        if coupon.expires_at < datetime.utcnow():
            return {"success": False, "message": "Coupon has expired"}
        
        # Mark as used
        coupon.is_used = True
        coupon.used_at = datetime.utcnow()
        user_profile.total_coupons_used += 1
        
        # Get coupon definition
        coupon_def = next((c for c in self._coupon_definitions if c.coupon_type == coupon.coupon_type), None)
        
        # Save profile
        await self.user_repo.save_profile(user_profile)
        
        return {
            "success": True,
            "message": f"Enjoy your {coupon_def.display_name if coupon_def else 'reward'}!",
            "coupon_name": coupon_def.display_name if coupon_def else "Unknown",
            "duration_minutes": coupon_def.duration_minutes if coupon_def else 15,
            "celebration": f"🎉 {coupon_def.display_name if coupon_def else 'Reward'} activated!"
        }
    
    async def open_mystery_box(self, frontend_choice: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Open a mystery box with coupon rewards (wheel-like system)."""
        user_profile = await self.user_repo.ensure_default_profile()
        
        available_boxes = user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened
        if available_boxes <= 0:
            return {"success": False, "message": "No mystery boxes available"}
        
        user_profile.mystery_boxes_opened += 1
        
        coupons_earned = []
        reward_type = "COMMON"
        reward_description = "✨ Common Coupon!"
        
        if frontend_choice and frontend_choice.get("coupon_type"):
            # FRONTEND CHOICE SYSTEM: Use frontend wheel decision
            choice_type = frontend_choice.get("coupon_type")
            choice_name = frontend_choice.get("display_name", choice_type.replace('_', ' ').title())
            
            # Handle special case for no reward
            if choice_type == "no_reward":
                reward_type = "EMPTY"
                reward_description = "Empty box! Better luck next time!"
                coupons_earned = []
            else:
                # Create dynamic coupon for any frontend choice
                # Try to find existing coupon definition first
                existing_coupon_def = None
                for coupon_def in self._coupon_definitions:
                    if coupon_def.coupon_type.value == choice_type:
                        existing_coupon_def = coupon_def
                        break
                
                if existing_coupon_def:
                    # Use existing backend coupon type
                    coupon = self._create_coupon_with_expiration(existing_coupon_def.coupon_type)
                    display_name = existing_coupon_def.display_name
                    duration = existing_coupon_def.duration_minutes
                else:
                    # Create dynamic coupon for new frontend types
                    # Map to a reasonable backend type or create generic one
                    backend_coupon_type = self._map_to_backend_coupon_type(choice_type)
                    coupon = self._create_coupon_with_expiration(backend_coupon_type)
                    display_name = choice_name
                    duration = frontend_choice.get("duration", 30)  # Default 30 min
                
                coupons_earned.append(coupon)
                reward_type = "WHEEL_CHOICE"
                reward_description = f"🎉 {display_name}!"
            
            logging.info(f"Mystery box opened with frontend choice: {choice_type} -> {reward_description}")
            
        else:
            # Legacy random system for backwards compatibility
            # WARNING: This should only be used for non-wheel mystery boxes
            logging.warning("Mystery box opened without frontend choice - using legacy random system")
            coupons_earned = []
            roll = random.random()
            
            if roll < 0.01:  # 1% - LEGENDARY (3-5 rare coupons)
                coupon_count = random.randint(3, 5)
                for _ in range(coupon_count):
                    coupon_type = self._get_random_coupon_type(rarity_boost=3.0)
                    coupon = self._create_coupon_with_expiration(coupon_type)
                    coupons_earned.append(coupon)
                reward_type = "LEGENDARY"
                reward_description = f"💎 LEGENDARY! {coupon_count} Premium Coupons!"
            elif roll < 0.05:  # 5% - Epic (2-3 good coupons)
                coupon_count = random.randint(2, 3)
                for _ in range(coupon_count):
                    coupon_type = self._get_random_coupon_type(rarity_boost=2.0)
                    coupon = self._create_coupon_with_expiration(coupon_type)
                    coupons_earned.append(coupon)
                reward_type = "EPIC"
                reward_description = f"⭐ Epic! {coupon_count} Great Coupons!"
            elif roll < 0.20:  # 20% - Rare (1-2 uncommon coupons)
                coupon_count = random.randint(1, 2)
                for _ in range(coupon_count):
                    coupon_type = self._get_random_coupon_type(rarity_boost=1.5)
                    coupon = self._create_coupon_with_expiration(coupon_type)
                    coupons_earned.append(coupon)
                reward_type = "RARE"
                reward_description = f"🎁 Rare! {coupon_count} Good Coupon{'s' if coupon_count > 1 else ''}!"
            else:  # 75% - Common (1 common coupon)
                coupon_type = self._get_random_coupon_type()
                coupon = self._create_coupon_with_expiration(coupon_type)
                coupons_earned.append(coupon)
                reward_type = "COMMON"
                reward_description = "✨ Common Coupon!"
            
            # Sometimes give streak insurance instead (5% chance)
            if roll > 0.95 and user_profile.streak_insurance_count < 3:
                user_profile.streak_insurance_count += 1
                reward_description = "🛡️ SPECIAL: Streak Insurance! Protects your streak once."
                coupons_earned = []  # No coupons, just insurance
        
        # Add coupons to profile (if any earned)
        if coupons_earned:
            for coupon in coupons_earned:
                user_profile.earned_coupons.append(coupon)
                user_profile.total_coupons_earned += 1
        
        await self.user_repo.save_profile(user_profile)
        
        # Prepare coupon descriptions
        coupon_descriptions = []
        for coupon in coupons_earned:
            coupon_def = next((c for c in self._coupon_definitions if c.coupon_type == coupon.coupon_type), None)
            if coupon_def:
                coupon_descriptions.append(f"{coupon_def.display_name} ({coupon_def.duration_minutes}min)")
        
        # Get the actual coupon types for wheel synchronization
        coupon_types_earned = []
        for coupon in coupons_earned:
            coupon_def = next((c for c in self._coupon_definitions if c.coupon_type == coupon.coupon_type), None)
            if coupon_def:
                coupon_types_earned.append(coupon.coupon_type.value)
        
        # Select a primary coupon for wheel display (first one if multiple)
        primary_coupon_type = coupon_types_earned[0] if coupon_types_earned else None
        
        return {
            "success": True,
            "reward_type": reward_type,
            "reward_description": reward_description,
            "coupons_earned": len(coupons_earned),
            "coupon_descriptions": coupon_descriptions,
            "boxes_remaining": user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened,
            "celebration": f"🎉 {reward_description}",
            "wheel_result": {
                "segment": reward_type,
                "coupons": coupon_descriptions,
                "primary_coupon_type": primary_coupon_type,
                "all_coupon_types": coupon_types_earned
            }
        }
    
    async def _update_streak_system(self, user_profile: UserProfile) -> Dict[str, Any]:
        """Enhanced streak system with insurance and psychological pressure."""
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Check if streak should continue
        if not user_profile.last_activity_date:
            user_profile.current_streak_days = 1
            user_profile.streak_multiplier = 1.1
        else:
            days_since = (now.date() - user_profile.last_activity_date.date()).days
            
            if days_since == 0:
                # Same day, no change
                pass
            elif days_since == 1:
                # Consecutive day - extend streak
                user_profile.current_streak_days += 1
                user_profile.streak_multiplier = min(user_profile.streak_multiplier + 0.1, 3.0)
                
                # Update longest streak
                if user_profile.current_streak_days > user_profile.longest_streak:
                    user_profile.longest_streak = user_profile.current_streak_days
            else:
                # Streak broken - use insurance if available
                if user_profile.streak_insurance_count > 0:
                    user_profile.streak_insurance_count -= 1
                    streak_message = f"🛡️ Streak saved by insurance! ({user_profile.streak_insurance_count} saves left)"
                else:
                    # Streak lost - trigger loss aversion
                    old_streak = user_profile.current_streak_days
                    user_profile.current_streak_days = 1
                    user_profile.streak_multiplier = 1.1
                    user_profile.comeback_bonus_available = True  # Encourage return
                    
                    streak_message = f"💔 Streak lost! You had {old_streak} days. Comeback bonus is waiting for you!"
        
        user_profile.last_activity_date = now
        user_profile.last_streak_check_date = now  # Fix: Update the streak check date
        
        # Award streak insurance at certain milestones
        if user_profile.current_streak_days in [7, 14, 30] and user_profile.streak_insurance_count < 3:
            user_profile.streak_insurance_count += 1
        
        return {
            "current_streak": user_profile.current_streak_days,
            "longest_streak": user_profile.longest_streak,
            "streak_multiplier": user_profile.streak_multiplier,
            "insurance_saves": user_profile.streak_insurance_count,
            "streak_message": locals().get('streak_message', f"🔥 {user_profile.current_streak_days} day streak!")
        }
    
    async def _update_weekly_challenge(self, user_profile: UserProfile) -> Dict[str, Any]:
        """Weekly challenges with urgency and variable targets."""
        current_week = datetime.utcnow().isocalendar()[1]
        
        # New week = new challenge
        if current_week != user_profile.current_week_number:
            user_profile.current_week_number = current_week
            user_profile.weekly_challenge_completed = False
            user_profile.weekly_challenge_progress = 0
            
            # Variable challenge targets (3-8 tasks)
            base_target = 5
            # Use total coupons earned instead of level for challenge difficulty
            coupon_modifier = user_profile.total_coupons_earned // 10  # Harder challenges as you earn more coupons
            randomness = random.randint(-2, 3)
            user_profile.weekly_challenge_target = max(3, base_target + coupon_modifier + randomness)
        
        # Update progress
        user_profile.weekly_challenge_progress += 1
        
        # Check completion - Award XP bonus instead of coupons
        challenge_completed = user_profile.weekly_challenge_progress >= user_profile.weekly_challenge_target
        if challenge_completed and not user_profile.weekly_challenge_completed:
            user_profile.weekly_challenge_completed = True
            # Award XP for weekly challenge completion instead of coupons
            bonus_xp = 100  # Weekly challenge completion bonus
            user_profile.add_experience(bonus_xp)
            user_profile.overall_score += bonus_xp
        
        # Generate urgency message
        days_left = 7 - datetime.utcnow().weekday()
        progress_pct = (user_profile.weekly_challenge_progress / user_profile.weekly_challenge_target) * 100
        
        if challenge_completed:
            urgency_message = "🏆 Weekly challenge completed! +100 XP earned!"
        elif days_left <= 2 and progress_pct < 80:
            urgency_message = f"⚠️ Only {days_left} days left! You're {user_profile.weekly_challenge_target - user_profile.weekly_challenge_progress} tasks away!"
        elif progress_pct >= 80:
            urgency_message = f"🎯 Almost there! Just {user_profile.weekly_challenge_target - user_profile.weekly_challenge_progress} more!"
        else:
            urgency_message = f"📈 Weekly progress: {user_profile.weekly_challenge_progress}/{user_profile.weekly_challenge_target}"
        
        return {
            "progress": user_profile.weekly_challenge_progress,
            "target": user_profile.weekly_challenge_target,
            "completed": user_profile.weekly_challenge_completed,
            "days_remaining": days_left,
            "urgency_message": urgency_message,
            "progress_percentage": min(progress_pct, 100)
        }
    
    async def _check_achievements(self, user_profile: UserProfile) -> List[Dict[str, Any]]:
        """Achievement system updated for coupon system."""
        unlocked = []
        
        # Get current stats
        all_objectives = await self.objective_repo.get_all()
        completed_tasks = len([
            obj for obj in all_objectives 
            if obj.objective_type == ObjectiveType.TASK and obj.status == ObjectiveStatus.COMPLETED
        ])
        
        # Build evaluation context for coupon system
        context = {
            "completed_tasks": completed_tasks,
            "total_coupons_earned": user_profile.total_coupons_earned,
            "total_coupons_used": user_profile.total_coupons_used,
            "current_streak": user_profile.current_streak_days,
            "daily_tasks_today": user_profile.daily_tasks_completed_today,
            "mystery_boxes_opened": user_profile.mystery_boxes_opened,
            "early_completions": 5,  # Placeholder - would track this
            "quick_completions": 3,  # Placeholder - would track this
            "weekend_tasks": 2,  # Placeholder - would track this
            "late_night_tasks": 1,  # Placeholder - would track this
            "max_decomposition": 5  # Placeholder - would calculate this
        }
        
        # Check each achievement
        for achievement_def in self._achievement_definitions:
            # Skip if already unlocked
            if any(ach.achievement_id == achievement_def.id for ach in user_profile.achievements):
                continue
            
            # Simple criteria evaluation
            criteria_met = self._evaluate_achievement_criteria(achievement_def.criteria_code, context)
            
            if criteria_met:
                # Unlock with fanfare
                new_achievement = UserAchievement(
                    achievement_id=achievement_def.id,
                    unlocked_at=datetime.utcnow()
                )
                user_profile.achievements.append(new_achievement)
                user_profile.overall_score += achievement_def.points_value
                
                # Award XP for achievement instead of coupon
                achievement_xp_bonus = achievement_def.points_value
                user_profile.add_experience(achievement_xp_bonus)
                
                # Determine rarity message
                rarity = "Common"
                if "Rare" in achievement_def.description:
                    rarity = "⭐ RARE"
                elif "Epic" in achievement_def.description:
                    rarity = "💎 EPIC"
                elif "Limited Time" in achievement_def.description:
                    rarity = "⏰ LIMITED"
                
                unlocked.append({
                    "name": achievement_def.name,
                    "description": achievement_def.description,
                    "points": achievement_def.points_value,
                    "rarity": rarity,
                    "xp_earned": achievement_xp_bonus,
                    "celebration": f"🎉 Achievement Unlocked: {achievement_def.name}!"
                })
        
        return unlocked
    
    def _evaluate_achievement_criteria(self, criteria: str, context: Dict[str, Any]) -> bool:
        """Safe evaluation of achievement criteria."""
        try:
            # Simple string parsing for safety
            if ">=" in criteria:
                var, value = criteria.split(" >= ")
                return context.get(var.strip(), 0) >= int(value.strip())
            return False
        except:
            return False
    
    async def _generate_psychological_hooks(self, user_profile: UserProfile) -> Dict[str, Any]:
        """Generate messages designed to increase engagement with coupon system."""
        hooks = []
        
        # Coupon-based hooks instead of level progression
        active_coupons = len([c for c in user_profile.earned_coupons if not c.is_used])
        
        # Coupon expiration pressure
        if active_coupons > 0:
            hooks.append(f"🎫 You have {active_coupons} coupons expiring today! Use them before they're gone!")
        
        # Mystery box progress
        progress_pct = (user_profile.mystery_box_progress / user_profile.points_per_mystery_box) * 100
        if progress_pct > 75:
            hooks.append(f"📦 {100-progress_pct:.0f}% away from your next mystery box!")
        
        # Social comparison (simulated)
        if user_profile.rank_this_week < user_profile.rank_last_week:
            hooks.append(f"📈 You've climbed {user_profile.rank_last_week - user_profile.rank_this_week} ranks this week!")
        
        # FOMO for daily bonus
        if user_profile.daily_bonus_available:
            hooks.append("⏰ Don't forget your daily bonus! Available for next few hours.")
        
        # Streak pressure
        if user_profile.current_streak_days >= 3:
            hooks.append(f"🔥 Don't break your {user_profile.current_streak_days}-day streak!")
        
        # Mystery boxes
        available_boxes = user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened
        if available_boxes > 0:
            hooks.append(f"📦 {available_boxes} mystery boxes waiting! What coupons will you find?")
        
        # Coupon usage encouragement
        if user_profile.total_coupons_earned > 0 and user_profile.total_coupons_used == 0:
            hooks.append("🎯 You've earned coupons from mystery boxes but haven't used any yet! Treat yourself!")
        
        return {
            "engagement_messages": hooks,
            "coupon_pressure": active_coupons > 0,
            "mystery_box_pressure": progress_pct > 75,
            "streak_anxiety": user_profile.current_streak_days >= 5,
            "fomo_active": len(user_profile.limited_time_achievements_available) > 0
        }
    
    async def get_daily_status(self) -> Dict[str, Any]:
        """Get daily status with coupon-based information."""
        user_profile = await self.user_repo.ensure_default_profile()
        
        # Calculate days since last activity for pressure
        if user_profile.last_activity_date:
            days_inactive = (datetime.utcnow().date() - user_profile.last_activity_date.date()).days
            user_profile.days_since_last_activity = days_inactive
            
            # Trigger decay warnings (loss aversion)
            if days_inactive >= 2:
                user_profile.progress_decay_warning = True
        
        # Ensure streak check date is updated if missing
        if user_profile.last_streak_check_date is None:
            user_profile.last_streak_check_date = datetime.utcnow()
        
        # Daily bonus with FOMO
        daily_bonus_message = ""
        if user_profile.daily_bonus_available:
            hours_left = 24 - datetime.utcnow().hour
            daily_bonus_message = f"⏰ Daily bonus expires in {hours_left} hours! Claim now!"
        
        # Rank simulation (social pressure)
        if random.random() < 0.3:  # 30% chance of rank change
            user_profile.rank_this_week = max(1, user_profile.rank_this_week + random.randint(-2, 2))
        
        # Expire old coupons
        await self._expire_old_coupons(user_profile)
        
        # Calculate coupon stats
        active_coupons = len([c for c in user_profile.earned_coupons if not c.is_used])
        mystery_box_progress_pct = (user_profile.mystery_box_progress / user_profile.points_per_mystery_box) * 100
        
        await self.user_repo.save_profile(user_profile)
        
        return {
            "current_coupons": active_coupons,
            "total_coupons_earned": user_profile.total_coupons_earned,
            "total_coupons_used": user_profile.total_coupons_used,
            "mystery_box_progress": user_profile.mystery_box_progress,
            "mystery_box_needed": user_profile.points_per_mystery_box,
            "mystery_box_progress_pct": mystery_box_progress_pct,
            "current_streak": user_profile.current_streak_days,
            "daily_tasks_completed": user_profile.daily_tasks_completed_today,
            "daily_task_goal": user_profile.daily_task_goal,
            "weekly_rank": user_profile.rank_this_week,
            "mystery_boxes_available": user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened,
            "daily_bonus_available": user_profile.daily_bonus_available,
            "daily_bonus_message": daily_bonus_message,
            "decay_warning": user_profile.progress_decay_warning,
            "days_inactive": user_profile.days_since_last_activity,
            "psychological_hooks": await self._generate_psychological_hooks(user_profile),
            "urgency_factors": {
                "streak_at_risk": user_profile.days_since_last_activity >= 1,
                "bonus_expiring": user_profile.daily_bonus_available,
                "rank_falling": user_profile.rank_this_week > user_profile.rank_last_week,
                "coupons_expiring": active_coupons > 0,
                "mystery_box_close": mystery_box_progress_pct > 75
            }
        }

    async def claim_daily_bonus(self) -> Dict[str, Any]:
        """Claim daily bonus with XP rewards instead of coupons."""
        user_profile = await self.user_repo.ensure_default_profile()
        
        if not user_profile.daily_bonus_available:
            return {
                "success": False, 
                "message": "Daily bonus already claimed or not available"
            }
        
        # Daily bonus now awards XP instead of coupons
        roll = random.random()
        
        if roll < 0.05:  # 5% - Big bonus day! Lots of XP
            bonus_xp = random.randint(150, 200)
            bonus_type = "BIG"
            bonus_message = f"🎉 BIG BONUS DAY! +{bonus_xp} XP!"
        elif roll < 0.25:  # 25% - Good bonus - medium XP
            bonus_xp = random.randint(75, 100)
            bonus_type = "GOOD"
            bonus_message = f"⭐ Great bonus! +{bonus_xp} XP!"
        else:  # 70% - Standard bonus - small XP
            bonus_xp = random.randint(25, 50)
            bonus_type = "STANDARD"
            bonus_message = f"✨ Daily bonus! +{bonus_xp} XP!"
        
        # Apply consecutive bonus - extra XP for streaks
        streak_bonus_xp = 0
        if user_profile.consecutive_daily_bonuses >= 3:
            streak_bonus_xp = 25
            bonus_xp += streak_bonus_xp
            bonus_message += f" (Streak bonus: +{streak_bonus_xp} XP!)"
        
        # Award XP
        user_profile.add_experience(bonus_xp)
        user_profile.overall_score += bonus_xp
        
        # Update bonus tracking
        user_profile.daily_bonus_available = False
        user_profile.consecutive_daily_bonuses += 1
        user_profile.last_daily_bonus_date = datetime.utcnow()
        
        # Small chance for extra rewards
        extra_rewards = []
        if roll < 0.10:  # 10% chance for mystery box
            user_profile.mystery_boxes_earned += 1
            extra_rewards.append("📦 Bonus mystery box!")
        
        if roll > 0.95 and user_profile.streak_insurance_count < 3:  # 5% chance for insurance
            user_profile.streak_insurance_count += 1
            extra_rewards.append("🛡️ Streak insurance!")
        
        await self.user_repo.save_profile(user_profile)
        
        return {
            "success": True,
            "bonus_type": bonus_type,
            "xp_earned": bonus_xp,
            "streak_bonus_xp": streak_bonus_xp,
            "consecutive_days": user_profile.consecutive_daily_bonuses,
            "message": bonus_message,
            "extra_rewards": extra_rewards,
            "celebration": f"🎁 {bonus_message}"
        }
    
    async def process_objective_completion(self, objective_id: UUID) -> Dict[str, Any]:
        """Process objective completion with XP rewards instead of coupons."""
        objective = await self.objective_repo.get_by_id(objective_id)
        if not objective or objective.status != ObjectiveStatus.COMPLETED:
            return {"success": False, "message": "Objective not found or not completed"}
        
        user_profile = await self.user_repo.ensure_default_profile()
        
        # === XP CALCULATION ===
        base_xp = settings.points_per_objective if hasattr(settings, 'points_per_objective') else 100
        
        # Calculate XP bonuses
        complexity_bonus = int(base_xp * objective.complexity_score)
        priority_bonus = int(base_xp * objective.priority_score) 
        
        # Objective type bonus
        type_bonus = 0
        if objective.objective_type == ObjectiveType.MAIN_OBJECTIVE:
            type_bonus = base_xp * 2  # Main objectives give 3x total XP
        elif objective.objective_type == ObjectiveType.SUB_OBJECTIVE:
            type_bonus = base_xp * 0.5  # Sub objectives give 1.5x total XP
        
        # Timeliness bonus
        timeliness_bonus = 0
        timeliness_message = ""
        if objective.due_date:
            now = datetime.utcnow().replace(tzinfo=objective.due_date.tzinfo) if objective.due_date.tzinfo else datetime.utcnow()
            objective_due = objective.due_date.replace(tzinfo=None) if objective.due_date.tzinfo else objective.due_date
            now_naive = now.replace(tzinfo=None) if now.tzinfo else now
            
            days_early = (objective_due - now_naive).days
            if days_early > 0:
                timeliness_bonus = min(days_early * 20, base_xp)  # Up to 100% bonus for early completion
                timeliness_message = f"⚡ Early completion bonus: +{timeliness_bonus} XP!"
                objective.completion_timeliness_score = 1.0
            elif days_early < 0:
                timeliness_message = "⚠️ Late completion, but good job finishing!"
                objective.completion_timeliness_score = -0.5
        
        # Calculate total XP
        total_xp = int(base_xp + complexity_bonus + priority_bonus + type_bonus + timeliness_bonus)
        
        # Apply streak multiplier
        if user_profile.current_streak_days >= 7:
            streak_multiplier = 1.0 + (user_profile.current_streak_days * 0.05)  # 5% per day
            total_xp = int(total_xp * streak_multiplier)
        
        # === AWARD XP AND HANDLE LEVEL-UPS ===
        old_level = user_profile.level
        levels_gained = user_profile.add_experience(total_xp)
        
        # Check for achievements
        unlocked_achievements = await self._check_achievements(user_profile)
        
        # Add achievement XP bonus
        achievement_xp = len(unlocked_achievements) * 50
        if achievement_xp > 0:
            user_profile.add_experience(achievement_xp)
        
        # Update overall score for legacy systems
        user_profile.overall_score += total_xp
        
        await self.user_repo.save_profile(user_profile)
        
        # === PREPARE RESPONSE ===
        response = {
            "success": True,
            "xp_earned": total_xp,
            "achievement_xp": achievement_xp,
            "total_xp_earned": total_xp + achievement_xp,
            "xp_breakdown": {
                "base_xp": base_xp,
                "complexity_bonus": complexity_bonus,
                "priority_bonus": priority_bonus,
                "type_bonus": type_bonus,
                "timeliness_bonus": timeliness_bonus,
                "achievement_bonus": achievement_xp
            },
            "level_info": {
                "current_level": user_profile.level,
                "current_xp": user_profile.experience_points,
                "xp_to_next_level": user_profile.experience_to_next_level,
                "levels_gained": levels_gained,
                "leveled_up": len(levels_gained) > 0
            },
            "mystery_boxes_earned": len(levels_gained),  # One box per level gained
            "mystery_boxes_available": user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened,
            "unlocked_achievements": unlocked_achievements,
            "timeliness_message": timeliness_message,
            "celebration": f"🏆 OBJECTIVE COMPLETE! +{total_xp} XP earned!"
        }
        
        # Add level-up celebration
        if levels_gained:
            level_celebrations = []
            for level in levels_gained:
                level_celebrations.append(f"🎉 LEVEL UP! You reached level {level}!")
                level_celebrations.append(f"📦 Mystery Box earned!")
            
            response["level_up_celebrations"] = level_celebrations
            response["celebration"] = f"🎆 LEVEL UP! You reached level {user_profile.level}! +{total_xp} XP earned!"
        
        return response
    
    async def get_available_coupons(self) -> Dict[str, Any]:
        """Get user's available coupons with expiration info."""
        user_profile = await self.user_repo.ensure_default_profile()
        
        # Expire old coupons first
        await self._expire_old_coupons(user_profile)
        
        # Get active coupons
        active_coupons = []
        for coupon in user_profile.earned_coupons:
            if not coupon.is_used:
                coupon_def = next((c for c in self._coupon_definitions if c.coupon_type == coupon.coupon_type), None)
                if coupon_def:
                    hours_left = (coupon.expires_at - datetime.utcnow()).total_seconds() / 3600
                    active_coupons.append({
                        "id": str(coupon.id),
                        "type": coupon.coupon_type.value,
                        "display_name": coupon_def.display_name,
                        "description": coupon_def.description,
                        "duration_minutes": coupon_def.duration_minutes,
                        "rarity": coupon_def.rarity,
                        "expires_at": coupon.expires_at.isoformat(),
                        "hours_left": max(0, hours_left)
                    })
        
        await self.user_repo.save_profile(user_profile)
        
        return {
            "active_coupons": active_coupons,
            "total_earned": user_profile.total_coupons_earned,
            "total_used": user_profile.total_coupons_used,
            "expiration_warning": len(active_coupons) > 0
        }
    
    async def get_user_achievements(self) -> List[AchievementDefinition]:
        """Get all available achievement definitions for the frontend."""
        return self._achievement_definitions
    
    async def get_coupon_definitions(self) -> List[CouponDefinition]:
        """Get all available coupon definitions for the frontend."""
        return self._coupon_definitions 