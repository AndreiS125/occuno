from .sqlalchemy_objective_repository import SQLAlchemyObjectiveRepository
from .sqlalchemy_user_profile_repository import SQLAlchemyUserProfileRepository
from .sqlalchemy_conversation_repository import SQLAlchemyConversationRepository
from .repository_factory import (
    get_objective_repository, get_user_profile_repository, get_conversation_repository
)

# Aliases for backward compatibility
ObjectiveRepository = SQLAlchemyObjectiveRepository
UserProfileRepository = SQLAlchemyUserProfileRepository
ConversationRepository = SQLAlchemyConversationRepository

# Modern factory functions (recommended)
get_objective_repo = get_objective_repository
get_user_repo = get_user_profile_repository
get_conversation_repo = get_conversation_repository

__all__ = [
    "ObjectiveRepository", 
    "UserProfileRepository",
    "ConversationRepository",
    "SQLAlchemyObjectiveRepository",
    "SQLAlchemyUserProfileRepository",
    "SQLAlchemyConversationRepository",
    "get_objective_repository",
    "get_user_profile_repository",
    "get_conversation_repository",
    "get_objective_repo",
    "get_user_repo",
    "get_conversation_repo"
] 