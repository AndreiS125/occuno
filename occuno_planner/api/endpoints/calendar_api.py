from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime

from core.models import Calendar, UserProfile
from repositories.repository_factory import get_calendar_repository
from auth.users import current_active_user

router = APIRouter(tags=["calendars"])

# Dependency injection
def get_calendar_repo():
    return get_calendar_repository()

# Request/Response models
class CalendarCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#3b82f6"
    is_default: bool = False
    is_visible: bool = True

class CalendarUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_default: Optional[bool] = None
    is_visible: Optional[bool] = None

@router.get("/", response_model=List[dict])
def get_calendars(
    current_user: UserProfile = Depends(current_active_user),
    calendar_repo = Depends(get_calendar_repo)
):
    """Get all calendars for the current user."""
    calendars = calendar_repo.get_by_user_id(current_user.id)
    return [calendar.dict() for calendar in calendars]

@router.get("/visible", response_model=List[dict])
def get_visible_calendars(
    current_user: UserProfile = Depends(current_active_user),
    calendar_repo = Depends(get_calendar_repo)
):
    """Get all visible calendars for the current user."""
    calendars = calendar_repo.get_visible_calendars(current_user.id)
    return [calendar.dict() for calendar in calendars]

@router.get("/default", response_model=dict)
def get_default_calendar(
    current_user: UserProfile = Depends(current_active_user),
    calendar_repo = Depends(get_calendar_repo)
):
    """Get the default calendar for the current user."""
    calendar = calendar_repo.get_default_calendar(current_user.id)
    if not calendar:
        # Create default calendar if none exists
        calendar = calendar_repo.ensure_default_calendar(current_user.id)
    return calendar.dict()

@router.get("/{calendar_id}", response_model=dict)
def get_calendar(
    calendar_id: UUID,
    current_user: UserProfile = Depends(current_active_user),
    calendar_repo = Depends(get_calendar_repo)
):
    """Get a specific calendar by ID for the current user."""
    calendar = calendar_repo.get_by_id(calendar_id)
    if not calendar or calendar.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return calendar.dict()

@router.post("/", response_model=dict)
def create_calendar(
    request: CalendarCreateRequest,
    current_user: UserProfile = Depends(current_active_user),
    calendar_repo = Depends(get_calendar_repo)
):
    """Create a new calendar for the current user."""
    try:
        request_data = request.dict()
        request_data['user_id'] = current_user.id
        
        # If this is set as default, ensure no other calendar is default
        if request.is_default:
            calendar_repo.set_default_calendar(current_user.id, None)  # Unset all defaults first
        
        # Create SQLModel calendar directly
        calendar = Calendar(**request_data)
        created = calendar_repo.create(calendar)
        
        # If this is the first calendar, make it default
        user_calendars = calendar_repo.get_by_user_id(current_user.id)
        if len(user_calendars) == 1:
            created.is_default = True
            calendar_repo.update(created)
        
        return created.dict()
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{calendar_id}", response_model=dict)
def update_calendar(
    calendar_id: UUID,
    request: CalendarUpdateRequest,
    current_user: UserProfile = Depends(current_active_user),
    calendar_repo = Depends(get_calendar_repo)
):
    """Update an existing calendar for the current user."""
    try:
        # Get the existing calendar first
        existing = calendar_repo.get_by_id(calendar_id)
        if not existing or existing.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Calendar not found")
        
        request_data = request.dict(exclude_unset=True)
        
        # If setting as default, unset other defaults first
        if request_data.get('is_default', False):
            calendar_repo.set_default_calendar(current_user.id, calendar_id)
            request_data.pop('is_default')  # Remove from update data as it's handled above
        
        # Apply updates to the existing calendar
        for key, value in request_data.items():
            if hasattr(existing, key):
                setattr(existing, key, value)
        
        updated = calendar_repo.update(existing)
        
        if not updated:
            raise HTTPException(status_code=404, detail="Calendar not found")
        
        return updated.dict()
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{calendar_id}/set-default")
def set_default_calendar(
    calendar_id: UUID,
    current_user: UserProfile = Depends(current_active_user),
    calendar_repo = Depends(get_calendar_repo)
):
    """Set a calendar as the default for the current user."""
    # Verify the calendar exists and belongs to the user
    calendar = calendar_repo.get_by_id(calendar_id)
    if not calendar or calendar.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    success = calendar_repo.set_default_calendar(current_user.id, calendar_id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to set default calendar")
    
    return {"success": True, "message": "Default calendar updated"}

@router.post("/{calendar_id}/toggle-visibility")
def toggle_calendar_visibility(
    calendar_id: UUID,
    current_user: UserProfile = Depends(current_active_user),
    calendar_repo = Depends(get_calendar_repo)
):
    """Toggle the visibility of a calendar."""
    # Get the existing calendar first
    existing = calendar_repo.get_by_id(calendar_id)
    if not existing or existing.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    # Toggle visibility
    existing.is_visible = not existing.is_visible
    updated = calendar_repo.update(existing)
    
    return {
        "success": True, 
        "message": f"Calendar {'shown' if updated.is_visible else 'hidden'}",
        "is_visible": updated.is_visible
    }

@router.delete("/{calendar_id}")
def delete_calendar(
    calendar_id: UUID,
    current_user: UserProfile = Depends(current_active_user),
    calendar_repo = Depends(get_calendar_repo)
):
    """Delete a calendar for the current user."""
    # Verify ownership before deletion
    existing = calendar_repo.get_by_id(calendar_id)
    if not existing or existing.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    # Prevent deletion of default calendar if it's the only one
    user_calendars = calendar_repo.get_by_user_id(current_user.id)
    if len(user_calendars) == 1:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete the only calendar. Create another calendar first."
        )
    
    # If deleting the default calendar, set another as default
    if existing.is_default and len(user_calendars) > 1:
        other_calendar = next((c for c in user_calendars if c.id != calendar_id), None)
        if other_calendar:
            calendar_repo.set_default_calendar(current_user.id, other_calendar.id)
    
    deleted = calendar_repo.delete(calendar_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    return {"success": True, "message": "Calendar deleted"}

@router.post("/ensure-default")
def ensure_default_calendar(
    current_user: UserProfile = Depends(current_active_user),
    calendar_repo = Depends(get_calendar_repo)
):
    """Ensure the user has a default calendar, create one if needed."""
    calendar = calendar_repo.ensure_default_calendar(current_user.id)
    return calendar.dict()
