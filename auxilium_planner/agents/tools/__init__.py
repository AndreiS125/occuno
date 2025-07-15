"""
Agent Tools

This package contains all the tools that the AI agents can use to interact with the system.
Tools are organized by function:
- Objective tools: CRUD operations on objectives and tasks
- Memory tools: User memory management
- Gamification tools: Points, achievements, streaks
- Utility tools: Time, planning, and system tools
"""

from .objective_tools import (
    retrieve_objective_by_id,
    retrieve_objective_by_name,
    retrieve_full_objective_tree,
    retrieve_objectives_by_time_period,
    retrieve_all_objectives,
    create_objective,
    update_objective,
    delete_objective,
    move_objective_parent
)

from .memory_tools import (
    save_user_memory,
    get_user_memories
)

from .gamification_tools import (
    get_gamification_stats,
    update_gamification_stats
)

from .utility_tools import (
    get_current_time,
    plan,
    final_response,
    final_response_to_user
)



# All tools available to agents
ALL_PLANNING_TOOLS = [
    retrieve_objective_by_id,
    retrieve_objective_by_name,
    retrieve_full_objective_tree,
    retrieve_objectives_by_time_period,
    retrieve_all_objectives,
    save_user_memory,
    final_response  # Planning agent's final response tool
]

ALL_EXECUTOR_TOOLS = [
    create_objective,
    update_objective,
    delete_objective,
    retrieve_objective_by_id,
    retrieve_objectives_by_time_period,
    move_objective_parent,
    get_gamification_stats,
    update_gamification_stats,
    save_user_memory,
    plan,  # Executor's planning tool
    final_response_to_user  # Executor's final response to user
]

__all__ = [
    "ALL_PLANNING_TOOLS",
    "ALL_EXECUTOR_TOOLS",
    # Individual tools
    "retrieve_objective_by_id",
    "retrieve_objective_by_name", 
    "retrieve_full_objective_tree",
    "retrieve_objectives_by_time_period",
    "retrieve_all_objectives",
    "create_objective",
    "update_objective",
    "delete_objective",
    "move_objective_parent",
    "save_user_memory",
    "get_user_memories",
    "get_gamification_stats",
    "update_gamification_stats",
    "get_current_time",
    "plan",
    "final_response",
    "final_response_to_user",
    # Aliases for test compatibility
    "search_objectives_by_name",
    "move_objective_to_parent",
    "add_achievement",
    "add_points",
    "check_streak",
    "get_user_statistics"
]

# Create aliases for compatibility
search_objectives_by_name = retrieve_objective_by_name
retrieve_objective_tree = retrieve_full_objective_tree
retrieve_objectives_by_time = retrieve_objectives_by_time_period
move_objective_to_parent = move_objective_parent
add_achievement = update_gamification_stats
add_points = update_gamification_stats
check_streak = get_gamification_stats
get_user_statistics = get_gamification_stats 