"""
Repository factory for SQLAlchemy database access

Simplified factory that only provides SQLAlchemy repositories.
"""

from repositories.sqlalchemy_user_profile_repository import SQLAlchemyUserProfileRepository
from repositories.sqlalchemy_objective_repository import SQLAlchemyObjectiveRepository
from repositories.sqlalchemy_conversation_repository import SQLAlchemyConversationRepository

from core.logging_config import get_logger

logger = get_logger("repository_factory")

class RepositoryFactory:
    """Factory for creating SQLAlchemy repository instances"""
    
    def __init__(self):
        """Initialize repository factory with SQLAlchemy repositories"""
        logger.info("🔄 Using SQLAlchemy repositories")
    
    def get_user_profile_repository(self) -> SQLAlchemyUserProfileRepository:
        """Get user profile repository instance"""
        return SQLAlchemyUserProfileRepository()
    
    def get_objective_repository(self) -> SQLAlchemyObjectiveRepository:
        """Get objective repository instance"""
        return SQLAlchemyObjectiveRepository()
    
    def get_conversation_repository(self) -> SQLAlchemyConversationRepository:
        """Get conversation repository instance"""
        return SQLAlchemyConversationRepository()

# Global factory instance
_repository_factory = RepositoryFactory()

# Convenience functions for getting repositories
def get_user_profile_repository() -> SQLAlchemyUserProfileRepository:
    """Get user profile repository"""
    return _repository_factory.get_user_profile_repository()

def get_objective_repository() -> SQLAlchemyObjectiveRepository:
    """Get objective repository"""
    return _repository_factory.get_objective_repository()

def get_conversation_repository() -> SQLAlchemyConversationRepository:
    """Get conversation repository"""
    return _repository_factory.get_conversation_repository()
