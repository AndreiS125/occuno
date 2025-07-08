"""
Gamification Tools for AI Agents

These tools allow agents to manage gamification aspects:
- Check and update user scores
- Manage achievements and streaks
- Track user progress
"""

from typing import Dict, Any
import json
from datetime import datetime

from langchain_core.tools import tool
from repositories.user_profile_repository import UserProfileRepository
from services.gamification_service import GamificationService
from core.logging_config import get_logger
from .objective_tools import safe_json_dumps

logger = get_logger("gamification_tools")


@tool
async def get_gamification_stats() -> str:
    """
    Get current gamification statistics for the user.
    
    Returns:
        JSON string containing user's points, streaks, achievements, etc.
    """
    try:
        user_repo = UserProfileRepository()
        gamification_service = GamificationService()
        
        # Get user profile
        profile = await user_repo.get_default_profile()
        
        if not profile:
            return safe_json_dumps({"error": "User profile not found"})
        
        # Get achievements
        achievements = await gamification_service.get_user_achievements()
        
        stats = {
            "overall_score": profile.overall_score,
            "current_streak_days": profile.current_streak_days,
            "last_streak_check_date": profile.last_streak_check_date.isoformat() if profile.last_streak_check_date else None,
            "achievements": [
                {
                    "id": str(ach.achievement_id),
                    "unlocked_at": ach.unlocked_at.isoformat()
                } for ach in profile.achievements
            ],
            "total_achievements": len(profile.achievements),
            "available_achievements": len(achievements)
        }
        
        return safe_json_dumps(stats, indent=2)
    
    except Exception as e:
        logger.error(f"Error getting gamification stats: {e}")
        return safe_json_dumps({"error": f"Failed to get gamification stats: {str(e)}"})


@tool 
async def update_gamification_stats(stat_type: str, value: int, reason: str = "") -> str:
    """
    Update gamification statistics for the user.
    
    Args:
        stat_type: Type of stat to update ("points", "streak", "reset_streak")
        value: Value to add/set (for points, amount to add; for streak, days to set)
        reason: Optional reason for the update
    
    Returns:
        JSON string confirming the update
    """
    try:
        user_repo = UserProfileRepository()
        profile = await user_repo.get_default_profile()
        
        if not profile:
            return safe_json_dumps({"error": "User profile not found"})
        
        old_score = profile.overall_score
        old_streak = profile.current_streak_days
        
        if stat_type == "points":
            # Add points
            new_score = profile.overall_score + value
            await user_repo.update_score(new_score)
            
            message = f"Added {value} points (was {old_score}, now {new_score})"
            if reason:
                message += f" - {reason}"
            
            logger.info(f"Updated user score: {message}")
            
            return safe_json_dumps({
                "success": True,
                "message": message,
                "old_score": old_score,
                "new_score": new_score,
                "points_added": value
            }, indent=2)
        
        elif stat_type == "streak":
            # Update streak
            updates = {
                "current_streak_days": value,
                "last_streak_check_date": datetime.utcnow()
            }
            await user_repo.update_profile(updates)
            
            message = f"Updated streak to {value} days (was {old_streak})"
            if reason:
                message += f" - {reason}"
            
            logger.info(f"Updated user streak: {message}")
            
            return safe_json_dumps({
                "success": True,
                "message": message,
                "old_streak": old_streak,
                "new_streak": value
            }, indent=2)
        
        elif stat_type == "reset_streak":
            # Reset streak
            updates = {
                "current_streak_days": 0,
                "last_streak_check_date": datetime.utcnow()
            }
            await user_repo.update_profile(updates)
            
            message = f"Reset streak (was {old_streak} days)"
            if reason:
                message += f" - {reason}"
            
            logger.info(f"Reset user streak: {message}")
            
            return safe_json_dumps({
                "success": True,
                "message": message,
                "old_streak": old_streak,
                "new_streak": 0
            }, indent=2)
        
        else:
            return safe_json_dumps({"error": f"Unknown stat_type: {stat_type}. Use 'points', 'streak', or 'reset_streak'"})
    
    except Exception as e:
        logger.error(f"Error updating gamification stats: {e}")
        return safe_json_dumps({"error": f"Failed to update gamification stats: {str(e)}"})


@tool
async def check_achievements() -> str:
    """
    Check for new achievements the user may have unlocked.
    
    Returns:
        JSON string with any new achievements unlocked
    """
    try:
        gamification_service = GamificationService()
        
        # Check for new achievements
        new_achievements = await gamification_service.check_for_new_achievements()
        
        if new_achievements:
            achievement_names = [ach.name for ach in new_achievements]
            message = f"Unlocked {len(new_achievements)} new achievements: {', '.join(achievement_names)}"
            
            logger.info(f"New achievements unlocked: {achievement_names}")
            
            return safe_json_dumps({
                "success": True,
                "message": message,
                "new_achievements": [
                    {
                        "name": ach.name,
                        "description": ach.description,
                        "points_value": ach.points_value
                    } for ach in new_achievements
                ],
                "count": len(new_achievements)
            }, indent=2)
        else:
            return safe_json_dumps({
                "success": True,
                "message": "No new achievements unlocked",
                "new_achievements": [],
                "count": 0
            }, indent=2)
    
    except Exception as e:
        logger.error(f"Error checking achievements: {e}")
        return safe_json_dumps({"error": f"Failed to check achievements: {str(e)}"})


@tool
async def get_achievement_progress() -> str:
    """
    Get progress towards available achievements.
    
    Returns:
        JSON string with achievement progress information
    """
    try:
        gamification_service = GamificationService()
        user_repo = UserProfileRepository()
        
        profile = await user_repo.get_default_profile()
        if not profile:
            return safe_json_dumps({"error": "User profile not found"})
        
        # Get all available achievements
        all_achievements = await gamification_service.get_user_achievements()
        unlocked_ids = [str(ach.achievement_id) for ach in profile.achievements]
        
        progress_info = []
        
        for achievement in all_achievements:
            is_unlocked = str(achievement.id) in unlocked_ids
            
            # Simple progress calculation based on score and streak
            progress = 0
            if not is_unlocked:
                # This is a simplified progress calculation
                # In a real implementation, you'd evaluate the criteria_code
                if "score" in achievement.criteria_code.lower():
                    progress = min(100, (profile.overall_score / 1000) * 100)
                elif "streak" in achievement.criteria_code.lower():
                    progress = min(100, (profile.current_streak_days / 30) * 100)
            else:
                progress = 100
            
            progress_info.append({
                "name": achievement.name,
                "description": achievement.description,
                "points_value": achievement.points_value,
                "unlocked": is_unlocked,
                "progress_percent": round(progress, 1)
            })
        
        return safe_json_dumps({
            "achievements": progress_info,
            "total_achievements": len(all_achievements),
            "unlocked_count": len(unlocked_ids)
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Error getting achievement progress: {e}")
        return safe_json_dumps({"error": f"Failed to get achievement progress: {str(e)}"}) 