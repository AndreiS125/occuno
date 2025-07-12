import random
import logging
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from dataclasses import dataclass

from core.config import settings
from domain.models import (
    UserProfile, ObjectiveStatus, CouponType, CouponDefinition, 
    EarnedCoupon, MysteryBoxReward, AchievementDefinition
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
    
    async def process_task_completion(self, task_id: UUID) -> Dict[str, Any]:
        """Process task completion with coupon rewards instead of XP."""
        task = await self.objective_repo.get_by_id(task_id)
        if not task or task.status != ObjectiveStatus.COMPLETED:
            return {"success": False, "message": "Task not found or not completed"}
        
        user_profile = await self.user_repo.ensure_default_profile()
        
        # === COUPON EARNING LOGIC ===
        coupons_earned = []
        base_points = settings.points_per_task
        
        # Base coupon earning (50% chance for common tasks)
        if random.random() < 0.5:
            coupon_type = self._get_random_coupon_type()
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
        
        # Bonus coupon chances based on task properties
        bonus_roll = random.random()
        bonus_message = ""
        
        if bonus_roll < 0.01:  # 1% - JACKPOT! Multiple coupons
            bonus_coupons = random.randint(2, 4)
            for _ in range(bonus_coupons):
                coupon_type = self._get_random_coupon_type(rarity_boost=2.0)
                coupon = self._create_coupon_with_expiration(coupon_type)
                coupons_earned.append(coupon)
            bonus_message = f"🎰 JACKPOT! {bonus_coupons + 1} coupons earned!"
        elif bonus_roll < 0.05:  # 5% - Big Win
            coupon_type = self._get_random_coupon_type(rarity_boost=1.5)
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
            bonus_message = "💎 BONUS COUPON! Extra reward!"
        elif bonus_roll < 0.25:  # 25% - Nice bonus
            if random.random() < 0.7:  # 70% chance for extra coupon
                coupon_type = self._get_random_coupon_type()
                coupon = self._create_coupon_with_expiration(coupon_type)
                coupons_earned.append(coupon)
                bonus_message = "⭐ EXTRA COUPON!"
        
        # === COMPLEXITY AND PRIORITY BONUSES ===
        if task.complexity_score > 0.7:
            coupon_type = self._get_random_coupon_type(rarity_boost=1.3)
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
            bonus_message += " 🧠 Complex task bonus!"
        
        if task.priority_score > 0.8:
            coupon_type = self._get_random_coupon_type(rarity_boost=1.2)
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
            bonus_message += " 🎯 Priority task bonus!"
        
        # === TIMELINESS BONUS ===
        timeliness_bonus = False
        urgency_message = ""
        if task.due_date:
            now = datetime.utcnow().replace(tzinfo=task.due_date.tzinfo) if task.due_date.tzinfo else datetime.utcnow()
            task_due = task.due_date.replace(tzinfo=None) if task.due_date.tzinfo else task.due_date
            now_naive = now.replace(tzinfo=None) if now.tzinfo else now
            
            days_early = (task_due - now_naive).days
            if days_early > 0:
                timeliness_bonus = True
                coupon_type = self._get_random_coupon_type(rarity_boost=1.5)
                coupon = self._create_coupon_with_expiration(coupon_type)
                coupons_earned.append(coupon)
                urgency_message = f"⚡ Early completion bonus coupon!"
                task.completion_timeliness_score = 1.0
            elif days_early < 0:  # Late but still completed
                urgency_message = "⚠️ Late completion, but good job not giving up!"
                task.completion_timeliness_score = -0.5
        
        # === STREAK MULTIPLIER ===
        streak_multiplier = 1.0 + (user_profile.current_streak_days * 0.1)
        if user_profile.current_streak_days >= 7:
            # Extra coupon for week+ streaks
            coupon_type = self._get_random_coupon_type(rarity_boost=1.8)
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
            bonus_message += " 🔥 Streak bonus coupon!"
        
        # === ADD COUPONS TO USER PROFILE ===
        for coupon in coupons_earned:
            user_profile.earned_coupons.append(coupon)
            user_profile.total_coupons_earned += 1
        
        # === MYSTERY BOX PROGRESS ===
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
        
        # === COMEBACK BONUS ===
        comeback_bonus = False
        if user_profile.comeback_bonus_available:
            coupon_type = self._get_random_coupon_type(rarity_boost=2.0)
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
            user_profile.earned_coupons.append(coupon)
            user_profile.total_coupons_earned += 1
            user_profile.comeback_bonus_available = False
            comeback_bonus = True
            bonus_message += " 💪 Comeback bonus coupon!"
        
        # Update score for points-based systems
        user_profile.overall_score += base_points
        
        # === ACHIEVEMENT CHECKING ===
        unlocked_achievements = await self._check_achievements(user_profile)
        
        # === STREAK UPDATE ===
        streak_result = await self._update_streak_system(user_profile)
        
        # === WEEKLY CHALLENGE PROGRESS ===
        weekly_progress = await self._update_weekly_challenge(user_profile)
        
        # === EXPIRE OLD COUPONS ===
        await self._expire_old_coupons(user_profile)
        
        # Save updated profile
        await self.user_repo.save_profile(user_profile)
        
        # === RESPONSE ===
        coupon_descriptions = []
        for coupon in coupons_earned:
            coupon_def = next((c for c in self._coupon_definitions if c.coupon_type == coupon.coupon_type), None)
            if coupon_def:
                coupon_descriptions.append(f"{coupon_def.display_name} ({coupon_def.duration_minutes}min)")
        
        response = {
            "success": True,
            "coupons_earned": len(coupons_earned),
            "coupon_descriptions": coupon_descriptions,
            "bonus_message": bonus_message,
            "urgency_message": urgency_message,
            "points_awarded": base_points,
            "breakdown": {
                "base_coupons": len([c for c in coupons_earned if not timeliness_bonus and not comeback_bonus]),
                "bonus_coupons": len([c for c in coupons_earned if timeliness_bonus or comeback_bonus]),
                "streak_multiplier": streak_multiplier,
                "complexity_bonus": task.complexity_score > 0.7,
                "priority_bonus": task.priority_score > 0.8,
                "comeback_bonus": comeback_bonus
            },
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
            "psychological_hooks": await self._generate_psychological_hooks(user_profile)
        }
        
        return response
    
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
        
        # Use frontend choice if provided, otherwise use legacy random system
        if frontend_choice and 'coupon_type' in frontend_choice:
            # Frontend-controlled wheel result - award EXACTLY the coupon chosen, nothing more
            chosen_coupon_type_str = frontend_choice['coupon_type']
            
            # Convert string to CouponType enum
            try:
                chosen_coupon_type = CouponType(chosen_coupon_type_str)
            except ValueError:
                # If invalid coupon type, log error but don't fallback to random
                logging.error(f"Invalid coupon type from frontend: {chosen_coupon_type_str}")
                return {"success": False, "message": f"Invalid coupon type: {chosen_coupon_type_str}"}
            
            # Create EXACTLY the coupon chosen by the frontend - no bonuses, no extras
            coupon = self._create_coupon_with_expiration(chosen_coupon_type)
            coupons_earned = [coupon]
            
            # Use frontend display info
            reward_type = "WHEEL"
            reward_description = f"🎯 {frontend_choice.get('display_name', 'Wheel Reward')}!"
            
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
        
        # Check completion - Award coupon bonus instead of points
        challenge_completed = user_profile.weekly_challenge_progress >= user_profile.weekly_challenge_target
        if challenge_completed and not user_profile.weekly_challenge_completed:
            user_profile.weekly_challenge_completed = True
            # Award special coupons for weekly challenge completion
            bonus_coupons = random.randint(1, 3)
            for _ in range(bonus_coupons):
                coupon_type = self._get_random_coupon_type(rarity_boost=1.5)
                coupon = self._create_coupon_with_expiration(coupon_type)
                user_profile.earned_coupons.append(coupon)
                user_profile.total_coupons_earned += 1
        
        # Generate urgency message
        days_left = 7 - datetime.utcnow().weekday()
        progress_pct = (user_profile.weekly_challenge_progress / user_profile.weekly_challenge_target) * 100
        
        if challenge_completed:
            urgency_message = "🏆 Weekly challenge completed! Bonus coupons earned!"
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
                
                # Award bonus coupon for achievement
                coupon_type = self._get_random_coupon_type(rarity_boost=1.8)
                coupon = self._create_coupon_with_expiration(coupon_type)
                user_profile.earned_coupons.append(coupon)
                user_profile.total_coupons_earned += 1
                
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
                    "coupon_earned": True,
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
            hooks.append("🎯 You've earned coupons but haven't used any yet! Treat yourself!")
        
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
        """Claim daily bonus with coupon rewards instead of XP."""
        user_profile = await self.user_repo.ensure_default_profile()
        
        if not user_profile.daily_bonus_available:
            return {
                "success": False, 
                "message": "Daily bonus already claimed or not available"
            }
        
        # Daily bonus now awards coupons
        coupons_earned = []
        roll = random.random()
        
        if roll < 0.05:  # 5% - Big bonus day! Multiple coupons
            coupon_count = random.randint(2, 3)
            for _ in range(coupon_count):
                coupon_type = self._get_random_coupon_type(rarity_boost=1.5)
                coupon = self._create_coupon_with_expiration(coupon_type)
                coupons_earned.append(coupon)
            bonus_type = "BIG"
            bonus_message = f"🎉 BIG BONUS DAY! {coupon_count} coupons!"
        elif roll < 0.25:  # 25% - Good bonus - 1 good coupon
            coupon_type = self._get_random_coupon_type(rarity_boost=1.2)
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
            bonus_type = "GOOD"
            bonus_message = "⭐ Great bonus coupon!"
        else:  # 70% - Standard bonus - 1 common coupon
            coupon_type = self._get_random_coupon_type()
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
            bonus_type = "STANDARD"
            bonus_message = "✨ Daily bonus coupon!"
        
        # Apply consecutive bonus - extra coupons for streaks
        if user_profile.consecutive_daily_bonuses >= 3:
            extra_coupon_type = self._get_random_coupon_type(rarity_boost=1.3)
            extra_coupon = self._create_coupon_with_expiration(extra_coupon_type)
            coupons_earned.append(extra_coupon)
            bonus_message += f" (Streak bonus: +1 coupon!)"
        
        # Add coupons to profile
        for coupon in coupons_earned:
            user_profile.earned_coupons.append(coupon)
            user_profile.total_coupons_earned += 1
        
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
        
        # Prepare coupon descriptions
        coupon_descriptions = []
        for coupon in coupons_earned:
            coupon_def = next((c for c in self._coupon_definitions if c.coupon_type == coupon.coupon_type), None)
            if coupon_def:
                coupon_descriptions.append(f"{coupon_def.display_name} ({coupon_def.duration_minutes}min)")
        
        return {
            "success": True,
            "bonus_type": bonus_type,
            "coupons_earned": len(coupons_earned),
            "coupon_descriptions": coupon_descriptions,
            "consecutive_days": user_profile.consecutive_daily_bonuses,
            "message": bonus_message,
            "extra_rewards": extra_rewards,
            "celebration": f"🎁 {bonus_message}"
        }
    
    async def process_objective_completion(self, objective_id: UUID) -> Dict[str, Any]:
        """Process objective completion with coupon rewards."""
        objective = await self.objective_repo.get_by_id(objective_id)
        if not objective or objective.status != ObjectiveStatus.COMPLETED:
            return {"success": False, "message": "Objective not found or not completed"}
        
        user_profile = await self.user_repo.ensure_default_profile()
        
        # Objectives award multiple coupons with higher rarity
        coupons_earned = []
        base_points = settings.points_per_objective
        
        # Guaranteed coupons for objectives (more valuable than tasks)
        guaranteed_coupons = random.randint(2, 4)  # 2-4 coupons guaranteed
        for _ in range(guaranteed_coupons):
            coupon_type = self._get_random_coupon_type(rarity_boost=1.5)
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
        
        # Bonus coupon chances for objectives
        bonus_roll = random.random()
        bonus_message = ""
        
        if bonus_roll < 0.02:  # 2% - MEGA JACKPOT for objectives!
            bonus_coupons = random.randint(3, 5)
            for _ in range(bonus_coupons):
                coupon_type = self._get_random_coupon_type(rarity_boost=3.0)
                coupon = self._create_coupon_with_expiration(coupon_type)
                coupons_earned.append(coupon)
            bonus_message = f"🎰 MEGA JACKPOT! {bonus_coupons} bonus coupons!"
        elif bonus_roll < 0.10:  # 10% - Big Win
            bonus_coupons = random.randint(1, 2)
            for _ in range(bonus_coupons):
                coupon_type = self._get_random_coupon_type(rarity_boost=2.0)
                coupon = self._create_coupon_with_expiration(coupon_type)
                coupons_earned.append(coupon)
            bonus_message = f"💎 OBJECTIVE BONUS! {bonus_coupons} premium coupons!"
        elif bonus_roll < 0.35:  # 35% - Nice bonus
            coupon_type = self._get_random_coupon_type(rarity_boost=1.8)
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
            bonus_message = "⭐ BIG OBJECTIVE BONUS! Extra coupon!"
        
        # Complexity bonus
        if objective.complexity_score > 0.7:
            coupon_type = self._get_random_coupon_type(rarity_boost=1.6)
            coupon = self._create_coupon_with_expiration(coupon_type)
            coupons_earned.append(coupon)
            bonus_message += " 🧠 Complex objective bonus!"
        
        # Add coupons to profile
        for coupon in coupons_earned:
            user_profile.earned_coupons.append(coupon)
            user_profile.total_coupons_earned += 1
        
        # Update score for points-based systems
        user_profile.overall_score += base_points
        
        # Higher chance for mystery box
        if random.random() < 0.4:  # 40% chance for objectives
            user_profile.mystery_boxes_earned += 1
        
        # Check achievements
        unlocked_achievements = await self._check_achievements(user_profile)
        
        await self.user_repo.save_profile(user_profile)
        
        # Prepare coupon descriptions
        coupon_descriptions = []
        for coupon in coupons_earned:
            coupon_def = next((c for c in self._coupon_definitions if c.coupon_type == coupon.coupon_type), None)
            if coupon_def:
                coupon_descriptions.append(f"{coupon_def.display_name} ({coupon_def.duration_minutes}min)")
        
        return {
            "success": True,
            "coupons_earned": len(coupons_earned),
            "coupon_descriptions": coupon_descriptions,
            "bonus_message": bonus_message,
            "celebration": f"🏆 OBJECTIVE COMPLETE! {len(coupons_earned)} coupons earned!",
            "unlocked_achievements": unlocked_achievements,
            "mystery_box_chance": True
        }
    
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