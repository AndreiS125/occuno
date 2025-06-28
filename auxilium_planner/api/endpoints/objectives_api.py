from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta

from domain.models import Objective, Task, ObjectiveStatus, ObjectiveType, EnergyLevel, RecurringInfo
from repositories import ObjectiveRepository
from services.gamification_service import GamificationService

router = APIRouter(tags=["objectives"])

# Dependency injection
def get_objective_repo():
    return ObjectiveRepository()

def get_gamification_service():
    return GamificationService()

# Request/Response models
class RecurringInfoRequest(BaseModel):
    frequency: str  # "daily", "weekly", "monthly"
    interval: int = 1
    days_of_week: Optional[List[int]] = None
    time_of_day: Optional[str] = None
    end_date: Optional[str] = None  # ISO date string for when recurrence ends
    weekday_of_month: Optional[int] = None  # For monthly recurrence on nth weekday

class ObjectiveCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    objective_type: ObjectiveType = ObjectiveType.SUB_OBJECTIVE
    parent_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    # Task-specific fields
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    estimated_duration: Optional[int] = None  # minutes
    actionable_steps: List[str] = []
    # Common fields
    priority_score: float = 0.5
    complexity_score: float = 0.5
    energy_requirement: EnergyLevel = EnergyLevel.MEDIUM
    context_tags: List[str] = []
    success_criteria: List[str] = []
    # Recurring fields
    recurring: Optional[RecurringInfoRequest] = None

class ObjectiveUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    objective_type: Optional[ObjectiveType] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    # Task-specific fields
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    estimated_duration: Optional[int] = None  # minutes
    actionable_steps: Optional[List[str]] = None
    # Common fields
    priority_score: Optional[float] = None
    complexity_score: Optional[float] = None
    energy_requirement: Optional[EnergyLevel] = None
    status: Optional[ObjectiveStatus] = None
    completion_percentage: Optional[float] = None
    # Recurring fields
    recurring: Optional[RecurringInfoRequest] = None

class TaskCreateRequest(ObjectiveCreateRequest):
    objective_type: ObjectiveType = ObjectiveType.TASK
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    estimated_duration: Optional[int] = None  # minutes
    actionable_steps: List[str] = []

