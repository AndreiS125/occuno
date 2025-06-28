from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import json

from domain.models import (
    UserProfile, UserAchievement, AchievementDefinition,
    Objective, Task, ObjectiveStatus
)
from repositories import UserProfileRepository, ObjectiveRepository
from core.config import settings

class GamificationService:
    """Service for managing gamification features."""
    
    def __init__(self):
        self.user_repo = UserProfileRepository()
        self.objective_repo = ObjectiveRepository()
        self._achievement_definitions = self._load_achievement_definitions()
    
    def _load_achievement_definitions(self) -> List[AchievementDefinition]:
        """Load achievement definitions."""
        # For now, hardcode some achievements
        # In a real app, these would be loaded from a file or database
        return [
            AchievementDefinition(
                name="First Steps",
                description="Complete your first task",
                criteria_code="completed_tasks >= 1",
                points_value=50
            ),
            AchievementDefinition(
                name="Task Master",
                description="Complete 10 tasks",
                criteria_code="completed_tasks >= 10",
                points_value=100
            ),
            AchievementDefinition(
                name="Goal Getter",
                description="Complete your first major objective",
                criteria_code="completed_objectives >= 1",
                points_value=200
            ),
            AchievementDefinition(
                name="Streak Starter",
                description="Maintain a 3-day streak",
                criteria_code="current_streak >= 3",
                points_value=75
            ),
            AchievementDefinition(
                name="Week Warrior",
                description="Maintain a 7-day streak",
                criteria_code="current_streak >= 7",
                points_value=150
            ),
            AchievementDefinition(
                name="Planning Pro",
                description="Create a detailed plan with 5+ sub-objectives",
                criteria_code="max_decomposition >= 5",
                points_value=100
            ),
            AchievementDefinition(
                name="Early Bird",
                description="Complete a task before its deadline",
                criteria_code="early_completions >= 1",
                points_value=50
            )
        ]
    
    async def process_task_completion(self, task_id: UUID) -> Dict[str, Any]:
        """Process gamification for task completion."""
        task = await self.objective_repo.get_by_id(task_id)
        if not task or task.status != ObjectiveStatus.COMPLETED:
            return {"success": False, "message": "Task not found or not completed"}
        
        user_profile = await self.user_repo.ensure_default_profile()
        
        # Calculate points
        base_points = settings.points_per_task
        complexity_bonus = int(base_points * task.complexity_score)
        priority_bonus = int(base_points * task.priority_score)
        
        # Check timeliness
        timeliness_bonus = 0
        if task.due_date:
            days_early = (task.due_date - datetime.utcnow()).days
            if days_early > 0:
                timeliness_bonus = min(days_early * 5, 50)  # Max 50 bonus points
                task.completion_timeliness_score = 1.0
            else:
                timeliness_bonus = max(days_early * 2, -20)  # Max 20 penalty points
                task.completion_timeliness_score = -1.0
        
        total_points = base_points + complexity_bonus + priority_bonus + timeliness_bonus
        
        # Update user score
        await self.user_repo.update_score(total_points)
        
        # Check for achievements
        unlocked_achievements = await self._check_achievements(user_profile)
        
        # Update streak
        streak_result = await self._update_streak()
        
        return {
            "success": True,
            "points_awarded": total_points,
            "breakdown": {
                "base": base_points,
                "complexity": complexity_bonus,
                "priority": priority_bonus,
                "timeliness": timeliness_bonus
            },
            "new_total_score": user_profile.overall_score + total_points,
            "unlocked_achievements": unlocked_achievements,
            "streak": streak_result
        }
    
    async def process_objective_completion(self, objective_id: UUID) -> Dict[str, Any]:
        """Process gamification for objective completion."""
        objective = await self.objective_repo.get_by_id(objective_id)
        if not objective or objective.status != ObjectiveStatus.COMPLETED:
            return {"success": False, "message": "Objective not found or not completed"}
        
        user_profile = await self.user_repo.ensure_default_profile()
        
        # Calculate points (objectives worth more)
        base_points = settings.points_per_objective
        complexity_bonus = int(base_points * objective.complexity_score)
        
        # Bonus for completing all sub-objectives
        children = await self.objective_repo.get_by_parent(objective_id)
        all_children_complete = all(
            child.status == ObjectiveStatus.COMPLETED for child in children
        )
        completion_bonus = 50 if all_children_complete else 0
        
        total_points = base_points + complexity_bonus + completion_bonus
        
        # Update user score
        await self.user_repo.update_score(total_points)
        
        # Check for achievements
        unlocked_achievements = await self._check_achievements(user_profile)
        
        return {
            "success": True,
            "points_awarded": total_points,
            "breakdown": {
                "base": base_points,
                "complexity": complexity_bonus,
                "completion": completion_bonus
            },
            "new_total_score": user_profile.overall_score + total_points,
            "unlocked_achievements": unlocked_achievements
        }
    
    async def _update_streak(self) -> Dict[str, Any]:
        """Update user's streak based on activity."""
        user_profile = await self.user_repo.ensure_default_profile()
        now = datetime.utcnow()
        
        # Check if user has completed any significant task today
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        all_objectives = await self.objective_repo.get_all()
        
        today_completions = [
            obj for obj in all_objectives
            if (obj.status == ObjectiveStatus.COMPLETED and
                obj.updated_at >= today_start and
                (obj.priority_score >= 0.5 or obj.complexity_score >= 0.5))
        ]
        
        if not today_completions:
            return {
                "streak_updated": False,
                "current_streak": user_profile.current_streak_days,
                "message": "No significant tasks completed today"
            }
        
        # Update streak
        if not user_profile.last_streak_check_date:
            new_streak = 1
        else:
            days_since_last = (now.date() - user_profile.last_streak_check_date.date()).days
            
            if days_since_last == 0:
                # Already updated today
                return {
                    "streak_updated": False,
                    "current_streak": user_profile.current_streak_days,
                    "message": "Streak already updated today"
                }
            elif days_since_last == 1:
                # Consecutive day
                new_streak = user_profile.current_streak_days + 1
            else:
                # Streak broken
                new_streak = 1
        
        await self.user_repo.update_streak(new_streak, now)
        
        # Bonus points for maintaining streak
        streak_bonus = 0
        if new_streak >= 7:
            streak_bonus = 20
        elif new_streak >= 3:
            streak_bonus = 10
        
        if streak_bonus > 0:
            await self.user_repo.update_score(streak_bonus)
        
        return {
            "streak_updated": True,
            "current_streak": new_streak,
            "previous_streak": user_profile.current_streak_days,
            "streak_bonus_points": streak_bonus
        }
    
    async def _check_achievements(self, user_profile: UserProfile) -> List[Dict[str, Any]]:
        """Check and unlock new achievements."""
        unlocked = []
        
        # Get current stats
        all_objectives = await self.objective_repo.get_all()
        completed_tasks = len([
            obj for obj in all_objectives 
            if obj.objective_type == "TASK" and obj.status == ObjectiveStatus.COMPLETED
        ])
        completed_objectives = len([
            obj for obj in all_objectives 
            if obj.objective_type != "TASK" and obj.status == ObjectiveStatus.COMPLETED
        ])
        
        # Check each achievement
        for achievement_def in self._achievement_definitions:
            # Skip if already unlocked
            if any(ach.achievement_id == achievement_def.id for ach in user_profile.achievements):
                continue
            
            # Evaluate criteria (simplified - in production would use safe eval)
            context = {
                "completed_tasks": completed_tasks,
                "completed_objectives": completed_objectives,
                "current_streak": user_profile.current_streak_days,
                "overall_score": user_profile.overall_score
            }
            
            # Simple criteria evaluation (in production, use a proper expression evaluator)
            criteria_met = False
            if "completed_tasks >= " in achievement_def.criteria_code:
                required = int(achievement_def.criteria_code.split(" >= ")[1])
                criteria_met = completed_tasks >= required
            elif "completed_objectives >= " in achievement_def.criteria_code:
                required = int(achievement_def.criteria_code.split(" >= ")[1])
                criteria_met = completed_objectives >= required
            elif "current_streak >= " in achievement_def.criteria_code:
                required = int(achievement_def.criteria_code.split(" >= ")[1])
                criteria_met = user_profile.current_streak_days >= required
            
            if criteria_met:
                # Unlock achievement
                new_achievement = UserAchievement(
                    achievement_id=achievement_def.id,
                    unlocked_at=datetime.utcnow()
                )
                await self.user_repo.add_achievement(new_achievement)
                await self.user_repo.update_score(achievement_def.points_value)
                
                unlocked.append({
                    "name": achievement_def.name,
                    "description": achievement_def.description,
                    "points": achievement_def.points_value
                })
        
        return unlocked 