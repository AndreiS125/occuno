from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from uuid import UUID

from repositories.sqlite_user_profile_repository import SQLiteUserProfileRepository
from services.gamification_service import GamificationService

router = APIRouter(tags=["user"])

# Dependency injection - fixed to use SQLite version
def get_user_repo():
    return SQLiteUserProfileRepository()

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
    backend_selection: Optional[Dict[str, Any]] = None  # NEW: Backend selection for frontend wheel

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
    
    # XP/Level system - NEW
    experience_points: int
    level: int
    experience_to_next_level: int
    total_experience_earned: int
    progress_to_next_level: float  # 0.0 to 1.0
    
    # Mystery box system (now level-based)
    mystery_box_progress: int  # Legacy
    mystery_box_needed: int    # Legacy
    mystery_box_progress_pct: float  # Legacy
    mystery_boxes_earned: int
    mystery_boxes_opened: int
    mystery_boxes_available: int
    mystery_boxes_from_levelup: int
    
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
    user_repo: SQLiteUserProfileRepository = Depends(get_user_repo)
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
    user_repo: SQLiteUserProfileRepository = Depends(get_user_repo)
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
    user_repo: SQLiteUserProfileRepository = Depends(get_user_repo)
):
    """Get comprehensive gamification statistics with coupon system."""
    profile = await user_repo.ensure_default_profile()
    
    # Calculate additional stats
    current_coupons = len([c for c in profile.earned_coupons if not c.is_used])
    coupon_usage_rate = profile.total_coupons_used / max(profile.total_coupons_earned, 1)
    mystery_box_progress_pct = (profile.mystery_box_progress / profile.points_per_mystery_box) * 100
    
    # Calculate XP progress percentage
    progress_to_next_level = profile.experience_points / profile.experience_to_next_level if profile.experience_to_next_level > 0 else 0.0
    
    # Get recent achievements
    gamification = GamificationService()
    achievement_definitions = gamification._load_achievement_definitions()
    
    recent_achievements = []
    for achievement in profile.achievements[-5:]:  # Last 5 achievements
        # Find the achievement definition to get name and points
        achievement_def = next(
            (ad for ad in achievement_definitions if ad.id == achievement.achievement_id), 
            None
        )
        if achievement_def:
            recent_achievements.append({
                "id": achievement.achievement_id,
                "name": achievement_def.name,
                "unlocked_at": achievement.unlocked_at.isoformat(),
                "points_value": achievement_def.points_value
            })
    
    return EnhancedGamificationStatsResponse(
        # Core coupon stats
        current_coupons=current_coupons,
        total_coupons_earned=profile.total_coupons_earned,
        total_coupons_used=profile.total_coupons_used,
        coupon_usage_rate=coupon_usage_rate,
        
        # XP/Level system - NEW
        experience_points=profile.experience_points,
        level=profile.level,
        experience_to_next_level=profile.experience_to_next_level,
        total_experience_earned=profile.total_experience_earned,
        progress_to_next_level=progress_to_next_level,
        
        # Mystery box system (now level-based)
        mystery_box_progress=profile.mystery_box_progress,
        mystery_box_needed=profile.points_per_mystery_box,
        mystery_box_progress_pct=mystery_box_progress_pct,
        mystery_boxes_earned=profile.mystery_boxes_earned,
        mystery_boxes_opened=profile.mystery_boxes_opened,
        mystery_boxes_available=profile.mystery_boxes_earned - profile.mystery_boxes_opened,
        mystery_boxes_from_levelup=profile.mystery_boxes_from_levelup,
        
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
    user_repo: SQLiteUserProfileRepository = Depends(get_user_repo),
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

@router.get("/luck-status")
async def get_luck_status(
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get user's current luck factor and breakdown."""
    try:
        user_repo = SQLiteUserProfileRepository()
        user_profile = await user_repo.ensure_default_profile()
        
        # Calculate current luck boost
        luck_boost = gamification._calculate_luck_boost(user_profile)
        
        return {
            "success": True,
            "base_luck": user_profile.luck_factor,
            "total_luck": luck_boost,
            "luck_breakdown": {
                "base_luck": user_profile.luck_factor,
                "streak_bonus": min(user_profile.current_streak_days * 0.1, 0.5),
                "level_bonus": min(user_profile.level * 0.02, 0.2),
                "activity_bonus": 0.2 if user_profile.daily_tasks_completed_today >= user_profile.daily_task_goal else 0.0,
                "comeback_bonus": 0.3 if user_profile.comeback_bonus_available else 0.0
            },
            "luck_explanation": {
                "base_luck": "Your base luck factor (can be increased through achievements)",
                "streak_bonus": f"Streak bonus: {user_profile.current_streak_days} days (+{min(user_profile.current_streak_days * 0.1, 0.5):.1f})",
                "level_bonus": f"Level bonus: Level {user_profile.level} (+{min(user_profile.level * 0.02, 0.2):.1f})",
                "activity_bonus": "Daily goal completion bonus (+0.2)" if user_profile.daily_tasks_completed_today >= user_profile.daily_task_goal else "Complete daily goal for +0.2 bonus",
                "comeback_bonus": "Comeback bonus (+0.3)" if user_profile.comeback_bonus_available else "Available after being inactive"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting luck status: {str(e)}")

@router.post("/luck-factor")
async def update_luck_factor(
    request: dict,
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Update user's base luck factor (admin/achievement use)."""
    try:
        user_repo = SQLiteUserProfileRepository()
        user_profile = await user_repo.ensure_default_profile()
        
        new_luck_factor = request.get("luck_factor", user_profile.luck_factor)
        
        # Validate luck factor range
        if new_luck_factor < 0.1 or new_luck_factor > 3.0:
            raise HTTPException(status_code=400, detail="Luck factor must be between 0.1 and 3.0")
        
        user_profile.luck_factor = new_luck_factor
        await user_repo.save_profile(user_profile)
        
        return {
            "success": True,
            "message": f"Luck factor updated to {new_luck_factor:.2f}",
            "new_luck_factor": new_luck_factor
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating luck factor: {str(e)}") 

@router.get("/reward-config")
async def get_reward_configuration(
    user_repo: SQLiteUserProfileRepository = Depends(get_user_repo)
):
    """Get user's custom reward configuration."""
    try:
        profile = await user_repo.ensure_default_profile()
        
        if profile.custom_reward_config and profile.use_custom_rewards:
            return {
                "success": True,
                "has_custom_config": True,
                "config": profile.custom_reward_config.dict(),
                "is_active": profile.use_custom_rewards
            }
        else:
            return {
                "success": True,
                "has_custom_config": False,
                "config": None,
                "is_active": False,
                "default_config": {
                    "tiers": [
                        {
                            "tier_name": "NO_REWARD",
                            "probability": 0.50,
                            "description": "50% chance of no reward"
                        },
                        {
                            "tier_name": "COMMON",
                            "probability": 0.30,
                            "description": "30% chance of common rewards"
                        },
                        {
                            "tier_name": "RARE",
                            "probability": 0.15,
                            "description": "15% chance of rare rewards"
                        },
                        {
                            "tier_name": "EPIC",
                            "probability": 0.04,
                            "description": "4% chance of epic rewards"
                        },
                        {
                            "tier_name": "LEGENDARY",
                            "probability": 0.01,
                            "description": "1% chance of legendary rewards"
                        }
                    ]
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting reward config: {str(e)}")

@router.post("/reward-config")
async def save_reward_configuration(
    request: dict,
    user_repo: SQLiteUserProfileRepository = Depends(get_user_repo)
):
    """Save user's custom reward configuration."""
    try:
        profile = await user_repo.ensure_default_profile()
        
        from domain.models import CustomRewardConfiguration, CustomRewardTier
        
        # Parse the custom configuration from request
        config_data = request.get("config", {})
        
        custom_config = CustomRewardConfiguration(
            user_id=profile.id,
            configuration_name=config_data.get("name", "My Custom Wheel"),
            reward_tiers=[
                CustomRewardTier(
                    tier_name=tier["tier_name"],
                    probability=tier["probability"],
                    colors=tier.get("colors", []),
                    glow_color=tier.get("glow_color", "#22c5c2"),
                    segments=tier.get("segments", [])
                )
                for tier in config_data.get("tiers", [])
            ]
        )
        
        # Validate probabilities sum to 1.0
        total_prob = sum(tier.probability for tier in custom_config.reward_tiers)
        if abs(total_prob - 1.0) > 0.01:
            raise HTTPException(
                status_code=400, 
                detail=f"Probabilities must sum to 1.0 (currently {total_prob:.3f})"
            )
        
        profile.custom_reward_config = custom_config
        profile.use_custom_rewards = request.get("use_custom_rewards", True)
        
        await user_repo.save_profile(profile)
        
        return {
            "success": True,
            "message": "Custom reward configuration saved successfully",
            "config": custom_config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving reward config: {str(e)}")

@router.delete("/reward-config")
async def delete_reward_configuration(
    user_repo: SQLiteUserProfileRepository = Depends(get_user_repo)
):
    """Delete user's custom reward configuration and revert to default."""
    try:
        profile = await user_repo.ensure_default_profile()
        
        profile.custom_reward_config = None
        profile.use_custom_rewards = False
        
        await user_repo.save_profile(profile)
        
        return {
            "success": True,
            "message": "Custom reward configuration deleted. Reverted to default configuration."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting reward config: {str(e)}")

@router.post("/reward-config/toggle")
async def toggle_reward_configuration(
    request: dict,
    user_repo: SQLiteUserProfileRepository = Depends(get_user_repo)
):
    """Toggle between custom and default reward configuration."""
    try:
        profile = await user_repo.ensure_default_profile()
        
        if not profile.custom_reward_config:
            raise HTTPException(
                status_code=400, 
                detail="No custom reward configuration exists. Create one first."
            )
        
        profile.use_custom_rewards = request.get("use_custom_rewards", not profile.use_custom_rewards)
        
        await user_repo.save_profile(profile)
        
        return {
            "success": True,
            "message": f"Switched to {'custom' if profile.use_custom_rewards else 'default'} reward configuration",
            "is_using_custom": profile.use_custom_rewards
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error toggling reward config: {str(e)}") 