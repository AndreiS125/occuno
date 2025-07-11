from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from repositories import UserProfileRepository
from services.gamification_service import GamificationService

router = APIRouter(tags=["user"])

# Dependency injection
def get_user_repo():
    return UserProfileRepository()

def get_gamification_service():
    return GamificationService()

# Request/Response models
class UserProfileResponse(BaseModel):
    id: str
    username: str
    overall_score: int
    current_streak_days: int
    achievements_count: int
    preferred_work_hours: Optional[Dict[str, Any]] = None
    name: Optional[str] = None
    email: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class UpdatePreferencesRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    daily_goal_tasks: Optional[int] = None
    working_hours_start: Optional[str] = None
    working_hours_end: Optional[str] = None
    timezone: Optional[str] = None
    preferred_work_hours: Optional[Dict[str, Any]] = None

class MysteryBoxResponse(BaseModel):
    success: bool
    reward_type: Optional[str] = None
    reward_description: Optional[str] = None
    points_awarded: Optional[int] = None
    boxes_remaining: Optional[int] = None
    celebration: Optional[str] = None
    message: Optional[str] = None

class DailyStatusResponse(BaseModel):
    level: int
    experience_points: int
    experience_to_next_level: int
    current_streak: int
    daily_tasks_completed: int
    daily_task_goal: int
    weekly_rank: int
    mystery_boxes_available: int
    daily_bonus_available: bool
    daily_bonus_message: str
    decay_warning: bool
    days_inactive: int
    psychological_hooks: Dict[str, Any]
    urgency_factors: Dict[str, bool]

class EnhancedGamificationStatsResponse(BaseModel):
    # Core stats
    level: int
    experience_points: int
    experience_to_next_level: int
    progress_to_next_level: float
    overall_score: int
    lifetime_score: int
    
    # Streak system
    current_streak: int
    longest_streak: int
    streak_multiplier: float
    streak_insurance_count: int
    
    # Daily/Weekly progress
    daily_tasks_completed_today: int
    daily_task_goal: int
    weekly_challenge_progress: int
    weekly_challenge_target: int
    weekly_challenge_completed: bool
    
    # Social & Competition
    rank_this_week: int
    rank_last_week: int
    seasonal_rank: int
    
    # Rewards & Bonuses
    mystery_boxes_earned: int
    mystery_boxes_opened: int
    mystery_boxes_available: int
    daily_bonus_available: bool
    consecutive_daily_bonuses: int
    
    # Psychological metrics
    near_miss_count: int
    comeback_bonus_available: bool
    days_since_last_activity: int
    progress_decay_warning: bool
    
    # Achievements
    total_achievements: int
    recent_achievements: List[Dict[str, Any]]

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_repo: UserProfileRepository = Depends(get_user_repo)
):
    """Get the current user's profile."""
    profile = await user_repo.ensure_default_profile()
    
    # Extract preferences if they exist
    preferences = profile.preferred_work_hours or {}
    
    return UserProfileResponse(
        id=str(profile.id),
        username=profile.username,
        overall_score=profile.overall_score,
        current_streak_days=profile.current_streak_days,
        achievements_count=len(profile.achievements),
        preferred_work_hours=profile.preferred_work_hours,
        name=preferences.get("name", profile.username),
        email=preferences.get("email", ""),
        preferences=preferences
    )

@router.put("/preferences")
async def update_preferences(
    request: UpdatePreferencesRequest,
    user_repo: UserProfileRepository = Depends(get_user_repo)
):
    """Update user preferences."""
    # Get the current profile
    profile = await user_repo.ensure_default_profile()
    
    # Get existing preferences or create new dict
    preferences = profile.preferred_work_hours or {}
    
    # Update preferences with new values
    updates_dict = request.dict(exclude_unset=True)
    
    # Store all settings in the preferred_work_hours JSON field
    # (since that's what we have available in the schema)
    if "name" in updates_dict:
        preferences["name"] = updates_dict["name"]
    if "email" in updates_dict:
        preferences["email"] = updates_dict["email"]
    if "theme" in updates_dict:
        preferences["theme"] = updates_dict["theme"]
    if "notifications_enabled" in updates_dict:
        preferences["notifications_enabled"] = updates_dict["notifications_enabled"]
    if "daily_goal_tasks" in updates_dict:
        preferences["daily_goal_tasks"] = updates_dict["daily_goal_tasks"]
    if "working_hours_start" in updates_dict:
        preferences["working_hours_start"] = updates_dict["working_hours_start"]
    if "working_hours_end" in updates_dict:
        preferences["working_hours_end"] = updates_dict["working_hours_end"]
    if "timezone" in updates_dict:
        preferences["timezone"] = updates_dict["timezone"]
    
    # Update the profile with new preferences
    profile = await user_repo.update({"preferred_work_hours": preferences})
    
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    return {"success": True, "message": "Preferences updated", "preferences": preferences}

