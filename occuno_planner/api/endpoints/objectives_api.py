from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta

from core.models import Objective, ObjectiveType, ObjectiveStatus, EnergyLevel, RecurringInfo, UserProfile
from repositories.repository_factory import get_objective_repository
from services.gamification_service import GamificationService
from auth.users import current_active_user

router = APIRouter(tags=["objectives"])

# Dependency injection
def get_objective_repo():
    return get_objective_repository()

def get_gamification_service():
    # Construct service with its own repos
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
    objective_type: str = "sub_objective"  # Use string values
    parent_id: Optional[UUID] = None
    calendar_id: Optional[UUID] = None  # Calendar assignment
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    all_day: bool = False  # Explicit all-day flag
    is_timed: bool = True  # Whether this objective is time-bound
    # Task-specific fields
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    estimated_duration: Optional[int] = None  # minutes
    actionable_steps: List[str] = []
    # Common fields
    priority_score: float = 0.5
    complexity_score: float = 0.5
    energy_requirement: str = "medium"  # Use string values
    context_tags: List[str] = []
    success_criteria: List[str] = []
    # Recurring fields
    recurring: Optional[RecurringInfoRequest] = None

class ObjectiveUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    objective_type: Optional[str] = None  # Use string values
    parent_id: Optional[UUID] = None
    calendar_id: Optional[UUID] = None  # Calendar assignment
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    all_day: Optional[bool] = None  # Explicit all-day flag
    is_timed: Optional[bool] = None  # Whether this objective is time-bound
    # Task-specific fields
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    estimated_duration: Optional[int] = None  # minutes
    actionable_steps: Optional[List[str]] = None
    # Common fields
    priority_score: Optional[float] = None
    complexity_score: Optional[float] = None
    energy_requirement: Optional[str] = None  # Use string values
    context_tags: Optional[List[str]] = None
    success_criteria: Optional[List[str]] = None
    status: Optional[str] = None  # Use string values
    completion_percentage: Optional[float] = None
    # Recurring fields
    recurring: Optional[RecurringInfoRequest] = None

class TaskCreateRequest(ObjectiveCreateRequest):
    objective_type: str = "task"  # Use string values
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    estimated_duration: Optional[int] = None  # minutes
    actionable_steps: List[str] = []

@router.get("/", response_model=List[dict])
def get_all_objectives(
    current_user: UserProfile = Depends(current_active_user),
    status: Optional[str] = None,
    parent_id: Optional[UUID] = None,
    calendar_ids: Optional[str] = None,  # Comma-separated calendar IDs for filtering
    objective_repo = Depends(get_objective_repo)
):
    """Get all objectives for the current user, optionally filtered by status, parent, or calendars."""
    if status:
        objectives = objective_repo.get_by_status_and_user(status, current_user.id)
    elif parent_id:
        objectives = objective_repo.get_by_parent_id_and_user(parent_id, current_user.id)
    else:
        objectives = objective_repo.get_by_user_id(current_user.id)
    
    # Apply calendar filtering if specified
    if calendar_ids:
        try:
            calendar_id_list = [UUID(cid.strip()) for cid in calendar_ids.split(",") if cid.strip()]
            if calendar_id_list:
                objectives = [obj for obj in objectives if obj.calendar_id in calendar_id_list]
        except ValueError:
            # Invalid UUID format, skip filtering
            pass
    
    return [obj.dict() for obj in objectives]

@router.get("/root", response_model=List[dict])
def get_root_objectives(
    current_user: UserProfile = Depends(current_active_user),
    objective_repo = Depends(get_objective_repo)
):
    """Get all root objectives (no parent) for the current user."""
    objectives = objective_repo.get_by_parent_id_and_user(None, current_user.id)
    return [obj.dict() for obj in objectives]

