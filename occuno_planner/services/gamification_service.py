import random
import logging
from typing import Dict, Any, List, Optional, TYPE_CHECKING
from uuid import UUID
from datetime import datetime, timedelta
from dataclasses import dataclass

from core.config import settings
from core.models import (
    UserProfile, EarnedCoupon, MysteryBoxReward, UserAchievementDefinition,
    UserAchievement, UserCouponDefinition
)
from repositories.repository_factory import get_user_profile_repository, get_objective_repository
from core.logging_config import get_logger

class GamificationService:
    """Service for managing coupon-based gamification system with real-world rewards."""
    
    def __init__(self):
        self.logger = get_logger("gamification_service")
        self.user_repo = get_user_profile_repository()
        self.objective_repo = get_objective_repository()
    

    
    def _get_user_coupon_definitions(self, user_profile: UserProfile) -> List[UserCouponDefinition]:
        """Get active coupon definitions for a specific user"""
        if not user_profile:
            return []
        defs = user_profile.coupon_definitions or []
        if not defs:
            # Ensure defaults in DB and refresh
            ensured = self.user_repo.ensure_coupon_definitions(user_profile.id)
            defs = ensured or []
        return [coupon_def for coupon_def in defs if coupon_def.is_active]
    
    def _get_user_achievement_definitions(self, user_profile: UserProfile) -> List[UserAchievementDefinition]:
        """Get active achievement definitions for a specific user"""
        if not user_profile:
            return []
        defs = user_profile.achievement_definitions or []
        if not defs:
            ensured = self.user_repo.ensure_achievement_definitions(user_profile.id)
            defs = ensured or []
        return [achievement_def for achievement_def in defs if achievement_def.is_active]
    

    
    def _create_coupon_with_expiration(self, coupon_type: str, user_profile: UserProfile, bonus_multiplier: float = 1.0, display_name: Optional[str] = None) -> EarnedCoupon:
        """Create a coupon with reasonable expiration time and optional custom display name."""
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
        
        # Find the coupon definition to get duration info
        coupon_definitions = self._get_user_coupon_definitions(user_profile)
        coupon_def = next((c for c in coupon_definitions if c.coupon_type == coupon_type), None)
        duration_str = f"{coupon_def.duration_minutes} minutes" if coupon_def else "15 minutes"
        
        return EarnedCoupon(
            coupon_type=coupon_type,
            coupon_value=duration_str,  # Set the required coupon_value field
            display_name=display_name,
            earned_at=now,
            expiration_date=end_of_day,  # Use expiration_date instead of expires_at
            is_used=False
        )
    
    def _get_random_coupon_type(self, user_profile: UserProfile, rarity_boost: float = 1.0) -> str:
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
        coupon_definitions = self._get_user_coupon_definitions(user_profile)
        for coupon_def in coupon_definitions:
            weight = weights.get(coupon_def.rarity, 1)
            weighted_coupons.extend([coupon_def.coupon_type] * weight)
        
        return random.choice(weighted_coupons)
    
    def _map_to_backend_coupon_type(self, frontend_coupon_type: str) -> str:
        """Map frontend coupon types to existing backend CouponType enum values."""
        # Direct mappings for frontend types that match backend types
        direct_mappings = {
            "watch_youtube": "watch_youtube",
            "scroll_instagram": "scroll_instagram",
            "play_games": "play_games",
            "take_nap": "take_nap",
            "power_nap": "take_nap",
            "eat_snack": "eat_snack",
            "snack_break": "eat_snack",
            "browse_reddit": "browse_reddit",
            "listen_music": "listen_music",
            "chat_friends": "chat_friends",
        }
        
        # Check for direct mapping first
        if frontend_coupon_type in direct_mappings:
            return direct_mappings[frontend_coupon_type]
        
        # Intelligent mappings for new frontend types
        intelligent_mappings = {
            # Gaming related
            "game_marathon": "play_games",
            "retro_gaming": "play_games",
            
            # Entertainment related  
            "movie_marathon": "watch_netflix",
            "watch_netflix": "watch_netflix",
            
            # Social/Media related
            "social_media": "scroll_instagram",
            "music_session": "listen_music",
            "one_song": "listen_music",
            
            # Food related
            "food_festival": "eat_snack",
            "coffee_break": "eat_snack",
            
            # Relaxation related
            "mini_meditation": "take_nap",
            "short_walk": "take_nap",
            
            # Reading/Learning
            "quick_read": "browse_reddit",
            "check_email": "browse_reddit",
            
            # Creative
            "creative_time": "listen_music",
        }
        
        if frontend_coupon_type in intelligent_mappings:
            return intelligent_mappings[frontend_coupon_type]
        
        # Fallback to most common coupon type for unknown types
        logging.warning(f"Unknown frontend coupon type: {frontend_coupon_type}, falling back to SCROLL_INSTAGRAM")
        return "scroll_instagram"
    
    def process_task_completion(self, task_id: UUID) -> Dict[str, Any]:
        """Process task completion with XP rewards only (no coupons)."""
        task = self.objective_repo.get_by_id(task_id)
        if not task or task.status != "completed":
            return {"success": False, "message": "Task not found or not completed"}
        
        user_profile = self.user_repo.get_by_id(task.user_id)
        
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
        unlocked_achievements = self._check_achievements(user_profile)
        
        # Add achievement XP bonus
        achievement_xp = len(unlocked_achievements) * 50
        if achievement_xp > 0:
            user_profile.add_experience(achievement_xp)
        
        # === STREAK UPDATE ===
        streak_result = self._update_streak_system(user_profile)
        
        # === WEEKLY CHALLENGE PROGRESS ===
        weekly_progress = self._update_weekly_challenge(user_profile)
        
        # === EXPIRE OLD COUPONS ===
        self._expire_old_coupons(user_profile)
        
        # Save updated profile
        self.user_repo.update(user_profile)
        
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
            
            # Task completion specific data
            "urgency_message": urgency_message,
            "points_awarded": base_points,
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
    
    def _expire_old_coupons(self, user_profile: UserProfile) -> None:
        """Mark expired coupons as used without mutating the relationship list.
        This avoids NOT NULL FK issues on earned_coupons.user_id during merges.
        """
        now = datetime.utcnow()
        expired_count = 0

        if not user_profile.earned_coupons:
            return

        for coupon in user_profile.earned_coupons:
            # Use expiration_date field instead of expires_at
            expiration_time = coupon.expiration_date or datetime.utcnow() + timedelta(hours=24)
            if expiration_time <= now and not coupon.is_used:
                try:
                    # Persist as used in DB
                    self.user_repo.use_coupon(coupon.id)
                    # Reflect in-memory state to keep filtering accurate in this request
                    coupon.is_used = True
                    coupon.used_at = datetime.utcnow()
                    expired_count += 1
                except Exception:
                    logging.exception("Error marking expired coupon as used")

        if expired_count > 0:
            print(f"🗑️ Expired {expired_count} coupons")
    
    def use_coupon(self, user_id: UUID, coupon_id: UUID) -> Dict[str, Any]:
        """Use a coupon to redeem the reward."""
        user_profile = self.user_repo.get_by_id(user_id)
        
        # Find the coupon
        coupon = None
        for c in user_profile.earned_coupons:
            if c.id == coupon_id and not c.is_used:
                coupon = c
                break
        
        if not coupon:
            return {"success": False, "message": "Coupon not found or already used"}
        
        # Check if expired - use expiration_date field
        expiration_time = coupon.expiration_date or datetime.utcnow() + timedelta(hours=24)
        if expiration_time < datetime.utcnow():
            return {"success": False, "message": "Coupon has expired"}
        
        # Mark as used
        coupon.is_used = True
        coupon.used_at = datetime.utcnow()
        user_profile.total_coupons_used += 1
        
        # Get coupon definition
        coupon_definitions = self._get_user_coupon_definitions(user_profile)
        coupon_def = next((c for c in coupon_definitions if c.coupon_type == coupon.coupon_type), None)
        
        # Use the preserved display name from the wheel, fallback to backend definition
        display_name = coupon.display_name or (coupon_def.display_name if coupon_def else "Unknown")
        
        # Save profile
        self.user_repo.update(user_profile)
        
        return {
            "success": True,
            "message": f"Enjoy your {display_name}!",
            "coupon_name": display_name,
            "duration_minutes": coupon_def.duration_minutes if coupon_def else 15,
            "celebration": f"🎉 {display_name} activated!"
        }
    
    def open_mystery_box(self, user_id: UUID, frontend_choice: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Open a mystery box with coupon rewards (backend-first selection)."""
        user_profile = self.user_repo.get_by_id(user_id)
        
        available_boxes = user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened
        if available_boxes <= 0:
            return {"success": False, "message": "No mystery boxes available"}
        
        user_profile.mystery_boxes_opened += 1
        
        # Apply luck mechanic - increases chances of better rewards
        luck_boost = self._calculate_luck_boost(user_profile)
        
        # === BACKEND SELECTS REWARD FIRST ===
        # Step 1: Determine reward tier based on probabilities and luck
        base_roll = random.random()
        roll = self._apply_luck_to_legacy_roll(base_roll, luck_boost)
        
        logging.info(f"🍀 Mystery box roll: {base_roll:.3f} → {roll:.3f} (luck: {luck_boost:.2f}x)")
        
        # Step 2: Select reward tier
        if roll < 0.01:  # 1% - LEGENDARY
            reward_tier = "LEGENDARY"
        elif roll < 0.05:  # 5% - EPIC  
            reward_tier = "EPIC"
        elif roll < 0.20:  # 20% - RARE
            reward_tier = "RARE"
        elif roll < 0.50:  # 50% - COMMON
            reward_tier = "COMMON"
        else:  # 50% - NO_REWARD
            reward_tier = "NO_REWARD"
        
        # Step 3: Load reward configuration to get actual segments
        reward_config = None
        try:
            profile = user_profile
            
            if profile.custom_reward_config and profile.use_custom_rewards:
                # Use custom configuration
                reward_config = profile.custom_reward_config
                tier_config = None
                for tier in reward_config.reward_tiers:
                    if tier.tier_name == reward_tier:
                        tier_config = tier
                        break
            else:
                # Use default configuration - need to create default segments
                tier_config = self._get_default_tier_config(reward_tier)
        except Exception as e:
            logging.error(f"Failed to load reward config: {e}")
            tier_config = self._get_default_tier_config(reward_tier)
        
        # Step 4: Select specific reward from the tier
        coupons_earned = []
        reward_type = reward_tier
        reward_description = "Mystery reward!"
        selected_segment = None
        
        if reward_tier == "NO_REWARD":
            # No reward case
            reward_description = "Empty box! Better luck next time!"
            coupons_earned = []
            selected_segment = {
                "name": "📦 Empty Box",
                "type": "no_reward",
                "duration": 0,
                "weight": 1
            }
        else:
            # Select from available segments in the tier
            if tier_config and hasattr(tier_config, 'segments') and tier_config.segments:
                # Use configured segments
                segments = tier_config.segments
                total_weight = sum(seg.get('weight', 1) for seg in segments)
                
                # Weighted random selection
                segment_roll = random.random() * total_weight
                cumulative_weight = 0
                
                for segment in segments:
                    cumulative_weight += segment.get('weight', 1)
                    if segment_roll <= cumulative_weight:
                        selected_segment = segment
                        break
                
                if not selected_segment:
                    selected_segment = segments[0]  # Fallback to first segment
            else:
                # Fallback to default segments
                selected_segment = self._get_default_segment_for_tier(reward_tier)
            
            # Create coupon based on selected segment
            if selected_segment:
                segment_type = selected_segment.get('type', 'coffee_break')
                segment_name = selected_segment.get('name', 'Coffee Break')
                
                # Try to find existing coupon definition
                backend_coupon_type = self._map_to_backend_coupon_type(segment_type)
                coupon = self._create_coupon_with_expiration(
                    backend_coupon_type,
                    user_profile,
                    display_name=segment_name
                )
                coupons_earned.append(coupon)
                reward_description = f"🎉 {segment_name}!"
        
        # Add coupons to profile (if any earned)
        if coupons_earned:
            for coupon in coupons_earned:
                # Persist coupon with proper user_id using repository
                self.user_repo.add_coupon(user_profile.id, coupon)
                user_profile.total_coupons_earned += 1

        self.user_repo.update(user_profile)
        
        # Prepare coupon descriptions
        coupon_descriptions = []
        coupon_definitions = self._get_user_coupon_definitions(user_profile)
        for coupon in coupons_earned:
            coupon_def = next((c for c in coupon_definitions if c.coupon_type == coupon.coupon_type), None)
            if coupon_def:
                display_name = coupon.display_name or coupon_def.display_name
                coupon_descriptions.append(f"{display_name} ({coupon_def.duration_minutes}min)")
        
        # Get the actual coupon types for wheel synchronization
        coupon_types_earned = []
        for coupon in coupons_earned:
            coupon_types_earned.append(coupon.coupon_type)
        
        # Select a primary coupon for wheel display
        primary_coupon_type = coupon_types_earned[0] if coupon_types_earned else None
        
        # === RETURN BACKEND SELECTION TO FRONTEND ===
        return {
            "success": True,
            "reward_type": reward_type,
            "reward_description": reward_description,
            "coupons_earned": len(coupons_earned),
            "coupon_descriptions": coupon_descriptions,
            "boxes_remaining": user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened,
            "celebration": f"🎉 {reward_description}",
            "luck_boost": luck_boost,
            "luck_info": {
                "base_luck": user_profile.luck_factor,
                "total_luck": luck_boost,
                "streak_bonus": min(user_profile.current_streak_days * 0.1, 0.5),
                "level_bonus": min(user_profile.level * 0.02, 0.2),
                "activity_bonus": 0.2 if user_profile.daily_tasks_completed_today >= user_profile.daily_task_goal else 0.0,
                "comeback_bonus": 0.3 if user_profile.comeback_bonus_available else 0.0
            },
            "wheel_result": {
                "segment": reward_type,
                "coupons": coupon_descriptions,
                "primary_coupon_type": primary_coupon_type,
                "all_coupon_types": coupon_types_earned
            },
            # === NEW: Backend selection for frontend wheel ===
            "backend_selection": {
                "tier": reward_tier,
                "segment": selected_segment,
                "roll_result": roll,
                "base_roll": base_roll
            }
        }
    
    def _update_streak_system(self, user_profile: UserProfile) -> Dict[str, Any]:
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
    
    def _update_weekly_challenge(self, user_profile: UserProfile) -> Dict[str, Any]:
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
    
    def _check_achievements(self, user_profile: UserProfile) -> List[Dict[str, Any]]:
        """Check for newly unlocked achievements using user-specific definitions."""
        unlocked = []
        
        # Get current user stats
        stats = {
            "daily_tasks_completed": user_profile.daily_tasks_completed_today,
            "current_streak_days": user_profile.current_streak_days,
            "total_coupons_earned": user_profile.total_coupons_earned,
            "total_coupons_used": user_profile.total_coupons_used,
            "mystery_boxes_opened": user_profile.mystery_boxes_opened,
            "weekend_tasks": getattr(user_profile, 'weekend_tasks_completed', 0),
            "late_night_tasks": getattr(user_profile, 'late_night_tasks_completed', 0)
        }
        
        # Get user's achievement definitions
        achievement_definitions = self._get_user_achievement_definitions(user_profile)
        
        # Check each achievement definition
        for achievement_def in achievement_definitions:
            # Skip if already unlocked
            if any(ach.achievement_id == achievement_def.achievement_id for ach in user_profile.achievements):
                continue
            
            # Evaluate criteria
            try:
                if self._evaluate_achievement_criteria(achievement_def.criteria_code, stats):
                    # Persist new achievement via repository to avoid duplicates and ensure DB save
                    persisted = self.user_repo.add_achievement(user_profile.id, achievement_def.achievement_id)
                    # Keep in-memory list consistent
                    user_profile.achievements.append(persisted)
                    unlocked.append({
                        "id": achievement_def.achievement_id,
                        "name": achievement_def.name,
                        "description": achievement_def.description,
                        "points": achievement_def.points_value,
                        "icon": achievement_def.icon or '🏆'
                    })
            except Exception as e:
                logging.warning(f"Error evaluating achievement {achievement_def.achievement_id}: {e}")
        
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
    
    def _generate_psychological_hooks(self, user_profile: UserProfile) -> Dict[str, Any]:
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
            "fomo_active": len(user_profile.limited_time_achievements_available or []) > 0
        }
    
    def get_daily_status(self, user_id: UUID) -> Dict[str, Any]:
        """Get daily status with coupon-based information."""
        user_profile = self.user_repo.get_by_id(user_id)
        
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
        self._expire_old_coupons(user_profile)
        
        # Calculate coupon stats
        earned_coupons = user_profile.earned_coupons or []
        active_coupons = len([c for c in earned_coupons if not c.is_used])
        mystery_box_progress_pct = (user_profile.mystery_box_progress / user_profile.points_per_mystery_box) * 100
        
        self.user_repo.update(user_profile)
        
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
            "psychological_hooks": self._generate_psychological_hooks(user_profile),
            "urgency_factors": {
                "streak_at_risk": user_profile.days_since_last_activity >= 1,
                "bonus_expiring": user_profile.daily_bonus_available,
                "rank_falling": user_profile.rank_this_week > user_profile.rank_last_week,
                "coupons_expiring": active_coupons > 0,
                "mystery_box_close": mystery_box_progress_pct > 75
            }
        }

    def claim_daily_bonus(self, user_id: UUID) -> Dict[str, Any]:
        """Claim daily bonus with XP rewards instead of coupons."""
        user_profile = self.user_repo.get_by_id(user_id)
        
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
        
        self.user_repo.update(user_profile)
        
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
    
    def process_objective_completion(self, objective_id: UUID) -> Dict[str, Any]:
        """Process objective completion with XP rewards instead of coupons."""
        print(f"🔍 Looking for objective with ID: {objective_id}")
        print(f"🗄️ Repository type: {type(self.objective_repo)}")
        
        objective = self.objective_repo.get_by_id(objective_id)
        print(f"📋 Found objective: {objective}")
        
        if not objective or objective.status != "completed":
            print(f"❌ Objective validation failed - Found: {objective is not None}, Status: {objective.status if objective else 'None'}")
            return {"success": False, "message": "Objective not found or not completed"}
        
        print(f"🎯 Processing completion for {objective.objective_type}: {objective.title}")
        print(f"📊 Priority: {objective.priority_score}, Complexity: {objective.complexity_score}")
        
        user_profile = self.user_repo.get_by_id(objective.user_id)
        
        # === XP CALCULATION ===
        base_xp = settings.points_per_objective if hasattr(settings, 'points_per_objective') else 100
        print(f"💰 Base XP: {base_xp}")
        
        # Calculate XP bonuses
        complexity_bonus = int(base_xp * objective.complexity_score)
        priority_bonus = int(base_xp * objective.priority_score) 
        
        # Objective type bonus (compare against lowercase string values)
        type_bonus = 0
        try:
            obj_type = (objective.objective_type or "").lower()
        except Exception:
            obj_type = ""
        if obj_type == "main_objective":
            type_bonus = base_xp * 2  # Main objectives give 3x total XP
        elif obj_type == "sub_objective":
            type_bonus = base_xp * 0.5  # Sub objectives give 1.5x total XP
            
        print(f"🎲 Bonuses - Complexity: {complexity_bonus}, Priority: {priority_bonus}, Type: {type_bonus}")
        
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
        print(f"💎 Total XP calculated: {total_xp}")
        
        # Apply streak multiplier
        if user_profile.current_streak_days >= 7:
            streak_multiplier = 1.0 + (user_profile.current_streak_days * 0.05)  # 5% per day
            total_xp = int(total_xp * streak_multiplier)
            print(f"🔥 Streak multiplier applied: {streak_multiplier}, New total: {total_xp}")
        
        # === AWARD XP AND HANDLE LEVEL-UPS ===
        old_level = user_profile.level
        print(f"👤 User profile before: Level {old_level}, XP: {user_profile.experience_points}")
        
        levels_gained = user_profile.add_experience(total_xp)
        print(f"🆙 Levels gained: {levels_gained}")
        print(f"👤 User profile after: Level {user_profile.level}, XP: {user_profile.experience_points}")
        
        # Check for achievements
        unlocked_achievements = self._check_achievements(user_profile)
        
        # Add achievement XP bonus
        achievement_xp = len(unlocked_achievements) * 50
        if achievement_xp > 0:
            user_profile.add_experience(achievement_xp)
        
        # Update overall score for legacy systems
        user_profile.overall_score += total_xp
        
        self.user_repo.update(user_profile)
        print(f"💾 User profile saved")
        
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
    
    def get_available_coupons(self, user_id: UUID) -> Dict[str, Any]:
        """Get user's available coupons with expiration info."""
        user_profile = self.user_repo.get_by_id(user_id)
        
        # Expire old coupons first
        self._expire_old_coupons(user_profile)
        
        # Get active coupons
        active_coupons = []
        coupon_definitions = self._get_user_coupon_definitions(user_profile)
        for coupon in user_profile.earned_coupons:
            if not coupon.is_used:
                coupon_def = next((c for c in coupon_definitions if c.coupon_type == coupon.coupon_type), None)
                if coupon_def:
                    # Use expiration_date field instead of expires_at
                    expiration_time = coupon.expiration_date or datetime.utcnow() + timedelta(hours=24)
                    hours_left = (expiration_time - datetime.utcnow()).total_seconds() / 3600
                    # Use the preserved display name from the wheel, fallback to backend definition
                    display_name = coupon.display_name or coupon_def.display_name
                    active_coupons.append({
                        "id": str(coupon.id),
                        "type": coupon.coupon_type,  # Remove .value since it's already a string
                        "display_name": display_name,
                        "description": coupon_def.description,
                        "duration_minutes": coupon_def.duration_minutes,
                        "rarity": coupon_def.rarity,
                        "expires_at": expiration_time.isoformat(),
                        "hours_left": max(0, hours_left)
                    })
        
        self.user_repo.update(user_profile)
        
        return {
            "active_coupons": active_coupons,
            "total_earned": user_profile.total_coupons_earned,
            "total_used": user_profile.total_coupons_used,
            "expiration_warning": len(active_coupons) > 0
        }
    
    def get_user_achievements(self, user_id: UUID) -> List[UserAchievementDefinition]:
        """Get all available achievement definitions for a specific user."""
        user_profile = self.user_repo.get_by_id(user_id)
        achievement_definitions = self._get_user_achievement_definitions(user_profile)
        
        # If no achievement definitions exist, create default ones
        if not achievement_definitions:
            self.logger.warning("No achievement definitions found for user, this should not happen after proper initialization")
            
        return achievement_definitions
    
    def get_coupon_definitions(self, user_id: UUID) -> List[UserCouponDefinition]:
        """Get all available coupon definitions for the specified user"""
        user_profile = self.user_repo.get_by_id(user_id)
        return self._get_user_coupon_definitions(user_profile)
    
    def _calculate_luck_boost(self, user_profile: UserProfile) -> float:
        """Calculate luck boost based on user's luck factor and recent activity."""
        base_luck = user_profile.luck_factor
        
        # Streak bonus: longer streaks increase luck
        streak_bonus = min(user_profile.current_streak_days * 0.1, 0.5)  # Max 50% boost
        
        # Recent activity bonus: more active users get slight luck boost
        activity_bonus = 0.0
        if user_profile.daily_tasks_completed_today >= user_profile.daily_task_goal:
            activity_bonus = 0.2  # 20% boost for completing daily goal
        
        # Comeback bonus: users who haven't been active get a luck boost
        comeback_bonus = 0.0
        if user_profile.comeback_bonus_available:
            comeback_bonus = 0.3  # 30% boost for comeback
            # Reset comeback bonus after use
            user_profile.comeback_bonus_available = False
        
        # Level bonus: higher level users get slightly better luck
        level_bonus = min(user_profile.level * 0.02, 0.2)  # Max 20% boost
        
        total_luck = base_luck + streak_bonus + activity_bonus + comeback_bonus + level_bonus
        
        # Cap the luck boost at 2.0x (100% increase)
        return min(total_luck, 2.0)
    
    def _apply_luck_to_legacy_roll(self, base_roll: float, luck_boost: float) -> float:
        """Apply luck boost to legacy random roll system."""
        if luck_boost <= 1.0:
            return base_roll
        
        # Higher luck makes the roll "better" (lower for better rewards)
        # Formula: adjusted_roll = base_roll / luck_boost
        adjusted_roll = base_roll / luck_boost
        
        # Ensure we don't go below 0
        return max(0.0, adjusted_roll)
    
    def _get_default_tier_config(self, tier_name: str) -> Dict[str, Any]:
        """Get default configuration for a reward tier."""
        default_configs = {
            "LEGENDARY": {
                "segments": [
                    {"name": "🎮 Gaming Marathon", "type": "game_marathon", "duration": 180, "weight": 1},
                    {"name": "🍕 Food Festival", "type": "food_festival", "duration": 120, "weight": 1},
                ]
            },
            "EPIC": {
                "segments": [
                    {"name": "🎵 Music Session", "type": "music_session", "duration": 90, "weight": 2},
                    {"name": "📱 Social Media", "type": "social_media", "duration": 60, "weight": 2},
                ]
            },
            "RARE": {
                "segments": [
                    {"name": "📺 YouTube", "type": "watch_youtube", "duration": 45, "weight": 3},
                    {"name": "📱 Instagram", "type": "scroll_instagram", "duration": 30, "weight": 3},
                ]
            },
            "COMMON": {
                "segments": [
                    {"name": "☕ Coffee Break", "type": "coffee_break", "duration": 15, "weight": 3},
                    {"name": "📖 Quick Read", "type": "quick_read", "duration": 20, "weight": 2},
                ]
            },
            "NO_REWARD": {
                "segments": [
                    {"name": "📦 Empty Box", "type": "no_reward", "duration": 0, "weight": 1},
                ]
            }
        }
        
        return default_configs.get(tier_name, default_configs["COMMON"])
    
    def _get_default_segment_for_tier(self, tier_name: str) -> Dict[str, Any]:
        """Get a default segment for a reward tier."""
        tier_config = self._get_default_tier_config(tier_name)
        segments = tier_config.get("segments", [])
        
        if segments:
            # Weighted random selection from default segments
            total_weight = sum(seg.get('weight', 1) for seg in segments)
            segment_roll = random.random() * total_weight
            cumulative_weight = 0
            
            for segment in segments:
                cumulative_weight += segment.get('weight', 1)
                if segment_roll <= cumulative_weight:
                    return segment
            
            # Fallback to first segment
            return segments[0]
        else:
            # Ultimate fallback
            return {"name": "☕ Coffee Break", "type": "coffee_break", "duration": 15, "weight": 1}
    
 