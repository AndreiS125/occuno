"""
SQLAlchemy-based objective repository

This repository replaces the SQLite-based objective repository while
maintaining complete API compatibility and preserving all existing behavior.
"""

from typing import List, Optional, Union
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from domain.models import (
    Objective, Task, ObjectiveStatus, ObjectiveType, EnergyLevel, RecurringInfo
)
from core.sqlalchemy_database import sqlalchemy_db_manager
from core.sqlalchemy_models import ObjectiveModel
from core.logging_config import get_logger

class SQLAlchemyObjectiveRepository:
    """SQLAlchemy-based repository for managing objectives and tasks with ACID guarantees"""
    
    def __init__(self):
        self.logger = get_logger("sqlalchemy_objective_repo")
    
    def _model_to_pydantic(self, model: ObjectiveModel) -> Union[Objective, Task]:
        """Convert SQLAlchemy model to Pydantic model"""
        if not model:
            return None
        
        # Parse recurring info
        recurring = None
        if model.recurring:
            recurring = RecurringInfo(**model.recurring)
        
        # Convert dependencies from list of strings to list of UUIDs
        dependencies = []
        if model.dependencies:
            for dep in model.dependencies:
                if isinstance(dep, str):
                    dependencies.append(UUID(dep))
                else:
                    dependencies.append(dep)
        
        # Base data for both Objective and Task
        base_data = {
            'id': model.id,
            'title': model.title,
            'description': model.description,
            'parent_id': model.parent_id,
            'degree': model.degree,
            'objective_type': ObjectiveType(model.objective_type),
            'created_at': model.created_at,
            'updated_at': model.updated_at,
            'start_date': model.start_date,
            'due_date': model.due_date,
            'all_day': model.all_day,
            'priority_score': model.priority_score,
            'complexity_score': model.complexity_score,
            'energy_requirement': EnergyLevel(model.energy_requirement),
            'status': ObjectiveStatus(model.status),
            'completion_percentage': model.completion_percentage,
            'context_tags': model.context_tags or [],
            'dependencies': dependencies,
            'success_criteria': model.success_criteria or [],
            'points_awarded_for_completion': model.points_awarded_for_completion,
            'completion_timeliness_score': model.completion_timeliness_score,
            'recurring': recurring
        }
        
        # Create Task or Objective based on type
        if model.objective_type == ObjectiveType.TASK.value:
            # Add task-specific fields
            task_data = base_data.copy()
            task_data.update({
                'location': model.location,
                'estimated_duration': timedelta(seconds=model.estimated_duration) if model.estimated_duration else None,
                'actual_duration': timedelta(seconds=model.actual_duration) if model.actual_duration else None,
                'actionable_steps': model.actionable_steps or []
            })
            return Task(**task_data)
        else:
            return Objective(**base_data)
    
    def _pydantic_to_model(self, obj: Union[Objective, Task], model: ObjectiveModel = None) -> ObjectiveModel:
        """Convert Pydantic model to SQLAlchemy model"""
        if model is None:
            model = ObjectiveModel()
        
        # Convert dependencies from UUIDs to strings
        dependencies = []
        if obj.dependencies:
            for dep in obj.dependencies:
                dependencies.append(str(dep))
        
        # Update all fields
        model.id = obj.id
        model.title = obj.title
        model.description = obj.description
        model.parent_id = obj.parent_id
        model.degree = obj.degree
        model.objective_type = obj.objective_type.value
        model.created_at = obj.created_at
        model.updated_at = obj.updated_at
        model.start_date = obj.start_date
        model.due_date = obj.due_date
        model.all_day = obj.all_day
        model.priority_score = obj.priority_score
        model.complexity_score = obj.complexity_score
        model.energy_requirement = obj.energy_requirement.value
        model.status = obj.status.value
        model.completion_percentage = obj.completion_percentage
        model.context_tags = obj.context_tags
        model.dependencies = dependencies
        model.success_criteria = obj.success_criteria
        model.points_awarded_for_completion = obj.points_awarded_for_completion
        model.completion_timeliness_score = obj.completion_timeliness_score
        model.recurring = obj.recurring.model_dump() if obj.recurring else None
        
        # Task-specific fields
        if isinstance(obj, Task):
            model.location = obj.location
            model.estimated_duration = obj.estimated_duration.total_seconds() if obj.estimated_duration else None
            model.actual_duration = obj.actual_duration.total_seconds() if obj.actual_duration else None
            model.actionable_steps = obj.actionable_steps
        else:
            # Clear task-specific fields for Objective
            model.location = None
            model.estimated_duration = None
            model.actual_duration = None
            model.actionable_steps = []
        
        return model
    
    async def get_all(self) -> List[Union[Objective, Task]]:
        """Get all objectives and tasks"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                models = session.query(ObjectiveModel).order_by(ObjectiveModel.created_at.desc()).all()
                
                objectives = []
                for model in models:
                    obj = self._model_to_pydantic(model)
                    objectives.append(obj)
                
                self.logger.debug(f"📋 Retrieved {len(objectives)} objectives and tasks")
                return objectives
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives and tasks: {e}")
            return []
    
    async def get_by_id(self, objective_id: UUID) -> Optional[Union[Objective, Task]]:
        """Get a specific objective or task by ID"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                model = session.query(ObjectiveModel).filter_by(id=objective_id).first()
                
                if model:
                    obj = self._model_to_pydantic(model)
                    self.logger.debug(f"📋 Found objective or task: {obj.title}")
                    return obj
                
                self.logger.warning(f"❓ Objective or task not found: {objective_id}")
                return None
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objective or task by ID: {e}")
            return None
    
    async def get_by_parent(self, parent_id: UUID) -> List[Union[Objective, Task]]:
        """Get all objectives/tasks with a specific parent"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                models = session.query(ObjectiveModel).filter_by(parent_id=parent_id).order_by(ObjectiveModel.created_at.asc()).all()
                
                objectives = []
                for model in models:
                    obj = self._model_to_pydantic(model)
                    objectives.append(obj)
                
                self.logger.debug(f"📋 Found {len(objectives)} child objectives or tasks for parent {parent_id}")
                return objectives
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives or tasks by parent ID: {e}")
            return []
    
    async def get_root_objectives(self) -> List[Objective]:
        """Get all root objectives (no parent)"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                models = session.query(ObjectiveModel).filter(
                    and_(
                        ObjectiveModel.parent_id.is_(None),
                        ObjectiveModel.objective_type == ObjectiveType.MAIN_OBJECTIVE.value
                    )
                ).order_by(ObjectiveModel.created_at.asc()).all()
                
                objectives = []
                for model in models:
                    obj = self._model_to_pydantic(model)
                    objectives.append(obj)
                
                self.logger.debug(f"📋 Found {len(objectives)} root objectives")
                return objectives
                
        except Exception as e:
            self.logger.error(f"❌ Error getting root objectives: {e}")
            return []
    
    async def create(self, objective: Union[Objective, Task]) -> Union[Objective, Task]:
        """Create a new objective or task"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                # Validate parent exists if parent_id is provided
                if objective.parent_id:
                    parent_model = session.query(ObjectiveModel).filter_by(id=objective.parent_id).first()
                    if not parent_model:
                        error_msg = f"Parent objective with ID {objective.parent_id} not found"
                        self.logger.error(f"❌ {error_msg}")
                        raise ValueError(error_msg)
                    objective.degree = parent_model.degree + 1
                else:
                    objective.degree = 0
                
                objective.created_at = datetime.utcnow()
                objective.updated_at = datetime.utcnow()
                
                # Convert to SQLAlchemy model and add to session
                model = self._pydantic_to_model(objective)
                session.add(model)
                
                # Session will be committed by the context manager
                
                self.logger.info(f"✅ Created objective or task: {objective.title} (ID: {objective.id})")
                return objective
                
        except Exception as e:
            self.logger.error(f"❌ Error creating objective or task: {e}")
            raise
    
    async def update(self, objective_id: UUID, updates: dict) -> Optional[Union[Objective, Task]]:
        """Update an existing objective or task"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                model = session.query(ObjectiveModel).filter_by(id=objective_id).first()
                if not model:
                    raise ValueError(f"Objective or task with ID {objective_id} not found")
                
                # Validate parent_id if it's being updated
                if "parent_id" in updates and updates["parent_id"] is not None:
                    parent_model = session.query(ObjectiveModel).filter_by(id=updates["parent_id"]).first()
                    if not parent_model:
                        error_msg = f"Parent objective with ID {updates['parent_id']} not found"
                        self.logger.error(f"❌ {error_msg}")
                        raise ValueError(error_msg)
                    updates["degree"] = parent_model.degree + 1
                elif "parent_id" in updates and updates["parent_id"] is None:
                    updates["degree"] = 0
                
                # Apply updates to the model
                for key, value in updates.items():
                    if key == "recurring" and value is not None:
                        if hasattr(value, 'model_dump'):
                            setattr(model, key, value.model_dump())
                        else:
                            setattr(model, key, value)
                    elif key in ["context_tags", "dependencies", "success_criteria", "actionable_steps"]:
                        # Handle list fields
                        if key == "dependencies" and value:
                            # Convert UUIDs to strings
                            setattr(model, key, [str(dep) for dep in value])
                        else:
                            setattr(model, key, value)
                    elif key == "estimated_duration" and hasattr(value, 'total_seconds'):
                        setattr(model, key, value.total_seconds())
                    elif key in ["start_date", "due_date"] and value is not None:
                        if isinstance(value, str):
                            setattr(model, key, datetime.fromisoformat(value))
                        else:
                            setattr(model, key, value)
                    elif key in ["status", "objective_type", "energy_requirement"] and hasattr(value, 'value'):
                        setattr(model, key, value.value)
                    else:
                        # Handle UUID conversion for other fields
                        if isinstance(value, UUID):
                            value = str(value)
                        setattr(model, key, value)
                
                # Update the updated_at timestamp
                model.updated_at = datetime.utcnow()
                
                # Session will be committed by the context manager
                
                # Convert back to Pydantic and return
                updated = self._model_to_pydantic(model)
                self.logger.info(f"✅ Updated objective or task: {updated.title} - Updated fields: {list(updates.keys())}")
                return updated
                
        except Exception as e:
            self.logger.error(f"❌ Error updating objective or task: {e}")
            raise
    
    async def delete(self, objective_id: UUID) -> bool:
        """Delete an objective or task and all its children (CASCADE)"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                model = session.query(ObjectiveModel).filter_by(id=objective_id).first()
                
                if model:
                    session.delete(model)
                    # Session will be committed by the context manager
                    
                    self.logger.info(f"✅ Deleted objective or task: {objective_id}")
                    return True
                else:
                    self.logger.warning(f"❓ Objective or task not found for deletion: {objective_id}")
                    return False
                    
        except Exception as e:
            self.logger.error(f"❌ Error deleting objective or task: {e}")
            return False
    
    async def get_by_status(self, status: ObjectiveStatus) -> List[Union[Objective, Task]]:
        """Get all objectives/tasks with a specific status"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                models = session.query(ObjectiveModel).filter_by(status=status.value).order_by(ObjectiveModel.created_at.desc()).all()
                
                objectives = []
                for model in models:
                    obj = self._model_to_pydantic(model)
                    objectives.append(obj)
                
                self.logger.debug(f"📊 Found {len(objectives)} objectives or tasks with status {status}")
                return objectives
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives or tasks by status: {e}")
            return []
    
    async def get_upcoming_tasks(self, days: int = 7) -> List[Task]:
        """Get upcoming tasks within the specified number of days"""
        try:
            end_date = datetime.utcnow() + timedelta(days=days)
            
            with sqlalchemy_db_manager.get_session() as session:
                models = session.query(ObjectiveModel).filter(
                    and_(
                        ObjectiveModel.objective_type == ObjectiveType.TASK.value,
                        ObjectiveModel.start_date <= end_date,
                        ObjectiveModel.status != ObjectiveStatus.COMPLETED.value
                    )
                ).order_by(ObjectiveModel.start_date.asc()).all()
                
                tasks = []
                for model in models:
                    task = self._model_to_pydantic(model)
                    if isinstance(task, Task):
                        tasks.append(task)
                
                self.logger.debug(f"📅 Found {len(tasks)} upcoming tasks")
                return tasks
                
        except Exception as e:
            self.logger.error(f"❌ Error getting upcoming tasks: {e}")
            return []
    
    async def search(self, query: str) -> List[Union[Objective, Task]]:
        """Search objectives and tasks by title or description"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                models = session.query(ObjectiveModel).filter(
                    or_(
                        ObjectiveModel.title.like(f"%{query}%"),
                        ObjectiveModel.description.like(f"%{query}%")
                    )
                ).order_by(ObjectiveModel.created_at.desc()).all()
                
                objectives = []
                for model in models:
                    obj = self._model_to_pydantic(model)
                    objectives.append(obj)
                
                self.logger.debug(f"🔍 Found {len(objectives)} objectives/tasks matching '{query}'")
                return objectives
                
        except Exception as e:
            self.logger.error(f"❌ Error searching objectives/tasks: {e}")
            return []
    
    async def get_stats(self) -> dict:
        """Get objective statistics"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                # Get counts by status
                status_counts = {}
                total = 0
                
                for status in ObjectiveStatus:
                    count = session.query(ObjectiveModel).filter_by(status=status.value).count()
                    status_counts[status.value] = count
                    total += count
                
                # Get counts by type
                type_counts = {}
                for obj_type in ObjectiveType:
                    count = session.query(ObjectiveModel).filter_by(objective_type=obj_type.value).count()
                    type_counts[obj_type.value] = count
                
                return {
                    'total': total,
                    'by_status': status_counts,
                    'by_type': type_counts
                }
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objective stats: {e}")
            return {'total': 0, 'by_status': {}, 'by_type': {}}
