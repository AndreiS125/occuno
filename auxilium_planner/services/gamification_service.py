from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import json
import random
import math

from domain.models import (
    UserProfile, UserAchievement, AchievementDefinition,
    Objective, Task, ObjectiveStatus, ObjectiveType
)
from repositories import UserProfileRepository, ObjectiveRepository
from core.config import settings

class GamificationService:
    """Service for managing addictive gamification features using psychological principles."""
    
    def __init__(self):
        self.user_repo = UserProfileRepository()
        self.objective_repo = ObjectiveRepository()
        self._achievement_definitions = self._load_achievement_definitions()
    
    def _load_achievement_definitions(self) -> List[AchievementDefinition]:
        """Load achievement definitions with rarity tiers and psychological hooks."""
        return [
            # Common Achievements (High dopamine frequency)
            AchievementDefinition(
                id="first_steps",
                name="🌟 First Steps",
                description="Your journey begins! Complete your first task",
                criteria_code="completed_tasks >= 1",
                points_value=50
            ),
            AchievementDefinition(
                id="quick_starter",
                name="⚡ Quick Starter", 
                description="Complete a task within 30 minutes",
                criteria_code="quick_completions >= 1",
                points_value=75
            ),
            AchievementDefinition(
                id="daily_hero",
                name="🦸 Daily Hero",
                description="Complete 3 tasks in a single day",
                criteria_code="daily_tasks_today >= 3",
                points_value=100
            ),
            
            # Rare Achievements (Medium frequency, higher value)
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
                id="perfectionist",
                name="✨ Perfectionist",
                description="Complete 10 tasks early (Rare)",
                criteria_code="early_completions >= 10",
                points_value=400
            ),
            
            # Epic Achievements (Low frequency, very high value)
            AchievementDefinition(
                id="legend_status",
                name="👑 Legend Status",
                description="Reach level 10 (Epic)",
                criteria_code="level >= 10",
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
                id="master_planner",
                name="🧠 Master Planner",
                description="Create objectives with 10+ sub-tasks (Epic)",
                criteria_code="max_decomposition >= 10",
                points_value=1500
            ),
            
            # Limited-Time Achievements (FOMO)
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
    
    async def process_task_completion(self, task_id: UUID) -> Dict[str, Any]:
        """Process gamification with variable ratio reinforcement and psychological hooks."""
        task = await self.objective_repo.get_by_id(task_id)
        if not task or task.status != ObjectiveStatus.COMPLETED:
            return {"success": False, "message": "Task not found or not completed"}
        
        user_profile = await self.user_repo.ensure_default_profile()
        
        # === VARIABLE RATIO REINFORCEMENT (Slot Machine Psychology) ===
        base_points = settings.points_per_task
        
        # Random bonus multiplier (25% chance for 2x, 5% chance for 5x, 1% chance for 10x)
        bonus_roll = random.random()
        bonus_multiplier = 1.0
        bonus_message = ""
        
        if bonus_roll < 0.01:  # 1% - JACKPOT!
            bonus_multiplier = 10.0
            bonus_message = "🎰 JACKPOT! 10x POINTS!"
        elif bonus_roll < 0.05:  # 5% - Big Win
            bonus_multiplier = 5.0  
            bonus_message = "💎 BIG WIN! 5x POINTS!"
        elif bonus_roll < 0.25:  # 25% - Nice bonus
            bonus_multiplier = 2.0
            bonus_message = "⭐ BONUS! 2x POINTS!"
        
        # Apply luck factor from user profile
        bonus_multiplier *= user_profile.luck_factor
        
        # Calculate points with complexity/priority
        complexity_bonus = int(base_points * task.complexity_score)
        priority_bonus = int(base_points * task.priority_score)
        
        # === STREAK SYSTEM WITH LOSS AVERSION ===
        streak_multiplier = 1.0 + (user_profile.current_streak_days * 0.1)  # 10% per day
        if user_profile.current_streak_days >= 7:
            streak_multiplier += 0.5  # Extra bonus for week+
        
        # === NEAR-MISS DETECTION (Gambling Psychology) ===
        near_miss_bonus = 0
        if bonus_roll >= 0.01 and bonus_roll <= 0.02:  # Just missed jackpot
            near_miss_bonus = 50
            user_profile.near_miss_count += 1
            bonus_message += " 🎯 So close to JACKPOT! (+50 consolation)"
        
        # === TIMELINESS PSYCHOLOGY ===
        timeliness_bonus = 0
        urgency_message = ""
        if task.due_date:
            now = datetime.utcnow().replace(tzinfo=task.due_date.tzinfo) if task.due_date.tzinfo else datetime.utcnow()
            task_due = task.due_date.replace(tzinfo=None) if task.due_date.tzinfo else task.due_date
            now_naive = now.replace(tzinfo=None) if now.tzinfo else now
            
            days_early = (task_due - now_naive).days
            if days_early > 0:
                timeliness_bonus = min(days_early * 10, 100)  # Up to 100 bonus
                urgency_message = f"⚡ Early completion! +{timeliness_bonus} points"
                task.completion_timeliness_score = 1.0
            elif days_early < 0:  # Late but still completed
                urgency_message = "⚠️ Late completion, but good job not giving up!"
                task.completion_timeliness_score = -0.5
        
        # === FINAL CALCULATION ===
        total_points = int((base_points + complexity_bonus + priority_bonus + timeliness_bonus + near_miss_bonus) * bonus_multiplier * streak_multiplier)
        
        # === LEVEL UP SYSTEM WITH EXPONENTIAL REQUIREMENTS (FIXED) ===
        old_level = user_profile.level
        user_profile.experience_points += total_points
        
        # Debug logging for leveling issues
        print(f"🔧 Before leveling: Level {user_profile.level}, XP {user_profile.experience_points}, Need {user_profile.experience_to_next_level}")
        
        # Use the fixed leveling logic that doesn't consume XP
        level_data = await self._recalculate_level_properly(user_profile)
        
        print(f"🔧 After leveling: Level {user_profile.level}, XP {user_profile.experience_points}, Need {user_profile.experience_to_next_level}")
        
        level_up_message = ""
        if level_data["level_up_occurred"]:
            level_up_message = f"🎉 LEVEL UP! You are now Level {level_data['level']}!"
            # Level up rewards
            level_bonus = level_data["level"] * 50
            total_points += level_bonus
            level_up_message += f" (+{level_bonus} bonus points!)"
        
        # === DAILY PROGRESS TRACKING ===
        user_profile.daily_tasks_completed_today += 1
        daily_goal_progress = user_profile.daily_tasks_completed_today / user_profile.daily_task_goal
        
        # === MYSTERY BOX SYSTEM (Loot Box Psychology) ===
        mystery_box_earned = False
        if random.random() < 0.15:  # 15% chance
            user_profile.mystery_boxes_earned += 1
            mystery_box_earned = True
        
        # === COMEBACK BONUS (Loss Aversion Recovery) ===
        comeback_bonus = 0
        if user_profile.comeback_bonus_available:
            comeback_bonus = 100
            user_profile.comeback_bonus_available = False
            bonus_message += " 💪 Comeback bonus activated! +100"
        
        # Update user totals
        user_profile.overall_score += total_points
        user_profile.lifetime_score += total_points
        
        # === ACHIEVEMENT CHECKING ===
        unlocked_achievements = await self._check_achievements(user_profile)
        
        # === STREAK UPDATE ===
        streak_result = await self._update_streak_system(user_profile)
        
        # === WEEKLY CHALLENGE PROGRESS ===
        weekly_progress = await self._update_weekly_challenge(user_profile)
        
        # Save updated profile
        await self.user_repo.save_profile(user_profile)
        
        # === RESPONSE WITH PSYCHOLOGICAL HOOKS ===
        response = {
            "success": True,
            "points_awarded": total_points,
            "bonus_message": bonus_message,
            "urgency_message": urgency_message,
            "level_up_message": level_up_message,
            "breakdown": {
                "base": base_points,
                "complexity": complexity_bonus,
                "priority": priority_bonus,
                "timeliness": timeliness_bonus,
                "bonus_multiplier": bonus_multiplier,
                "streak_multiplier": streak_multiplier,
                "near_miss_bonus": near_miss_bonus,
                "comeback_bonus": comeback_bonus
            },
            "current_level": user_profile.level,
            "experience_points": user_profile.experience_points,
            "experience_to_next_level": user_profile.experience_to_next_level,
            "progress_to_next_level": level_data["progress_to_next_level"],
            "daily_progress": {
                "completed": user_profile.daily_tasks_completed_today,
                "goal": user_profile.daily_task_goal,
                "percentage": min(daily_goal_progress * 100, 100)
            },
            "mystery_box_earned": mystery_box_earned,
            "mystery_boxes_available": user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened,
            "unlocked_achievements": unlocked_achievements,
            "streak": streak_result,
            "weekly_challenge": weekly_progress,
            "psychological_hooks": await self._generate_psychological_hooks(user_profile)
        }
        
        return response
    
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
            user_level_modifier = user_profile.level // 3  # Harder challenges as you level
            randomness = random.randint(-2, 3)
            user_profile.weekly_challenge_target = max(3, base_target + user_level_modifier + randomness)
        
        # Update progress
        user_profile.weekly_challenge_progress += 1
        
        # Check completion
        challenge_completed = user_profile.weekly_challenge_progress >= user_profile.weekly_challenge_target
        if challenge_completed and not user_profile.weekly_challenge_completed:
            user_profile.weekly_challenge_completed = True
            challenge_reward = user_profile.weekly_challenge_target * 50
            user_profile.overall_score += challenge_reward
        
        # Generate urgency message
        days_left = 7 - datetime.utcnow().weekday()
        progress_pct = (user_profile.weekly_challenge_progress / user_profile.weekly_challenge_target) * 100
        
        if challenge_completed:
            urgency_message = "🏆 Weekly challenge completed! Bonus points awarded!"
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
        """Achievement system with psychological rarity and surprise."""
        unlocked = []
        
        # Get current stats
        all_objectives = await self.objective_repo.get_all()
        completed_tasks = len([
            obj for obj in all_objectives 
            if obj.objective_type == ObjectiveType.TASK and obj.status == ObjectiveStatus.COMPLETED
        ])
        
        # Build evaluation context
        context = {
            "completed_tasks": completed_tasks,
            "level": user_profile.level,
            "current_streak": user_profile.current_streak_days,
            "daily_tasks_today": user_profile.daily_tasks_completed_today,
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
        """Generate messages designed to increase engagement."""
        hooks = []
        
        # Calculate correct progress percentage first
        level_data = await self._recalculate_level_properly(user_profile)
        level_progress = level_data["progress_to_next_level"] * 100
        
        # Progress illusion
        if level_progress > 80:
            hooks.append(f"🎯 You're {100-level_progress:.0f}% away from Level {user_profile.level + 1}!")
        
        # Social comparison (simulated)
        if user_profile.rank_this_week > user_profile.rank_last_week:
            hooks.append(f"📈 You've climbed {user_profile.rank_last_week - user_profile.rank_this_week} ranks this week!")
        
        # FOMO for daily bonus
        if user_profile.daily_bonus_available:
            hooks.append("⏰ Don't forget your daily bonus! Available for next few hours.")
        
        # Near-miss pressure
        if user_profile.near_miss_count > 0:
            hooks.append("🎰 You've been close to jackpots! Keep going for the big win!")
        
        # Streak pressure
        if user_profile.current_streak_days >= 3:
            hooks.append(f"🔥 Don't break your {user_profile.current_streak_days}-day streak!")
        
        # Mystery boxes
        available_boxes = user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened
        if available_boxes > 0:
            hooks.append(f"📦 {available_boxes} mystery boxes waiting! What will you find?")
        
        return {
            "engagement_messages": hooks,
            "progress_pressure": level_progress > 75,
            "streak_anxiety": user_profile.current_streak_days >= 5,
            "fomo_active": len(user_profile.limited_time_achievements_available) > 0
        }
    
    async def open_mystery_box(self) -> Dict[str, Any]:
        """Open a mystery box with variable rewards (loot box psychology)."""
        user_profile = await self.user_repo.ensure_default_profile()
        
        available_boxes = user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened
        if available_boxes <= 0:
            return {"success": False, "message": "No mystery boxes available"}
        
        user_profile.mystery_boxes_opened += 1
        
        # Variable reward table (designed to be addictive)
        roll = random.random()
        
        if roll < 0.01:  # 1% - LEGENDARY
            reward_points = 1000
            reward_type = "LEGENDARY"
            reward_description = "💎 LEGENDARY REWARD! 1000 Points!"
        elif roll < 0.05:  # 5% - Epic  
            reward_points = 500
            reward_type = "EPIC"
            reward_description = "⭐ Epic Reward! 500 Points!"
        elif roll < 0.20:  # 20% - Rare
            reward_points = 200
            reward_type = "RARE"
            reward_description = "🎁 Rare Reward! 200 Points!"
        else:  # 75% - Common
            reward_points = 50
            reward_type = "COMMON"
            reward_description = "✨ Common Reward! 50 Points!"
        
        # Sometimes give streak insurance instead
        if roll > 0.95 and user_profile.streak_insurance_count < 3:
            user_profile.streak_insurance_count += 1
            reward_description = "🛡️ SPECIAL: Streak Insurance! Protects your streak once."
            reward_points = 0
        else:
            user_profile.overall_score += reward_points
            user_profile.experience_points += reward_points
            
            # Apply level up logic for mystery box rewards (FIXED)
            await self._recalculate_level_properly(user_profile)
        
        await self.user_repo.save_profile(user_profile)
        
        return {
            "success": True,
            "reward_type": reward_type,
            "reward_description": reward_description,
            "points_awarded": reward_points,
            "boxes_remaining": user_profile.mystery_boxes_earned - user_profile.mystery_boxes_opened,
            "celebration": f"🎉 {reward_description}"
        }
    
    async def get_daily_status(self) -> Dict[str, Any]:
        """Get daily status with psychological pressure and FOMO."""
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
        
        await self.user_repo.save_profile(user_profile)
        
        return {
            "level": user_profile.level,
            "experience_points": user_profile.experience_points,
            "experience_to_next_level": user_profile.experience_to_next_level,
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
                "almost_level_up": False  # This will be updated properly below
            }
        }

    async def claim_daily_bonus(self) -> Dict[str, Any]:
        """Claim daily bonus with variable rewards and psychological satisfaction."""
        user_profile = await self.user_repo.ensure_default_profile()
        
        if not user_profile.daily_bonus_available:
            return {
                "success": False, 
                "message": "Daily bonus already claimed or not available"
            }
        
        # Variable daily bonus rewards (psychological reinforcement)
        roll = random.random()
        
        if roll < 0.05:  # 5% - Big bonus day!
            bonus_points = 200
            bonus_type = "BIG"
            bonus_message = "🎉 BIG BONUS DAY! +200 points!"
        elif roll < 0.25:  # 25% - Good bonus
            bonus_points = 100  
            bonus_type = "GOOD"
            bonus_message = "⭐ Great bonus! +100 points!"
        else:  # 70% - Standard bonus
            bonus_points = 50
            bonus_type = "STANDARD"
            bonus_message = "✨ Daily bonus! +50 points!"
        
        # Apply consecutive bonus multiplier
        consecutive_multiplier = 1.0 + (user_profile.consecutive_daily_bonuses * 0.1)  # 10% per consecutive day
        bonus_points = int(bonus_points * consecutive_multiplier)
        
        if consecutive_multiplier > 1.0:
            bonus_message += f" (x{consecutive_multiplier:.1f} consecutive bonus!)"
        
        # Award points
        user_profile.overall_score += bonus_points
        user_profile.experience_points += bonus_points
        
        # Apply level up logic for daily bonus (FIXED)
        await self._recalculate_level_properly(user_profile)
        
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
            "points_awarded": bonus_points,
            "consecutive_days": user_profile.consecutive_daily_bonuses,
            "message": bonus_message,
            "extra_rewards": extra_rewards,
            "celebration": f"🎁 {bonus_message}"
        }
    
    async def process_objective_completion(self, objective_id: UUID) -> Dict[str, Any]:
        """Process objective completion with enhanced rewards."""
        objective = await self.objective_repo.get_by_id(objective_id)
        if not objective or objective.status != ObjectiveStatus.COMPLETED:
            return {"success": False, "message": "Objective not found or not completed"}
        
        user_profile = await self.user_repo.ensure_default_profile()
        
        # Objectives are worth more and have higher bonus chances
        base_points = settings.points_per_objective
        
        # Higher bonus rates for objectives
        bonus_roll = random.random()
        bonus_multiplier = 1.0
        bonus_message = ""
        
        if bonus_roll < 0.02:  # 2% - MEGA JACKPOT for objectives!
            bonus_multiplier = 15.0
            bonus_message = "🎰 MEGA JACKPOT! 15x POINTS for completing an objective!"
        elif bonus_roll < 0.10:  # 10% - Big Win
            bonus_multiplier = 5.0  
            bonus_message = "💎 OBJECTIVE BONUS! 5x POINTS!"
        elif bonus_roll < 0.35:  # 35% - Nice bonus
            bonus_multiplier = 3.0
            bonus_message = "⭐ BIG OBJECTIVE BONUS! 3x POINTS!"
        
        complexity_bonus = int(base_points * objective.complexity_score)
        completion_bonus = 100  # Flat bonus for objectives
        
        total_points = int((base_points + complexity_bonus + completion_bonus) * bonus_multiplier)
        
        # Major XP boost
        user_profile.experience_points += total_points
        user_profile.overall_score += total_points
        user_profile.lifetime_score += total_points
        
        # Apply level up logic for objective completion (FIXED)
        await self._recalculate_level_properly(user_profile)
        
        # Higher chance for mystery box
        if random.random() < 0.4:  # 40% chance for objectives
            user_profile.mystery_boxes_earned += 1
        
        # Check achievements
        unlocked_achievements = await self._check_achievements(user_profile)
        
        await self.user_repo.save_profile(user_profile)
        
        return {
            "success": True,
            "points_awarded": total_points,
            "bonus_message": bonus_message,
            "celebration": f"🏆 OBJECTIVE COMPLETE! +{total_points} points!",
            "unlocked_achievements": unlocked_achievements,
            "mystery_box_chance": True
        }
    
    async def _recalculate_level_properly(self, user_profile: UserProfile) -> Dict[str, Any]:
        """Properly recalculate user level based on cumulative XP without consuming XP."""
        total_cumulative_xp = user_profile.experience_points
        
        # Calculate correct level based on exponential progression  
        current_level = 1
        xp_for_current_level = 100  # XP needed to advance from level 1 to 2
        total_xp_consumed = 0
        
        # Calculate level by finding which threshold the user's XP falls into
        while total_xp_consumed + xp_for_current_level <= total_cumulative_xp:
            total_xp_consumed += xp_for_current_level
            current_level += 1
            xp_for_current_level = int(xp_for_current_level * 1.15)  # 15% increase per level
        
        # Calculate progress within current level
        xp_earned_in_current_level = total_cumulative_xp - total_xp_consumed
        xp_needed_for_next = xp_for_current_level - xp_earned_in_current_level
        
        # Calculate correct progress percentage (0.0 to 1.0)
        progress_to_next_level = 0.0
        if xp_for_current_level > 0:
            progress_to_next_level = xp_earned_in_current_level / xp_for_current_level
        
        # Update user profile with correct values
        old_level = user_profile.level
        user_profile.level = current_level
        user_profile.experience_to_next_level = xp_needed_for_next
        
        # Log level ups for achievements
        level_up_occurred = current_level > old_level
        if level_up_occurred:
            print(f"🎉 Level up! Level {old_level} → {current_level}")
            # Award level-up achievements
            await self.award_level_achievement(current_level)
            
        return {
            "level": current_level,
            "experience_points": total_cumulative_xp,
            "experience_to_next_level": xp_needed_for_next,
            "progress_to_next_level": progress_to_next_level,
            "xp_earned_in_current_level": xp_earned_in_current_level,
            "xp_required_for_current_level": xp_for_current_level,
            "level_up_occurred": level_up_occurred,
            "old_level": old_level
        }

    async def award_level_achievement(self, level: int) -> None:
        """Award achievements for reaching certain levels."""
        # This could be expanded to give specific achievements for milestone levels
        # For now, just log the level up
        print(f"🏆 Level {level} achievement unlocked!")
        
        # Future: Could award special achievements for levels 5, 10, 25, 50, etc.
        # milestone_levels = [5, 10, 25, 50, 100]
        # if level in milestone_levels:
        #     # Award special achievement
        #     pass

    async def recalculate_user_level(self) -> Dict[str, Any]:
        """Recalculate user level based on current XP to fix leveling bugs."""
        user_profile = await self.user_repo.ensure_default_profile()
        
        old_level = user_profile.level
        old_xp = user_profile.experience_points
        old_required = user_profile.experience_to_next_level
        
        # Fix: experience_points should be TOTAL CUMULATIVE XP, never decreases
        total_cumulative_xp = user_profile.experience_points
        
        # If the XP seems too low (like the user got reset), restore from lifetime_score
        # This is a one-time fix for users who got their XP destroyed
        if total_cumulative_xp < 500 and user_profile.lifetime_score > 1000:
            # Estimate XP from lifetime score (approximate restoration)
            total_cumulative_xp = min(user_profile.lifetime_score // 2, 2000)  # Conservative estimate
            print(f"🔧 Restoring XP from lifetime score: {total_cumulative_xp}")
        
        print(f"🔧 Recalculating levels: Starting with {total_cumulative_xp} total cumulative XP")
        
        # Calculate correct level based on exponential progression
        # Level 1: 0-99 XP (needs 100 to advance)
        # Level 2: 100-214 XP (needs 115 to advance)  
        # Level 3: 215-345 XP (needs 131 to advance)
        # etc.
        
        current_level = 1
        xp_for_current_level = 100  # XP needed to advance from level 1 to 2
        total_xp_consumed = 0
        
        # Calculate level by finding which threshold the user's XP falls into
        while total_xp_consumed + xp_for_current_level <= total_cumulative_xp:
            total_xp_consumed += xp_for_current_level
            current_level += 1
            xp_for_current_level = int(xp_for_current_level * 1.15)  # 15% increase per level
            print(f"🔧 Level {current_level}: Total consumed {total_xp_consumed}, Next requires {xp_for_current_level}")
        
        # Calculate remaining XP needed for next level
        xp_toward_next = total_cumulative_xp - total_xp_consumed
        xp_needed_for_next = xp_for_current_level - xp_toward_next
        
        # Update user profile with correct values
        user_profile.level = current_level
        user_profile.experience_points = total_cumulative_xp  # TOTAL cumulative XP
        user_profile.experience_to_next_level = xp_needed_for_next  # Remaining XP needed
        
        # Save the corrected profile
        await self.user_repo.save_profile(user_profile)
        
        print(f"🔧 Final result: Level {current_level}, Total XP {total_cumulative_xp}, Need {xp_needed_for_next} more")
        
        return {
            "success": True,
            "message": "Level recalculated successfully with proper cumulative XP tracking!",
            "changes": {
                "old_level": old_level,
                "new_level": user_profile.level,
                "old_xp": old_xp,
                "new_xp": user_profile.experience_points,
                "old_required": old_required,
                "new_required": user_profile.experience_to_next_level
            },
            "current_stats": {
                "level": user_profile.level,
                "experience_points": user_profile.experience_points,
                "experience_to_next_level": user_profile.experience_to_next_level,
                "progress_percentage": ((user_profile.experience_points - total_xp_consumed) / xp_for_current_level) * 100
            }
        }
    
    async def get_user_achievements(self) -> List[AchievementDefinition]:
        """Get all available achievement definitions for the frontend."""
        return self._achievement_definitions 