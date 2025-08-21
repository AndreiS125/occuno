"""
Repository factory for SQLModel database access

Simplified factory that provides SQLModel repositories without conversion overhead.
"""

from repositories.user_profile_repository import UserProfileRepository
from repositories.objective_repository import ObjectiveRepository
from repositories.calendar_repository import CalendarRepository
from core.logging_config import get_logger

logger = get_logger("repository_factory")

class RepositoryFactory:
    """Factory for creating SQLModel repository instances"""
    
    def __init__(self):
        """Initialize repository factory with SQLModel repositories"""
        logger.info("🔄 Using SQLModel repositories")
    
    def get_user_profile_repository(self) -> UserProfileRepository:
        """Get user profile repository instance"""
        return UserProfileRepository()
    
    def get_objective_repository(self) -> ObjectiveRepository:
        """Get objective repository instance"""
        return ObjectiveRepository()
    
    def get_calendar_repository(self) -> CalendarRepository:
        """Get calendar repository instance"""
        return CalendarRepository()


# Global factory instance
_repository_factory = RepositoryFactory()

# Convenience functions for getting repositories
def get_user_profile_repository() -> UserProfileRepository:
    """Get user profile repository"""
    return _repository_factory.get_user_profile_repository()

def get_objective_repository() -> ObjectiveRepository:
    """Get objective repository"""
    return _repository_factory.get_objective_repository()

def get_calendar_repository() -> CalendarRepository:
    """Get calendar repository"""
    return _repository_factory.get_calendar_repository()