@router.get("/upcoming", response_model=List[dict])
def get_upcoming_tasks(
    current_user: UserProfile = Depends(current_active_user),
    days: int = 7,
    objective_repo = Depends(get_objective_repo)
):
    """Get tasks due in the next N days for the current user."""
    tasks = objective_repo.get_due_soon_for_user(days * 24, current_user.id)  # Convert days to hours
    return [task.dict() for task in tasks]

@router.get("/search")
def search_objectives(
    query: str,
    current_user: UserProfile = Depends(current_active_user),
    objective_repo = Depends(get_objective_repo)
):
    """Search objectives by title or description for the current user."""
    results = objective_repo.search_for_user(query, current_user.id)
    return [obj.dict() for obj in results]

@router.get("/stats")
def get_objectives_statistics(
    current_user: UserProfile = Depends(current_active_user),
    objective_repo = Depends(get_objective_repo)
):
    """Get statistics about objectives for the current user."""
    return objective_repo.get_statistics_for_user(current_user.id)

@router.get("/{objective_id}", response_model=dict)
def get_objective(
    objective_id: UUID,
    current_user: UserProfile = Depends(current_active_user),
    objective_repo = Depends(get_objective_repo)
):
    """Get a specific objective by ID for the current user."""
    objective = objective_repo.get_by_id(objective_id)
    if not objective or objective.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objective not found")
    return objective.dict()

@router.get("/{objective_id}/children", response_model=List[dict])
def get_objective_children(
    objective_id: UUID,
    objective_repo = Depends(get_objective_repo)
):
    """Get all child objectives of a specific objective."""
    children = objective_repo.get_by_parent_id(objective_id)
    return [child.dict() for child in children]

@router.post("/", response_model=dict)
def create_objective(
    request: ObjectiveCreateRequest,
    current_user: UserProfile = Depends(current_active_user),
    objective_repo = Depends(get_objective_repo)
):
    """Create a new objective for the current user."""
    try:
        request_data = request.dict(exclude_unset=True)
        
        # Set the user_id to the authenticated user
        request_data['user_id'] = current_user.id
        
        # For non-timed objectives, clear time-related fields
        if not request_data.get('is_timed', True):
            request_data.update({
                'start_date': None,
                'due_date': None,
                'all_day': False,
                'start_time': None,
                'end_time': None,
                'estimated_duration': None
            })
        
        # Auto-detect all-day events for multi-day tasks (only for timed objectives)
        elif request_data.get('is_timed', True):
            start_date = request_data.get('start_date')
            due_date = request_data.get('due_date')
            
            if start_date and due_date:
                # Check if task spans multiple days or is >= 24 hours
                if isinstance(start_date, str):
                    start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if isinstance(due_date, str):
                    due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                
                # Different days OR duration >= 24 hours
                different_days = start_date.date() != due_date.date()
                duration_hours = (due_date - start_date).total_seconds() / 3600
                is_long_duration = duration_hours >= 24
                
                if different_days or is_long_duration:
                    request_data['all_day'] = True
                    print(f"🗓️ Auto-marking as all-day: different_days={different_days}, duration={duration_hours:.1f}h")
        
        # Handle recurring info conversion
        if request.recurring:
            recurring_data = request.recurring.dict(exclude_unset=True)
            # Convert end_date string to datetime if provided
            if recurring_data.get('end_date'):
                recurring_data['next_occurrence'] = datetime.fromisoformat(recurring_data.pop('end_date'))
            request_data['recurring'] = RecurringInfo(**recurring_data)
        
        # Handle estimated_duration conversion
        if request.estimated_duration:
            request_data["estimated_duration"] = request.estimated_duration * 60  # Convert minutes to seconds
        
        # Create SQLModel objective directly
        objective = Objective(**request_data)
        
        created = objective_repo.create(objective)
        return created.dict()
        
    except ValueError as e:
        # Handle parent validation errors
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/task", response_model=dict)
def create_task(
    request: TaskCreateRequest,
    current_user: UserProfile = Depends(current_active_user),
    objective_repo = Depends(get_objective_repo)
):
    """Create a new task (convenience endpoint)."""
    # Ensure it's marked as a task
    request.objective_type = "task"
    return create_objective(request, current_user, objective_repo)

