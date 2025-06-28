from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime
from pathlib import Path

from domain.models import UserProfile, UserAchievement
from .file_repository import FileRepository
from core.config import settings
from core.logging_config import get_logger

class UserProfileRepository:
    """Repository for managing user profiles."""
    
    def __init__(self):
        """Initialize the user profile repository."""
        from core.config import settings
        self.file_repo = FileRepository(settings.data_file_path)
        self.logger = get_logger("user_profile_repo")
    
    async def get_default_profile(self) -> Optional[UserProfile]:
        """Get the default user profile."""
        try:
            data = await self.file_repo.load_data()
            
            if "user_profile" not in data or not data["user_profile"]:
                # Create default profile
                default_profile = UserProfile()
                data["user_profile"] = default_profile.dict()
                await self.file_repo.save_data(data)
                self.logger.info("👤 Created default user profile")
                return default_profile
            
            return UserProfile(**data["user_profile"])
            
        except Exception as e:
            self.logger.error(f"❌ Error getting user profile: {e}")
            raise
    
    async def ensure_default_profile(self) -> UserProfile:
        """Ensure a default profile exists and return it."""
        try:
            profile = await self.get_default_profile()
            return profile
        except Exception as e:
            self.logger.error(f"❌ Error ensuring default profile: {e}")
            raise
    
    async def update_profile(self, profile: UserProfile) -> UserProfile:
        """Update user profile."""
        try:
            data = await self.file_repo.load_data()
            data["user_profile"] = profile.dict()
            await self.file_repo.save_data(data)
            
            self.logger.info(f"👤 Updated user profile (score: {profile.overall_score}, streak: {profile.current_streak_days})")
            return profile
            
        except Exception as e:
            self.logger.error(f"❌ Error updating user profile: {e}")
            raise
    
    async def add_points(self, points: int) -> UserProfile:
        """Add points to user's score."""
        try:
            profile = await self.get_default_profile()
            profile.overall_score += points
            profile.updated_at = datetime.utcnow()
            
            updated_profile = await self.update_profile(profile)
            self.logger.info(f"🎯 Added {points} points (total: {updated_profile.overall_score})")
            
            return updated_profile
            
        except Exception as e:
            self.logger.error(f"❌ Error adding points: {e}")
            raise
    
    async def update_streak(self, days: int) -> UserProfile:
        """Update user's streak."""
        try:
            profile = await self.get_default_profile()
            old_streak = profile.current_streak_days
            profile.current_streak_days = days
            profile.last_streak_check_date = datetime.utcnow()
            profile.updated_at = datetime.utcnow()
            
            updated_profile = await self.update_profile(profile)
            self.logger.info(f"🔥 Streak updated: {old_streak} → {days} days")
            
            return updated_profile
            
        except Exception as e:
            self.logger.error(f"❌ Error updating streak: {e}")
            raise
    
    # Legacy methods for compatibility
    async def get(self) -> Optional[UserProfile]:
        """Legacy method - redirects to get_default_profile."""
        self.logger.debug("Legacy get() method called, redirecting to get_default_profile()")
        return await self.get_default_profile()
    
    async def create(self, profile: UserProfile) -> UserProfile:
        """Legacy method - redirects to save."""
        self.logger.debug("Legacy create() method called, redirecting to save()")
        return await self.save(profile)
    
    async def update(self, updates: dict) -> Optional[UserProfile]:
        """Update the user profile."""
        profile = await self.get()
        if not profile:
            return None
        
        # Update fields
        for key, value in updates.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        
        await self.save(profile)
        return profile
    
    async def add_achievement(self, achievement: UserAchievement) -> Optional[UserProfile]:
        """Add an achievement to the user profile."""
        profile = await self.get()
        if not profile:
            return None
        
        # Check if achievement already exists
        for ach in profile.achievements:
            if ach.achievement_id == achievement.achievement_id:
                return profile  # Already has this achievement
        
        profile.achievements.append(achievement)
        await self.save(profile)
        return profile
    
    async def save(self, profile: UserProfile) -> UserProfile:
        """Save a user profile."""
        self.logger.info(f"Saving user profile: {profile.username}")
        self.logger.debug(f"Profile data: score={profile.overall_score}, streak={profile.current_streak_days}")
        
        try:
            await self.file_repo.set("user_profile", profile.dict())
            
            self.logger.info("✅ User profile saved successfully")
            return profile
            
        except Exception as e:
            self.logger.error(f"❌ Error saving user profile: {e}")
            raise 