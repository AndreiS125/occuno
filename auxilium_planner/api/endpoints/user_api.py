from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from uuid import UUID

from repositories.user_profile_repository import UserProfileRepository
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

class CouponResponse(BaseModel):
    id: str
    type: str
    display_name: str
    description: str
    duration_minutes: int
    rarity: str
    expires_at: str
    hours_left: float

class MysteryBoxResponse(BaseModel):
    success: bool
    reward_type: Optional[str] = None
    reward_description: Optional[str] = None
    coupons_earned: Optional[int] = None
    coupon_descriptions: Optional[List[str]] = None
    boxes_remaining: Optional[int] = None
    celebration: Optional[str] = None
    message: Optional[str] = None
    wheel_result: Optional[Dict[str, Any]] = None

class DailyStatusResponse(BaseModel):
    current_coupons: int
    total_coupons_earned: int
    total_coupons_used: int
    mystery_box_progress: int
    mystery_box_needed: int
    mystery_box_progress_pct: float
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
    # Core coupon stats
    current_coupons: int
    total_coupons_earned: int
    total_coupons_used: int
    coupon_usage_rate: float
    
    # Mystery box system
    mystery_box_progress: int
    mystery_box_needed: int
    mystery_box_progress_pct: float
    mystery_boxes_earned: int
    mystery_boxes_opened: int
    mystery_boxes_available: int
    
    # Legacy score tracking
    overall_score: int
    
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
    daily_bonus_available: bool
    consecutive_daily_bonuses: int
    
    # Psychological metrics
    comeback_bonus_available: bool
    days_since_last_activity: int
    progress_decay_warning: bool
    
    # Achievements
    total_achievements: int
    recent_achievements: List[Dict[str, Any]]

class CouponDefinitionResponse(BaseModel):
    coupon_type: str
    display_name: str
    description: str
    duration_minutes: int
    rarity: str

class MysteryBoxRequest(BaseModel):
    frontend_choice: Optional[Dict[str, Any]] = Field(None, description="Frontend wheel choice data")

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
    """Get comprehensive gamification statistics with coupon system."""
    profile = await user_repo.ensure_default_profile()
    
    # Calculate coupon usage rate
    coupon_usage_rate = 0.0
    if profile.total_coupons_earned > 0:
        coupon_usage_rate = profile.total_coupons_used / profile.total_coupons_earned
    
    # Calculate mystery box progress
    mystery_box_progress_pct = 0.0
    if profile.points_per_mystery_box > 0:
        mystery_box_progress_pct = (profile.mystery_box_progress / profile.points_per_mystery_box) * 100
    
    # Current active coupons
    current_coupons = len([c for c in profile.earned_coupons if not c.is_used])
    
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
        # Core coupon stats
        current_coupons=current_coupons,
        total_coupons_earned=profile.total_coupons_earned,
        total_coupons_used=profile.total_coupons_used,
        coupon_usage_rate=coupon_usage_rate,
        
        # Mystery box system
        mystery_box_progress=profile.mystery_box_progress,
        mystery_box_needed=profile.points_per_mystery_box,
        mystery_box_progress_pct=mystery_box_progress_pct,
        mystery_boxes_earned=profile.mystery_boxes_earned,
        mystery_boxes_opened=profile.mystery_boxes_opened,
        mystery_boxes_available=profile.mystery_boxes_earned - profile.mystery_boxes_opened,
        
        # Legacy score tracking
        overall_score=profile.overall_score,
        
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
        daily_bonus_available=profile.daily_bonus_available,
        consecutive_daily_bonuses=profile.consecutive_daily_bonuses,
        
        # Psychological metrics
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
    """Get daily status with coupon system and psychological hooks."""
    try:
        status = await gamification.get_daily_status()
        return DailyStatusResponse(**status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching daily status: {str(e)}")

@router.post("/gamification/mystery-box", response_model=MysteryBoxResponse)
async def open_mystery_box(
    request: MysteryBoxRequest,
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Open a mystery box and receive coupon rewards."""
    try:
        result = await gamification.open_mystery_box(frontend_choice=request.frontend_choice)
        return MysteryBoxResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error opening mystery box: {str(e)}")

@router.post("/gamification/daily-bonus")
async def claim_daily_bonus(
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Claim daily bonus and receive coupon rewards."""
    try:
        result = await gamification.claim_daily_bonus()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error claiming daily bonus: {str(e)}")

@router.get("/coupons", response_model=Dict[str, Any])
async def get_available_coupons(
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get user's available coupons with expiration info."""
    try:
        result = await gamification.get_available_coupons()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching coupons: {str(e)}")

@router.post("/coupons/{coupon_id}/use")
async def use_coupon(
    coupon_id: str,
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Use a coupon to redeem the reward."""
    try:
        coupon_uuid = UUID(coupon_id)
        result = await gamification.use_coupon(coupon_uuid)
        return result
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid coupon ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error using coupon: {str(e)}")

@router.get("/coupons/definitions", response_model=List[CouponDefinitionResponse])
async def get_coupon_definitions(
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get all available coupon types and their properties."""
    try:
        definitions = await gamification.get_coupon_definitions()
        return [
            CouponDefinitionResponse(
                coupon_type=coupon_def.coupon_type.value,
                display_name=coupon_def.display_name,
                description=coupon_def.description,
                duration_minutes=coupon_def.duration_minutes,
                rarity=coupon_def.rarity
            )
            for coupon_def in definitions
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching coupon definitions: {str(e)}")

@router.get("/gamification/legacy-stats")
async def get_gamification_stats(
    user_repo: UserProfileRepository = Depends(get_user_repo),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get detailed gamification statistics (legacy endpoint with coupon support)."""
    profile = await user_repo.ensure_default_profile()
    
    # Current active coupons
    current_coupons = len([c for c in profile.earned_coupons if not c.is_used])
    
    return {
        "overall_score": profile.overall_score,
        "current_coupons": current_coupons,
        "total_coupons_earned": profile.total_coupons_earned,
        "total_coupons_used": profile.total_coupons_used,
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
    try:
        user_repo = get_user_repo()
        profile = await user_repo.ensure_default_profile()
        result = await gamification._update_streak_system(profile)
        await user_repo.save_profile(profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating streak: {str(e)}")

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