@router.put("/{objective_id}", response_model=dict)
def update_objective(
    objective_id: UUID,
    request: ObjectiveUpdateRequest,
    include_gamification: bool = False,
    current_user: UserProfile = Depends(current_active_user),
    objective_repo = Depends(get_objective_repo)
):
    """Update an existing objective for the current user."""
    try:
        request_data = request.dict(exclude_unset=True)
        
        # Initialize local working variables for date computations
        start_dt = None
        due_dt = None
        
        # For non-timed objectives, clear time-related fields
        if request_data.get('is_timed') is False:
            # Force clear all time-related fields
            request_data['start_date'] = None
            request_data['due_date'] = None
            request_data['all_day'] = False
            request_data['start_time'] = None
            request_data['end_time'] = None
            request_data['estimated_duration'] = None
            request_data['actual_duration'] = None
            print(f"🚫 Clearing time fields for non-timed objective")
        
        # Auto-detect all-day events for multi-day tasks when dates are updated (only for timed objectives)
        elif request_data.get('is_timed') is not False:
            start_dt = request_data.get('start_date')
            due_dt = request_data.get('due_date')
            
            # Get existing objective to check current dates if only one is being updated
            if (start_dt or due_dt) and not (start_dt and due_dt):
                existing = objective_repo.get_by_id_and_user(objective_id, current_user.id)
                if existing:
                    if not start_dt:
                        start_dt = existing.start_date
                    if not due_dt:
                        due_dt = existing.due_date
        
        if start_dt and due_dt:
            # Check if task spans multiple days or is >= 24 hours
            if isinstance(start_dt, str):
                start_dt = datetime.fromisoformat(start_dt.replace('Z', '+00:00'))
            if isinstance(due_dt, str):
                due_dt = datetime.fromisoformat(due_dt.replace('Z', '+00:00'))
            
            # Different days OR duration >= 24 hours
            different_days = start_dt.date() != due_dt.date()
            duration_hours = (due_dt - start_dt).total_seconds() / 3600
            is_long_duration = duration_hours >= 24
            
            if different_days or is_long_duration:
                request_data['all_day'] = True
                print(f"🗓️ Auto-marking as all-day: different_days={different_days}, duration={duration_hours:.1f}h")
        
        # Handle recurring info conversion
        if request.recurring:
            recurring_data = request.recurring.dict(exclude_unset=True)
            # Convert end_date string to datetime if provided
            if recurring_data.get('end_date'):
                recurring_data['next_occurrence'] = datetime.fromisoformat(recurring_data.pop('end_date'))
            request_data['recurring'] = RecurringInfo(**recurring_data)
        
        # Handle estimated_duration conversion
        if request.estimated_duration:
            request_data["estimated_duration"] = request.estimated_duration * 60  # Convert minutes to seconds
        
        # Get the existing objective first
        existing = objective_repo.get_by_id(objective_id)
        if not existing or existing.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Objective not found")
        
        # Normalize certain string fields to lowercase to match backend conventions
        for field in ["status", "objective_type", "energy_requirement"]:
            if field in request_data and isinstance(request_data[field], str):
                try:
                    request_data[field] = request_data[field].lower()
                except Exception:
                    pass
        
        # Capture previous completion and incoming completion for diagnostics
        prev_status = (existing.status or "").lower()
        prev_completion = float(existing.completion_percentage or 0)
        incoming_completion = request_data.get("completion_percentage")
        try:
            incoming_completion_val = float(incoming_completion) if incoming_completion is not None else None
        except Exception:
            incoming_completion_val = None

        # If client set completion to >= 100 but forgot to set status, auto-align status to 'completed'
        if incoming_completion_val is not None and incoming_completion_val >= 100 and request_data.get("status") is None:
            request_data["status"] = "completed"

        # Determine if status will transition to completed OR completion crossed threshold
        next_status = (request_data.get("status", prev_status) or "").lower()
        will_complete_by_status = prev_status != "completed" and next_status == "completed"
        will_complete_by_percent = (
            incoming_completion_val is not None
            and prev_completion < 100
            and incoming_completion_val >= 100
        )
        will_complete = will_complete_by_status or will_complete_by_percent

        # Debug logging
        try:
            print(
                f"🧭 update_objective diagnostics: include_gamification={include_gamification}, "
                f"prev_status={prev_status}, next_status={next_status}, "
                f"prev_completion={prev_completion}, incoming_completion={incoming_completion_val}, "
                f"will_complete_by_status={will_complete_by_status}, will_complete_by_percent={will_complete_by_percent}, "
                f"will_complete={will_complete}"
            )
        except Exception:
            pass
        
        # Apply updates to the existing objective
        for key, value in request_data.items():
            if hasattr(existing, key):
                setattr(existing, key, value)
        
        updated = objective_repo.update(existing)
        
        if not updated:
            raise HTTPException(status_code=404, detail="Objective not found")
        
        # If the update caused a transition to completed, process gamification
        gamification_result = None
        if will_complete:
            try:
                gamification = GamificationService()
                obj_type = (updated.objective_type or "").lower()
                if obj_type == "task":
                    gamification_result = gamification.process_task_completion(objective_id)
                else:
                    gamification_result = gamification.process_objective_completion(objective_id)
                try:
                    xp = None
                    if isinstance(gamification_result, dict):
                        xp = (
                            gamification_result.get("total_xp_earned")
                            or gamification_result.get("xp_earned")
                            or 0
                        )
                    print(f"🎮 Gamification processed: type={obj_type}, xp={xp}")
                except Exception:
                    pass
            except Exception as e:
                # Do not fail the update if gamification processing errors out
                print(f"⚠️ Gamification processing failed on update: {e}")
        
        # If caller requested gamification details and we have them, return extended payload
        if include_gamification and will_complete:
            return {"objective": updated.dict(), "gamification": gamification_result}
        
        return updated.dict()
        
    except ValueError as e:
        # Handle parent validation errors
        if "Parent objective" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        # Handle other ValueError cases (like objective not found)
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{objective_id}/complete", response_model=dict)
def complete_objective(
    objective_id: UUID,
    current_user: UserProfile = Depends(current_active_user),
    objective_repo = Depends(get_objective_repo),
    gamification: GamificationService = Depends(get_gamification_service)
):
    """Mark an objective as completed and process gamification for the current user."""
    print(f"🎯 Completing objective: {objective_id} for user: {current_user.id}")
    
    # Update status
    existing = objective_repo.get_by_id(objective_id)
    if not existing or existing.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    existing.status = "completed"
    existing.completion_percentage = 100.0
    updated = objective_repo.update(existing)
    
    if not updated:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    print(f"📊 Objective type: {updated.objective_type}, Title: {updated.title}")
    
    # Process gamification
    if updated.objective_type == "task":
        print("🔄 Processing task completion...")
        gamification_result = gamification.process_task_completion(objective_id)
    else:
        print("🔄 Processing objective completion...")
        gamification_result = gamification.process_objective_completion(objective_id)
    
    print(f"🎮 Gamification result: {gamification_result}")
    
    return {
        "objective": updated.dict(),
        "gamification": gamification_result
    }

@router.delete("/{objective_id}")
def delete_objective(
    objective_id: UUID,
    current_user: UserProfile = Depends(current_active_user),
    objective_repo = Depends(get_objective_repo)
):
    """Delete an objective and all its children for the current user."""
    # Verify ownership before deletion
    existing = objective_repo.get_by_id(objective_id)
    if not existing or existing.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    deleted = objective_repo.delete(objective_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Objective not found")
    
    return {"success": True, "message": "Objective and children deleted"} 