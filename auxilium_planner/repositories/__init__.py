from .repository_factory import (
    get_objective_repository, get_user_profile_repository
)

# Modern factory functions (recommended)
get_objective_repo = get_objective_repository
get_user_repo = get_user_profile_repository

__all__ = [
    "get_objective_repository",
    "get_user_profile_repository",
    "get_objective_repo",
    "get_user_repo"
] 