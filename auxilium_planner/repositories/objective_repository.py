from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from datetime import datetime

from domain.models import Objective, Task, ObjectiveStatus, ObjectiveType
from core.config import settings
from repositories.file_repository import FileRepository
from core.logging_config import get_logger

class ObjectiveRepository:
    """Repository for managing objectives and tasks."""
    
    def __init__(self):
        """Initialize the objective repository."""
        from core.config import settings
        self.file_repo = FileRepository(settings.data_file_path)
        self.logger = get_logger("objective_repo")
    
    async def get_all(self) -> List[Union[Objective, Task]]:
        """Get all objectives and tasks."""
        try:
            data = await self.file_repo.load_data()
            objectives_data = data.get("objectives", [])
            
            objectives = []
            for obj_data in objectives_data:
                # Handle both Task and Objective types
                if obj_data.get("objective_type") == "TASK" and "start_time" in obj_data:
                    objectives.append(Task(**obj_data))
                else:
                    objectives.append(Objective(**obj_data))
            
            self.logger.debug(f"📋 Retrieved {len(objectives)} objectives and tasks")
            return objectives
            
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives and tasks: {e}")
            return []
    
    async def get_by_id(self, objective_id: UUID) -> Optional[Union[Objective, Task]]:
        """Get a specific objective or task by ID."""
        try:
            objectives = await self.get_all()
            for obj in objectives:
                if obj.id == objective_id:
                    self.logger.debug(f"📋 Found objective or task: {obj.title}")
                    return obj
            
            self.logger.warning(f"❓ Objective or task not found: {objective_id}")
            return None
            
        except Exception as e:
            self.logger.error(f"❌ Error getting objective or task by ID: {e}")
            return None
    
    async def get_by_parent(self, parent_id: UUID) -> List[Union[Objective, Task]]:
        """Get all objectives/tasks with a specific parent."""
        try:
            objectives = await self.get_all()
            child_objectives = [obj for obj in objectives if obj.parent_id == parent_id]
            
            self.logger.debug(f"📋 Found {len(child_objectives)} child objectives or tasks for parent {parent_id}")
            return child_objectives
            
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives or tasks by parent ID: {e}")
            return []
    
    async def get_root_objectives(self) -> List[Objective]:
        """Get all root objectives (no parent)."""
        try:
            objectives = await self.get_all()
            root_objectives = [
                obj for obj in objectives 
                if obj.parent_id is None and obj.objective_type == ObjectiveType.ROOT
            ]
            
            self.logger.debug(f"📋 Found {len(root_objectives)} root objectives")
            return root_objectives
            
        except Exception as e:
            self.logger.error(f"❌ Error getting root objectives: {e}")
            return []
    
    async def create(self, objective: Union[Objective, Task]) -> Union[Objective, Task]:
        """Create a new objective or task."""
        try:
            data = await self.file_repo.load_data()
            
            if "objectives" not in data:
                data["objectives"] = []
            
            objective.created_at = datetime.utcnow()
            objective.updated_at = datetime.utcnow()
            
            # Calculate degree based on parent
            if objective.parent_id:
                parent = await self.get_by_id(objective.parent_id)
                if parent:
                    objective.degree = parent.degree + 1
            
            data["objectives"].append(objective.dict())
            await self.file_repo.save_data(data)
            
            self.logger.info(f"✅ Created objective or task: {objective.title} (ID: {objective.id})")
            return objective
            
        except Exception as e:
            self.logger.error(f"❌ Error creating objective or task: {e}")
            raise
    
    async def update(self, objective_id: UUID, updates: dict) -> Optional[Union[Objective, Task]]:
        """Update an existing objective or task."""
        try:
            data = await self.file_repo.load_data()
            objectives_data = data.get("objectives", [])
            
            for i, obj_data in enumerate(objectives_data):
                if obj_data["id"] == str(objective_id):
                    # Update fields - allow adding new fields and updating existing ones
                    for key, value in updates.items():
                        # Special handling for fields that should allow None values
                        nullable_fields = {"parent_id", "description", "due_date", "start_date", "start_time", "end_time", "location"}
                        
                        if value is not None or key in nullable_fields:
                            # Handle special conversions
                            if key == "estimated_duration" and hasattr(value, 'total_seconds'):
                                # Convert timedelta to total seconds for storage
                                obj_data[key] = value.total_seconds()
                            else:
                                obj_data[key] = value
                    
                    obj_data["updated_at"] = datetime.utcnow().isoformat()
                    objectives_data[i] = obj_data
                    
                    await self.file_repo.save_data(data)
                    
                    # Return the correct type based on objective_type
                    if obj_data.get("objective_type") == "task":
                        updated_obj = Task(**obj_data)
                    else:
                        updated_obj = Objective(**obj_data)
                    
                    self.logger.info(f"✅ Updated objective or task: {obj_data['title']} (Type: {obj_data.get('objective_type')}) - Updated fields: {list(updates.keys())}")
                    return updated_obj
            
            raise ValueError(f"Objective or task with ID {objective_id} not found")
            
        except Exception as e:
            self.logger.error(f"❌ Error updating objective or task: {e}")
            raise
    
    async def delete(self, objective_id: UUID) -> bool:
        """Delete an objective or task."""
        try:
            data = await self.file_repo.load_data()
            objectives_data = data.get("objectives", [])
            
            original_count = len(objectives_data)
            objectives_data[:] = [obj for obj in objectives_data if obj["id"] != str(objective_id)]
            
            if len(objectives_data) < original_count:
                await self.file_repo.save_data(data)
                self.logger.info(f"✅ Deleted objective or task: {objective_id}")
                return True
            else:
                self.logger.warning(f"❓ Objective or task not found for deletion: {objective_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Error deleting objective or task: {e}")
            return False
    
    async def get_by_status(self, status: ObjectiveStatus) -> List[Union[Objective, Task]]:
        """Get all objectives/tasks with a specific status."""
        try:
            objectives = await self.get_all()
            filtered = [obj for obj in objectives if obj.status == status]
            
            self.logger.debug(f"📊 Found {len(filtered)} objectives or tasks with status {status}")
            return filtered
            
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives or tasks by status: {e}")
            return []
    
    async def get_upcoming_tasks(self, days: int = 7) -> List[Task]:
        """Get tasks due in the next N days."""
        from datetime import timedelta
        
        try:
            objectives = await self.get_all()
            now = datetime.utcnow()
            future_date = now + timedelta(days=days)
            
            upcoming = []
            for obj in objectives:
                if (isinstance(obj, Task) and 
                    obj.due_date and 
                    now <= obj.due_date <= future_date):
                    upcoming.append(obj)
            
            self.logger.debug(f"📋 Found {len(upcoming)} upcoming tasks")
            return sorted(upcoming, key=lambda x: x.due_date)
            
        except Exception as e:
            self.logger.error(f"❌ Error getting upcoming tasks: {e}")
            raise 