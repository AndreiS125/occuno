from typing import Optional, Dict, Any
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

@router.get("/gamification/stats")
async def get_gamification_stats(
    user_repo: UserProfileRepository = Depends(get_user_repo),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get detailed gamification statistics."""
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
    result = await gamification._update_streak()
    return result 