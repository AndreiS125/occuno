"""
Objective Tools for AI Agents

These tools allow agents to interact with the objective system:
- Retrieve objectives by various criteria
- Create, update, delete objectives
- Move objectives between parents
"""

from typing import List, Optional, Union, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import json

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from repositories.objective_repository import ObjectiveRepository
from domain.models import Objective, Task, ObjectiveType, ObjectiveStatus, EnergyLevel, RecurringInfo


def custom_json_serializer(obj):
    """Custom JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, timedelta):
        return obj.total_seconds()  # Convert timedelta to seconds
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, UUID):
        return str(obj)
    elif hasattr(obj, '__dict__'):
        return obj.__dict__
    else:
        return str(obj)


def safe_json_dumps(obj, **kwargs):
    """Safe JSON dumps that handles common non-serializable objects"""
    return json.dumps(obj, default=custom_json_serializer, **kwargs)


class ObjectiveCreate(BaseModel):
    """Schema for creating objectives with all available fields"""
    title: str = Field(description="Title of the objective")
    description: Optional[str] = Field(default=None, description="Detailed description")
    objective_type: ObjectiveType = Field(description="Type: main_objective, sub_objective, task, habit")
    parent_id: Optional[str] = Field(default=None, description="Parent objective ID (null for root objectives)")
    start_date: Optional[str] = Field(default=None, description="Start date (ISO format)")
    due_date: Optional[str] = Field(default=None, description="Due date (ISO format)")
    all_day: bool = Field(default=True, description="All-day event flag (true for learning objectives)")
    priority_score: float = Field(default=0.5, description="Priority 0.0-1.0")
    complexity_score: float = Field(default=0.5, description="Complexity 0.0-1.0")
    energy_requirement: EnergyLevel = Field(default=EnergyLevel.MEDIUM, description="Energy level: low, medium, high")
    status: ObjectiveStatus = Field(default=ObjectiveStatus.NOT_STARTED, description="Current status")
    context_tags: List[str] = Field(default_factory=list, description="Context tags for categorization")
    success_criteria: List[str] = Field(default_factory=list, description="Success criteria and metrics")
    dependencies: List[str] = Field(default_factory=list, description="List of objective IDs this depends on")
    points_awarded_for_completion: int = Field(default=10, description="Gamification points for completion")
    
    # Task-specific fields (only used when objective_type is "task")
    start_time: Optional[str] = Field(default=None, description="Start time for tasks (ISO format)")
    end_time: Optional[str] = Field(default=None, description="End time for tasks (ISO format)")
    location: Optional[str] = Field(default=None, description="Location for tasks")
    estimated_duration_minutes: Optional[int] = Field(default=None, description="Estimated duration in minutes")
    actionable_steps: List[str] = Field(default_factory=list, description="Specific actionable steps for tasks")
    
    # Recurring/repetition fields (for habits and recurring objectives)
    # Use nested format: {"recurring": {"frequency": "daily", "interval": 1, "time_of_day": "08:00"}}
    recurring: Optional[Dict[str, Any]] = Field(default=None, description="Recurring pattern: {frequency, interval, days_of_week, time_of_day}")
    # Legacy flat format support (prefer nested format above)
    recurring_frequency: Optional[str] = Field(default=None, description="Legacy: Frequency: daily, weekly, monthly")
    recurring_interval: Optional[int] = Field(default=1, description="Legacy: Every N days/weeks/months")
    recurring_days_of_week: Optional[List[int]] = Field(default=None, description="Legacy: Days of week (0=Monday, 6=Sunday)")
    recurring_time_of_day: Optional[str] = Field(default=None, description="Legacy: Time of day for recurring (HH:MM format)")


@tool
async def retrieve_objective_by_id(objective_id: str, with_children: bool = False) -> str:
    """
    Retrieve a specific objective by its ID.
    
    Args:
        objective_id: The UUID of the objective to retrieve
        with_children: If True, include all child objectives in the response
    
    Returns:
        JSON string containing the objective details
    """
    try:
        repo = ObjectiveRepository()
        objective = await repo.get_by_id(UUID(objective_id))
        
        if not objective:
            return safe_json_dumps({"error": f"Objective with ID {objective_id} not found"})
        
        result = objective.dict()
        
        if with_children:
            # Get all children recursively
            all_objectives = await repo.get_all()
            children = [obj for obj in all_objectives if obj.parent_id == objective.id]
            result["children"] = [child.dict() for child in children]
        
        return safe_json_dumps(result, indent=2)
    
    except Exception as e:
        return safe_json_dumps({"error": f"Failed to retrieve objective: {str(e)}"})


@tool
async def retrieve_objective_by_name(name: str) -> str:
    """
    Search for objectives by name/title. Returns top 3 most similar matches.
    
    Args:
        name: The name or partial name to search for
    
    Returns:
        JSON string containing matching objectives
    """
    try:
        repo = ObjectiveRepository()
        all_objectives = await repo.get_all()
        
        # Simple text matching - could be enhanced with fuzzy matching
        matches = []
        search_term = name.lower()
        
        for obj in all_objectives:
            if search_term in obj.title.lower():
                score = 1.0 if obj.title.lower() == search_term else 0.8
                matches.append((score, obj))
            elif search_term in obj.description.lower() if obj.description else False:
                matches.append((0.6, obj))
        
        # Sort by relevance score and take top 3
        matches.sort(key=lambda x: x[0], reverse=True)
        top_matches = [match[1].dict() for match in matches[:3]]
        
        return safe_json_dumps({"matches": top_matches, "total_found": len(matches)}, indent=2)
    
    except Exception as e:
        return safe_json_dumps({"error": f"Failed to search objectives: {str(e)}"})


@tool
async def retrieve_full_objective_tree(objective_id: str) -> str:
    """
    Retrieve complete objective hierarchy starting from a root objective.
    
    Args:
        objective_id: The UUID of the root objective
    
    Returns:
        JSON string containing the complete tree structure
    """
    try:
        repo = ObjectiveRepository()
        root_objective = await repo.get_by_id(UUID(objective_id))
        
        if not root_objective:
            return safe_json_dumps({"error": f"Objective with ID {objective_id} not found"})
        
        all_objectives = await repo.get_all()
        
        def build_tree(parent_obj):
            children = [obj for obj in all_objectives if obj.parent_id == parent_obj.id]
            result = parent_obj.dict()
            if children:
                result["children"] = [build_tree(child) for child in children]
            return result
        
        tree = build_tree(root_objective)
        return safe_json_dumps(tree, indent=2)
    
    except Exception as e:
        return safe_json_dumps({"error": f"Failed to retrieve objective tree: {str(e)}"})


@tool
async def retrieve_objectives_by_time_period(start_date: str, end_date: str) -> str:
    """
    Retrieve all objectives within a specific time period.
    
    Args:
        start_date: Start date in ISO format (e.g., "2024-01-01T00:00:00")
        end_date: End date in ISO format (e.g., "2024-01-31T23:59:59")
    
    Returns:
        JSON string containing objectives in the time period
    """
    try:
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        repo = ObjectiveRepository()
        all_objectives = await repo.get_all()
        
        matching_objectives = []
        for obj in all_objectives:
            # Check if objective falls within the time period
            obj_start = obj.start_date or obj.created_at
            obj_end = obj.due_date or obj_start
            
            if obj_start and obj_end:
                if (obj_start <= end_dt and obj_end >= start_dt):
                    matching_objectives.append(obj.dict())
        
        return safe_json_dumps({
            "objectives": matching_objectives,
            "period": {"start": start_date, "end": end_date},
            "count": len(matching_objectives)
        }, indent=2)
    
    except Exception as e:
        return safe_json_dumps({"error": f"Failed to retrieve objectives by time period: {str(e)}"})


@tool
async def retrieve_all_objectives() -> str:
    """
    Retrieve all objectives in the system.
    
    Returns:
        JSON string containing all objectives
    """
    try:
        repo = ObjectiveRepository()
        all_objectives = await repo.get_all()
        
        objectives_data = [obj.dict() for obj in all_objectives]
        
        return safe_json_dumps({
            "objectives": objectives_data,
            "total_count": len(objectives_data),
            "summary": {
                "by_type": {},
                "by_status": {},
                "by_priority": {"high": 0, "medium": 0, "low": 0}
            }
        }, indent=2)
    
    except Exception as e:
        return safe_json_dumps({"error": f"Failed to retrieve all objectives: {str(e)}"})


@tool
async def create_objective(objective_data: str) -> str:
    """
    Create a new objective or task with full parameter support.
    
    Supports all objective fields including:
    - Basic: title, description, dates, priority, complexity, energy
    - Hierarchy: parent_id, objective_type
    - Gamification: points_awarded_for_completion
    - Dependencies: dependencies list
    - Task-specific: estimated_duration_minutes, location, actionable_steps
    - Recurring: frequency, interval, days_of_week, time_of_day
    
    Args:
        objective_data: JSON string containing objective details with all required fields
    
    Returns:
        JSON string with the created objective
    """
    try:
        data = json.loads(objective_data)
        repo = ObjectiveRepository()
        
        # Handle recurring info if specified (supports both nested and flat formats)
        recurring_info = None
        if data.get("recurring"):
            # Nested format: {"recurring": {"frequency": "daily", ...}}
            recurring_data = data["recurring"]
            recurring_info = RecurringInfo(
                frequency=recurring_data["frequency"],
                interval=recurring_data.get("interval", 1),
                days_of_week=recurring_data.get("days_of_week"),
                time_of_day=recurring_data.get("time_of_day")
            )
        elif data.get("recurring_frequency"):
            # Flat format for backward compatibility: {"recurring_frequency": "daily", ...}
            recurring_info = RecurringInfo(
                frequency=data["recurring_frequency"],
                interval=data.get("recurring_interval", 1),
                days_of_week=data.get("recurring_days_of_week"),
                time_of_day=data.get("recurring_time_of_day")
            )
        
        # Convert dependencies to UUIDs
        dependencies = []
        if data.get("dependencies"):
            dependencies = [UUID(dep_id) for dep_id in data["dependencies"]]
        
        # Base fields for both objectives and tasks
        base_fields = {
            "title": data["title"],
            "description": data.get("description"),
            "parent_id": UUID(data["parent_id"]) if data.get("parent_id") else None,
            "start_date": datetime.fromisoformat(data["start_date"]) if data.get("start_date") else None,
            "due_date": datetime.fromisoformat(data["due_date"]) if data.get("due_date") else None,
            "all_day": data.get("all_day", True),
            "priority_score": data.get("priority_score", 0.5),
            "complexity_score": data.get("complexity_score", 0.5),
            "energy_requirement": EnergyLevel(data.get("energy_requirement", "medium")),
            "status": ObjectiveStatus(data.get("status", "not_started")),
            "context_tags": data.get("context_tags", []),
            "success_criteria": data.get("success_criteria", []),
            "dependencies": dependencies,
            "points_awarded_for_completion": data.get("points_awarded_for_completion", 10),
            "recurring": recurring_info
        }
        
        # Determine if this is a task or objective
        if data.get("objective_type") == "task":
            # Create Task with task-specific fields
            task_fields = base_fields.copy()
            task_fields.update({
                "start_time": datetime.fromisoformat(data["start_time"]) if data.get("start_time") else None,
                "end_time": datetime.fromisoformat(data["end_time"]) if data.get("end_time") else None,
                "location": data.get("location"),
                "actionable_steps": data.get("actionable_steps", []),
                "estimated_duration": timedelta(minutes=data["estimated_duration_minutes"]) if data.get("estimated_duration_minutes") else None
            })
            created = await repo.create(Task(**task_fields))
        else:
            # Create Objective
            base_fields["objective_type"] = ObjectiveType(data.get("objective_type", "sub_objective"))
            created = await repo.create(Objective(**base_fields))
        
        # Create response with safe JSON serialization
        response_data = {
            "success": True,
            "message": f"Created {created.objective_type}: {created.title}",
            "objective": created.dict(),
            "recurring_enabled": recurring_info is not None,
            "estimated_duration_minutes": data.get("estimated_duration_minutes") if data.get("objective_type") == "task" else None
        }
        
        return safe_json_dumps(response_data, indent=2)
    
    except Exception as e:
        return safe_json_dumps({"error": f"Failed to create objective: {str(e)}"})


@tool
async def update_objective(objective_id: str, updates: str) -> str:
    """
    Update an existing objective or task.
    
    Args:
        objective_id: UUID of the objective to update
        updates: JSON string containing fields to update
    
    Returns:
        JSON string with the updated objective
    """
    try:
        update_data = json.loads(updates)
        repo = ObjectiveRepository()
        
        # Convert datetime strings to datetime objects
        for field in ["start_date", "due_date", "start_time", "end_time"]:
            if field in update_data and update_data[field]:
                update_data[field] = datetime.fromisoformat(update_data[field])
        
        # Handle estimated_duration_minutes conversion
        if "estimated_duration_minutes" in update_data and update_data["estimated_duration_minutes"]:
            update_data["estimated_duration"] = timedelta(minutes=update_data["estimated_duration_minutes"])
            del update_data["estimated_duration_minutes"]  # Remove the minutes field
        
        updated = await repo.update(UUID(objective_id), update_data)
        
        if not updated:
            return safe_json_dumps({"error": f"Objective with ID {objective_id} not found"})
        
        return safe_json_dumps({
            "success": True,
            "message": f"Updated {updated.objective_type}: {updated.title}",
            "objective": updated.dict()
        }, indent=2)
    
    except Exception as e:
        return safe_json_dumps({"error": f"Failed to update objective: {str(e)}"})


@tool
async def delete_objective(objective_id: str) -> str:
    """
    Delete an objective or task and ALL its children (cascading delete).
    
    WARNING: This will delete the objective and ALL child objectives/tasks recursively.
    Use move_objective_parent to relocate children before deletion if you want to preserve them.
    
    Args:
        objective_id: UUID of the objective to delete
    
    Returns:
        JSON string confirming deletion with count of deleted items
    """
    try:
        repo = ObjectiveRepository()
        
        # First check if the objective exists
        target_objective = await repo.get_by_id(UUID(objective_id))
        if not target_objective:
            return safe_json_dumps({"error": f"Objective with ID {objective_id} not found"})
        
        # Get all objectives to find children
        all_objectives = await repo.get_all()
        
        # Find all children recursively
        def find_all_children(parent_id: UUID) -> List[UUID]:
            children = []
            for obj in all_objectives:
                if obj.parent_id == parent_id:
                    children.append(obj.id)
                    # Recursively find children of this child
                    children.extend(find_all_children(obj.id))
            return children
        
        # Get all children of the target objective
        children_ids = find_all_children(UUID(objective_id))
        all_to_delete = children_ids + [UUID(objective_id)]  # Children first, then parent
        
        # Delete all children first, then parent
        deleted_count = 0
        deleted_titles = []
        
        for obj_id in all_to_delete:
            obj = await repo.get_by_id(obj_id)
            if obj:
                deleted_titles.append(obj.title)
                success = await repo.delete(obj_id)
                if success:
                    deleted_count += 1
        
        if deleted_count == 0:
            return safe_json_dumps({"error": f"Failed to delete objective {objective_id}"})
        
        return safe_json_dumps({
            "success": True,
            "message": f"Deleted {deleted_count} objective(s) including {target_objective.title} and all children",
            "deleted_count": deleted_count,
            "deleted_objectives": deleted_titles,
            "cascading_delete": len(children_ids) > 0
        })
    
    except Exception as e:
        return safe_json_dumps({"error": f"Failed to delete objective: {str(e)}"})


@tool
async def move_objective_parent(objective_id: str, new_parent_id: Optional[str] = None) -> str:
    """
    Move an objective to a different parent or make it a root objective.
    All children of the moved objective will move with it, maintaining the hierarchy.
    
    Args:
        objective_id: UUID of the objective to move
        new_parent_id: UUID of the new parent (None for root level)
    
    Returns:
        JSON string confirming the move with count of affected objectives
    """
    try:
        repo = ObjectiveRepository()
        
        # First check if the objective exists
        target_objective = await repo.get_by_id(UUID(objective_id))
        if not target_objective:
            return safe_json_dumps({"error": f"Objective with ID {objective_id} not found"})
        
        # Get all objectives to find children
        all_objectives = await repo.get_all()
        
        # Find all children recursively
        def find_all_children(parent_id: UUID) -> List[UUID]:
            children = []
            for obj in all_objectives:
                if obj.parent_id == parent_id:
                    children.append(obj.id)
                    # Recursively find children of this child
                    children.extend(find_all_children(obj.id))
            return children
        
        # Get all children of the target objective
        children_ids = find_all_children(UUID(objective_id))
        
        # Calculate new degrees
        new_parent_degree = 0
        if new_parent_id:
            parent = await repo.get_by_id(UUID(new_parent_id))
            if not parent:
                return safe_json_dumps({"error": f"New parent with ID {new_parent_id} not found"})
            new_parent_degree = parent.degree
        
        # Move the target objective
        updates = {
            "parent_id": UUID(new_parent_id) if new_parent_id else None,
            "degree": new_parent_degree + 1 if new_parent_id else 0
        }
        
        updated = await repo.update(UUID(objective_id), updates)
        moved_count = 1
        moved_titles = [target_objective.title]
        
        # Update degrees for all children recursively
        async def update_children_degrees(parent_obj_id: UUID, parent_degree: int):
            nonlocal moved_count, moved_titles
            for obj in all_objectives:
                if obj.parent_id == parent_obj_id:
                    new_degree = parent_degree + 1
                    child_updates = {"degree": new_degree}
                    repo_result = await repo.update(obj.id, child_updates)
                    if repo_result:
                        moved_count += 1
                        moved_titles.append(obj.title)
                    # Recursively update children of this child
                    await update_children_degrees(obj.id, new_degree)
        
        # Update all children's degrees
        if children_ids:
            await update_children_degrees(UUID(objective_id), updates["degree"])
        
        return safe_json_dumps({
            "success": True,
            "message": f"Moved {moved_count} objective(s) including {target_objective.title} and all children",
            "moved_count": moved_count,
            "moved_objectives": moved_titles,
            "target_objective": updated.dict(),
            "children_moved": len(children_ids) > 0
        }, indent=2)
    
    except Exception as e:
        return safe_json_dumps({"error": f"Failed to move objective: {str(e)}"}) 