@router.get("/", response_model=List[dict])
async def get_all_objectives(
    status: Optional[ObjectiveStatus] = None,
    parent_id: Optional[UUID] = None,
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Get all objectives, optionally filtered by status or parent."""
    objectives = await objective_repo.get_all()
    
    # Apply filters
    if status:
        objectives = [obj for obj in objectives if obj.status == status]
    if parent_id:
        objectives = [obj for obj in objectives if obj.parent_id == parent_id]
    
    return [obj.dict() for obj in objectives]

@router.get("/root", response_model=List[dict])
async def get_root_objectives(
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Get all root objectives (no parent)."""
    objectives = await objective_repo.get_root_objectives()
    return [obj.dict() for obj in objectives]

@router.get("/upcoming", response_model=List[dict])
async def get_upcoming_tasks(
    days: int = 7,
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Get tasks due in the next N days."""
    tasks = await objective_repo.get_upcoming_tasks(days)
    return [task.dict() for task in tasks]

@router.get("/search")
async def search_objectives(
    query: str,
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Search objectives by title or description."""
    objectives = await objective_repo.get_all()
    
    # Simple search implementation
    query_lower = query.lower()
    results = [
        obj for obj in objectives
        if query_lower in obj.title.lower() or 
        (obj.description and query_lower in obj.description.lower())
    ]
    
    return [obj.dict() for obj in results]

@router.get("/stats")
async def get_objectives_statistics(
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Get statistics about objectives."""
    objectives = await objective_repo.get_all()
    
    # Calculate statistics
    total = len(objectives)
    by_status = {}
    by_type = {}
    
    for obj in objectives:
        # Count by status
        status = obj.status
        by_status[status] = by_status.get(status, 0) + 1
        
        # Count by type
        obj_type = obj.objective_type
        by_type[obj_type] = by_type.get(obj_type, 0) + 1
    
    # Calculate completion rate
    completed = by_status.get(ObjectiveStatus.COMPLETED, 0)
    completion_rate = (completed / total * 100) if total > 0 else 0
    
    return {
        "total": total,
        "by_status": by_status,
        "by_type": by_type,
        "completion_rate": round(completion_rate, 2),
        "active_count": by_status.get(ObjectiveStatus.IN_PROGRESS, 0),
        "blocked_count": by_status.get(ObjectiveStatus.BLOCKED, 0)
    }

@router.get("/{objective_id}", response_model=dict)
async def get_objective(
    objective_id: UUID,
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Get a specific objective by ID."""
    objective = await objective_repo.get_by_id(objective_id)
    if not objective:
        raise HTTPException(status_code=404, detail="Objective not found")
    return objective.dict()

@router.get("/{objective_id}/children", response_model=List[dict])
async def get_objective_children(
    objective_id: UUID,
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Get all child objectives of a specific objective."""
    children = await objective_repo.get_by_parent(objective_id)
    return [child.dict() for child in children]

@router.post("/", response_model=dict)
async def create_objective(
    request: ObjectiveCreateRequest,
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Create a new objective."""
    request_data = request.dict(exclude_unset=True)
    
    # Handle recurring info conversion
    if request.recurring:
        recurring_data = request.recurring.dict(exclude_unset=True)
        # Convert end_date string to datetime if provided
        if recurring_data.get('end_date'):
            recurring_data['next_occurrence'] = datetime.fromisoformat(recurring_data.pop('end_date'))
        request_data['recurring'] = RecurringInfo(**recurring_data)
    
    if request.objective_type == ObjectiveType.TASK:
        # Handle task-specific fields
        if request.estimated_duration:
            request_data["estimated_duration"] = timedelta(minutes=request.estimated_duration)
        objective = Task(**request_data)
    else:
        # Remove task-specific fields for non-tasks
        task_fields = ['start_time', 'end_time', 'location', 'estimated_duration', 'actionable_steps']
        for field in task_fields:
            request_data.pop(field, None)
        objective = Objective(**request_data)
    
    created = await objective_repo.create(objective)
    return created.dict()

@router.post("/task", response_model=dict)
async def create_task(
    request: TaskCreateRequest,
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Create a new task (convenience endpoint)."""
    task_data = request.dict()
    
    # Handle recurring info conversion
    if request.recurring:
        recurring_data = request.recurring.dict(exclude_unset=True)
        # Convert end_date string to datetime if provided
        if recurring_data.get('end_date'):
            recurring_data['next_occurrence'] = datetime.fromisoformat(recurring_data.pop('end_date'))
        task_data['recurring'] = RecurringInfo(**recurring_data)
    
    if request.estimated_duration:
        task_data["estimated_duration"] = timedelta(minutes=request.estimated_duration)
    
    task = Task(**task_data)
    created = await objective_repo.create(task)
    return created.dict()

@router.put("/{objective_id}", response_model=dict)
async def update_objective(
    objective_id: UUID,
    request: ObjectiveUpdateRequest,
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Update an existing objective."""
    updates = request.dict(exclude_unset=True)
    
    # Handle recurring info conversion
    if "recurring" in updates and updates["recurring"]:
        recurring_data = updates["recurring"]
        # Convert end_date string to datetime if provided
        if recurring_data.get('end_date'):
            recurring_data['next_occurrence'] = datetime.fromisoformat(recurring_data.pop('end_date'))
        updates['recurring'] = recurring_data
    
    # Handle estimated_duration conversion for tasks
    if "estimated_duration" in updates and updates["estimated_duration"] is not None:
        updates["estimated_duration"] = timedelta(minutes=updates["estimated_duration"])
    
    updated = await objective_repo.update(objective_id, updates)
    
    if not updated:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    return updated.dict()

@router.post("/{objective_id}/complete", response_model=dict)
async def complete_objective(
    objective_id: UUID,
    objective_repo: ObjectiveRepository = Depends(get_objective_repo),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Mark an objective as completed and process gamification."""
    # Update status
    updated = await objective_repo.update(
        objective_id, 
        {"status": ObjectiveStatus.COMPLETED, "completion_percentage": 100.0}
    )
    
    if not updated:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    # Process gamification
    if updated.objective_type == ObjectiveType.TASK:
        gamification_result = await gamification.process_task_completion(objective_id)
    else:
        gamification_result = await gamification.process_objective_completion(objective_id)
    
    return {
        "objective": updated.dict(),
        "gamification": gamification_result
    }

@router.delete("/{objective_id}")
async def delete_objective(
    objective_id: UUID,
    objective_repo: ObjectiveRepository = Depends(get_objective_repo)
):
    """Delete an objective and all its children."""
    deleted = await objective_repo.delete(objective_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    return {"success": True, "message": "Objective and children deleted"} 