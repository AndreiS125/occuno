from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from uuid import UUID

from repositories.repository_factory import get_user_profile_repository
from services.gamification_service import GamificationService
from auth.users import current_active_user
from core.models import UserProfile

router = APIRouter(tags=["user"])

# Dependency injection - fixed to use SQLite version
def get_user_repo():
    return get_user_profile_repository()

def get_gamification_service():
    return GamificationService()

# Request/Response models
class UserProfileResponse(BaseModel):
    id: str
    overall_score: int
    current_streak_days: int
    achievements_count: int
    preferred_work_hours: Optional[Dict[str, Any]] = None
    name: Optional[str] = None
    email: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class UpdatePreferencesRequest(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    daily_goal_tasks: Optional[int] = None
    working_hours_start: Optional[str] = None
    working_hours_end: Optional[str] = None
    timezone: Optional[str] = None
    preferred_work_hours: Optional[Dict[str, Any]] = None

class EnhancedGamificationStatsResponse(BaseModel):
    # Core coupon stats
    current_coupons: int
    total_coupons_earned: int
    total_coupons_used: int
    coupon_usage_rate: float
    
    # XP/Level system
    experience_points: int
    level: int
    experience_to_next_level: int
    total_experience_earned: int
    progress_to_next_level: float  # 0.0 to 1.0
    
    # Mystery box system
    mystery_box_progress: int
    mystery_box_needed: int
    mystery_box_progress_pct: float
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

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user: UserProfile = Depends(current_active_user),
    user_repo = Depends(get_user_repo)
):
    """Get the current user's profile."""
    profile = user_repo.get_by_id(current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    # Extract preferences if they exist
    preferences = profile.preferred_work_hours or {}

    return UserProfileResponse(
        id=str(profile.id),
        overall_score=profile.overall_score,
        current_streak_days=profile.current_streak_days,
        achievements_count=len(profile.achievements) if profile.achievements else 0,
        preferred_work_hours=profile.preferred_work_hours,
        name=profile.full_name or preferences.get("name", (profile.email.split("@")[0] if profile.email else "")),
        email=preferences.get("email", profile.email or ""),
        preferences=preferences
    )

@router.put("/preferences")
def update_preferences(
    request: UpdatePreferencesRequest,
    current_user: UserProfile = Depends(current_active_user),
    user_repo = Depends(get_user_repo)
):
    """Update user preferences."""
    profile = user_repo.get_by_id(current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    # Get existing preferences or create new dict
    preferences = dict(profile.preferred_work_hours or {})

    updates_dict = request.dict(exclude_unset=True)

    # Persist identity fields directly on the profile (full_name)
    full_name_val = updates_dict.get("full_name", updates_dict.get("name"))
    if full_name_val is not None:
        profile.full_name = full_name_val.strip() or None
    # Optionally allow email change via preferences (kept off by default for safety)
    # If needed later, uncomment the next two lines and add validation for uniqueness/verification
    # if "email" in updates_dict and updates_dict["email"]:
    #     profile.email = updates_dict["email"].strip()

    # Only store true preference keys in JSON blob
    preference_keys = {
        "theme",
        "notifications_enabled",
        "daily_goal_tasks",
        "working_hours_start",
        "working_hours_end",
        "timezone",
        # Keep a copy of name/email in preferences for backward compatibility if present
        "name",
        "email",
        "preferred_work_hours",  # nested structure passthrough if ever used
    }
    for key, value in updates_dict.items():
        if key in preference_keys:
            preferences[key] = value

    # Update the profile and persist
    profile.preferred_work_hours = preferences
    profile = user_repo.update(profile)

    return {"success": True, "message": "Preferences updated", "preferences": preferences}

@router.get("/gamification/stats", response_model=EnhancedGamificationStatsResponse)
def get_enhanced_gamification_stats(
    current_user: UserProfile = Depends(current_active_user),
    user_repo = Depends(get_user_repo)
):
    """Get comprehensive gamification statistics with coupon system."""
    profile = user_repo.get_by_id(current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    # Calculate additional stats
    earned_coupons = profile.earned_coupons or []
    current_coupons = len([c for c in earned_coupons if not c.is_used])
    coupon_usage_rate = profile.total_coupons_used / max(profile.total_coupons_earned, 1)
    mystery_box_progress_pct = (profile.mystery_box_progress / profile.points_per_mystery_box) * 100
    
    # Calculate XP progress percentage
    progress_to_next_level = profile.experience_points / profile.experience_to_next_level if profile.experience_to_next_level > 0 else 0.0
    
    # Get achievements from user profile directly
    achievement_definitions = profile.achievement_definitions or []
    
    recent_achievements = []
    user_achievements = profile.achievements or []
    for achievement in user_achievements[-5:]:  # Last 5 achievements
        # Find the achievement definition to get name and points (match by achievement_id string)
        achievement_def = next(
            (ad for ad in achievement_definitions if ad.achievement_id == achievement.achievement_id),
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
        
        # XP/Level system
        experience_points=profile.experience_points,
        level=profile.level,
        experience_to_next_level=profile.experience_to_next_level,
        total_experience_earned=profile.total_experience_earned,
        progress_to_next_level=progress_to_next_level,
        
        # Mystery box system
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
        total_achievements=len(user_achievements),
        recent_achievements=recent_achievements
    )

@router.get("/luck-status")
def get_luck_status(
    current_user: UserProfile = Depends(current_active_user),
    user_repo = Depends(get_user_repo),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get user's current luck factor and breakdown."""
    try:
        user_profile = user_repo.get_by_id(current_user.id)
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
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

@router.get("/reward-config")
def get_reward_configuration(
    current_user: UserProfile = Depends(current_active_user),
    user_repo = Depends(get_user_repo)
):
    """Get user's custom reward configuration."""
    try:
        profile = user_repo.get_by_id(current_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        if profile.custom_reward_config and profile.use_custom_rewards:
            # Handle both dict and SQLModel cases
            config_data = profile.custom_reward_config
            if hasattr(config_data, 'dict'):
                config_data = config_data.dict()
            return {
                "success": True,
                "has_custom_config": True,
                "config": config_data,
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

@router.get("/gamification/daily-status")
def get_daily_status(
    current_user: UserProfile = Depends(current_active_user),
    user_repo = Depends(get_user_repo)
):
    """Get user's daily gamification status."""
    try:
        profile = user_repo.get_by_id(current_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        earned_coupons = profile.earned_coupons or []
        current_coupons = len([c for c in earned_coupons if not c.is_used])
        mystery_box_progress_pct = (profile.mystery_box_progress / profile.points_per_mystery_box) * 100
        
        return {
            "current_coupons": current_coupons,
            "total_coupons_earned": profile.total_coupons_earned,
            "total_coupons_used": profile.total_coupons_used,
            "mystery_box_progress": profile.mystery_box_progress,
            "mystery_box_needed": profile.points_per_mystery_box,
            "mystery_box_progress_pct": mystery_box_progress_pct,
            "current_streak": profile.current_streak_days,
            "daily_tasks_completed": profile.daily_tasks_completed_today,
            "daily_task_goal": profile.daily_task_goal,
            "weekly_rank": profile.rank_this_week,
            "mystery_boxes_available": profile.mystery_boxes_earned - profile.mystery_boxes_opened,
            "daily_bonus_available": profile.daily_bonus_available,
            "daily_bonus_message": "Collect your daily bonus!" if profile.daily_bonus_available else "Come back tomorrow!",
            "decay_warning": profile.progress_decay_warning,
            "days_inactive": profile.days_since_last_activity,
            "psychological_hooks": {},
            "urgency_factors": {}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting daily status: {str(e)}")

@router.get("/coupons")
def get_available_coupons(
    current_user: UserProfile = Depends(current_active_user),
    user_repo = Depends(get_user_repo)
):
    """Get all available (unused) coupons for the user."""
    try:
        profile = user_repo.get_by_id(current_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        earned_coupons = profile.earned_coupons or []
        available_coupons = [c for c in earned_coupons if not c.is_used]
        
        return [
            {
                "id": str(coupon.id),
                "type": coupon.coupon_type,
                "display_name": coupon.coupon_type.replace("_", " ").title(),
                "description": f"Enjoy some {coupon.coupon_type.replace('_', ' ')}",
                "duration_minutes": 30,  # Default duration
                "rarity": "common",
                # Use correct model field name for expiration
                "expires_at": coupon.expiration_date.isoformat() if coupon.expiration_date else None,
                "hours_left": 24.0  # Default hours left
            }
            for coupon in available_coupons
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting coupons: {str(e)}")

@router.post("/coupons/{coupon_id}/use")
def use_coupon(
    coupon_id: str,
    current_user: UserProfile = Depends(current_active_user),
    user_repo = Depends(get_user_repo)
):
    """Use a specific coupon."""
    try:
        from uuid import UUID
        coupon_uuid = UUID(coupon_id)
        
        profile = user_repo.get_by_id(current_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Find the coupon
        earned_coupons = profile.earned_coupons or []
        coupon = next((c for c in earned_coupons if c.id == coupon_uuid and not c.is_used), None)
        
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found or already used")
        
        # Mark as used
        coupon_used = user_repo.use_coupon(coupon_uuid)
        if not coupon_used:
            raise HTTPException(status_code=400, detail="Failed to use coupon")
        
        return {"success": True, "message": "Coupon used successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid coupon ID")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error using coupon: {str(e)}")

@router.get("/coupons/definitions")
def get_coupon_definitions(
    current_user: UserProfile = Depends(current_active_user),
    user_repo = Depends(get_user_repo)
):
    """Get coupon type definitions."""
    try:
        profile = user_repo.get_by_id(current_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Ensure definitions exist for this user (seed if missing)
        try:
            ensured_defs = user_repo.ensure_coupon_definitions(current_user.id)
        except Exception:
            ensured_defs = None

        coupon_definitions = ensured_defs or (profile.coupon_definitions or [])
        
        return [
            {
                "coupon_type": defn.coupon_type,
                "display_name": defn.display_name,
                "description": defn.description,
                "duration_minutes": defn.duration_minutes,
                "rarity": defn.rarity
            }
            for defn in coupon_definitions
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting coupon definitions: {str(e)}")

@router.post("/gamification/mystery-box")
def open_mystery_box(
    current_user: UserProfile = Depends(current_active_user),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Open a mystery box."""
    try:
        result = gamification.open_mystery_box(current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error opening mystery box: {str(e)}")

@router.get("/gamification/weekly-challenge")
def get_weekly_challenge(
    current_user: UserProfile = Depends(current_active_user),
    user_repo = Depends(get_user_repo)
):
    """Get weekly challenge progress."""
    try:
        profile = user_repo.get_by_id(current_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return {
            "progress": profile.weekly_challenge_progress,
            "target": profile.weekly_challenge_target,
            "completed": profile.weekly_challenge_completed,
            "progress_pct": (profile.weekly_challenge_progress / profile.weekly_challenge_target) * 100 if profile.weekly_challenge_target > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting weekly challenge: {str(e)}")

@router.post("/gamification/daily-bonus")
def claim_daily_bonus(
    current_user: UserProfile = Depends(current_active_user),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Claim daily bonus."""
    try:
        result = gamification.claim_daily_bonus(current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error claiming daily bonus: {str(e)}")

@router.post("/gamification/check-streak")
def check_and_update_streak(
    current_user: UserProfile = Depends(current_active_user),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Manually check and update streak status."""
    try:
        user_repo = get_user_repo()
        profile = user_repo.get_by_id(current_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        result = gamification._update_streak_system(profile)
        user_repo.update(profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating streak: {str(e)}")

# Authenticated: achievement definitions are user-scoped
@router.get("/gamification/achievements")
def get_achievement_definitions(
    current_user: UserProfile = Depends(current_active_user),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Get all available achievement definitions for the authenticated user."""
    achievements = gamification.get_user_achievements(current_user.id)
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