@router.get("/gamification/stats", response_model=EnhancedGamificationStatsResponse)
async def get_enhanced_gamification_stats(
    user_repo: UserProfileRepository = Depends(get_user_repo)
):
    """Get comprehensive gamification statistics with psychological metrics."""
    profile = await user_repo.ensure_default_profile()
    
    # Calculate progress to next level
    progress_to_next_level = 0.0
    if profile.experience_to_next_level > 0:
        progress_to_next_level = profile.experience_points / profile.experience_to_next_level
    
    # Recent achievements
    recent_achievements = [
        {
            "achievement_id": str(ach.achievement_id),
            "unlocked_at": ach.unlocked_at.isoformat()
        }
        for ach in sorted(
            profile.achievements, 
            key=lambda x: x.unlocked_at, 
            reverse=True
        )[:5]  # Last 5 achievements
    ]
    
    return EnhancedGamificationStatsResponse(
        # Core stats
        level=profile.level,
        experience_points=profile.experience_points,
        experience_to_next_level=profile.experience_to_next_level,
        progress_to_next_level=progress_to_next_level,
        overall_score=profile.overall_score,
        lifetime_score=profile.lifetime_score,
        
        # Streak system
        current_streak=profile.current_streak_days,
        longest_streak=profile.longest_streak,
        streak_multiplier=profile.streak_multiplier,
        streak_insurance_count=profile.streak_insurance_count,
        
        # Daily/Weekly progress
        daily_tasks_completed_today=profile.daily_tasks_completed_today,
        daily_task_goal=profile.daily_task_goal,
        weekly_challenge_progress=profile.weekly_challenge_progress,
        weekly_challenge_target=profile.weekly_challenge_target,
        weekly_challenge_completed=profile.weekly_challenge_completed,
        
        # Social & Competition
        rank_this_week=profile.rank_this_week,
        rank_last_week=profile.rank_last_week,
        seasonal_rank=profile.seasonal_rank,
        
        # Rewards & Bonuses
        mystery_boxes_earned=profile.mystery_boxes_earned,
        mystery_boxes_opened=profile.mystery_boxes_opened,
        mystery_boxes_available=profile.mystery_boxes_earned - profile.mystery_boxes_opened,
        daily_bonus_available=profile.daily_bonus_available,
        consecutive_daily_bonuses=profile.consecutive_daily_bonuses,
        
        # Psychological metrics
        near_miss_count=profile.near_miss_count,
        comeback_bonus_available=profile.comeback_bonus_available,
        days_since_last_activity=profile.days_since_last_activity,
        progress_decay_warning=profile.progress_decay_warning,
        
        # Achievements
        total_achievements=len(profile.achievements),
        recent_achievements=recent_achievements
    )

@router.get("/gamification/daily-status", response_model=DailyStatusResponse)
async def get_daily_status(
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get daily status with psychological hooks and urgency factors."""
    try:
        status = await gamification.get_daily_status()
        return DailyStatusResponse(**status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching daily status: {str(e)}")

@router.post("/gamification/mystery-box", response_model=MysteryBoxResponse)
async def open_mystery_box(
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Open a mystery box and receive variable rewards."""
    try:
        result = await gamification.open_mystery_box()
        return MysteryBoxResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error opening mystery box: {str(e)}")

@router.post("/gamification/daily-bonus")
async def claim_daily_bonus(
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Claim daily bonus if available."""
    try:
        result = await gamification.claim_daily_bonus()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error claiming daily bonus: {str(e)}")

@router.get("/gamification/legacy-stats")
async def get_gamification_stats(
    user_repo: UserProfileRepository = Depends(get_user_repo),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get detailed gamification statistics (legacy endpoint)."""
    profile = await user_repo.ensure_default_profile()
    
    return {
        "overall_score": profile.overall_score,
        "current_streak": {
            "days": profile.current_streak_days,
            "last_check": profile.last_streak_check_date.isoformat() if profile.last_streak_check_date else None
        },
        "achievements": {
            "total_unlocked": len(profile.achievements),
            "recent": [
                {
                    "achievement_id": str(ach.achievement_id),
                    "unlocked_at": ach.unlocked_at.isoformat()
                }
                for ach in sorted(
                    profile.achievements, 
                    key=lambda x: x.unlocked_at, 
                    reverse=True
                )[:5]  # Last 5 achievements
            ]
        }
    }

@router.post("/gamification/check-streak")
async def check_and_update_streak(
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Manually check and update streak status."""
    # Note: This calls the old method, should be updated to use new system
    try:
        user_repo = get_user_repo()
        profile = await user_repo.ensure_default_profile()
        result = await gamification._update_streak_system(profile)
        await user_repo.save_profile(profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating streak: {str(e)}")

@router.post("/gamification/recalculate-level")
async def recalculate_user_level(
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Recalculate user level based on current XP to fix leveling bugs."""
    try:
        result = await gamification.recalculate_user_level()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recalculating level: {str(e)}")

@router.get("/gamification/achievements")
async def get_achievement_definitions(
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get all available achievement definitions."""
    achievements = await gamification.get_user_achievements()
    return [
        {
            "id": ach.id,
            "name": ach.name,
            "description": ach.description,
            "points_value": ach.points_value,
            "criteria_code": ach.criteria_code
        }
        for ach in achievements
    ] 