from typing import List, Optional, Union
from uuid import UUID
from datetime import datetime, timedelta

from domain.models import Objective, Task, ObjectiveStatus, ObjectiveType
from core.database import db_manager, get_db_transaction, json_serialize, json_deserialize
from core.logging_config import get_logger

class SQLiteObjectiveRepository:
    """SQLite-based repository for managing objectives and tasks with ACID guarantees"""
    
    def __init__(self):
        self.logger = get_logger("sqlite_objective_repo")
    
    async def get_all(self) -> List[Union[Objective, Task]]:
        """Get all objectives and tasks"""
        try:
            async with db_manager.get_connection() as conn:
                cursor = await conn.execute("""
                    SELECT * FROM objectives ORDER BY created_at DESC
                """)
                
                objectives = []
                async for row in cursor:
                    obj = await self._row_to_objective(row)
                    objectives.append(obj)
                
                self.logger.debug(f"📋 Retrieved {len(objectives)} objectives and tasks")
                return objectives
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives and tasks: {e}")
            return []
    
    async def get_by_id(self, objective_id: UUID) -> Optional[Union[Objective, Task]]:
        """Get a specific objective or task by ID"""
        try:
            async with db_manager.get_connection() as conn:
                cursor = await conn.execute("""
                    SELECT * FROM objectives WHERE id = ?
                """, (str(objective_id),))
                
                row = await cursor.fetchone()
                if row:
                    obj = await self._row_to_objective(row)
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
            async with db_manager.get_connection() as conn:
                cursor = await conn.execute("""
                    SELECT * FROM objectives WHERE parent_id = ? ORDER BY created_at ASC
                """, (str(parent_id),))
                
                objectives = []
                async for row in cursor:
                    obj = await self._row_to_objective(row)
                    objectives.append(obj)
                
                self.logger.debug(f"📋 Found {len(objectives)} child objectives or tasks for parent {parent_id}")
                return objectives
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives or tasks by parent ID: {e}")
            return []
    
    async def get_root_objectives(self) -> List[Objective]:
        """Get all root objectives (no parent)"""
        try:
            async with db_manager.get_connection() as conn:
                cursor = await conn.execute("""
                    SELECT * FROM objectives WHERE parent_id IS NULL AND objective_type = ? ORDER BY created_at ASC
                """, (ObjectiveType.MAIN_OBJECTIVE.value,))
                
                objectives = []
                async for row in cursor:
                    obj = await self._row_to_objective(row)
                    objectives.append(obj)
                
                self.logger.debug(f"📋 Found {len(objectives)} root objectives")
                return objectives
                
        except Exception as e:
            self.logger.error(f"❌ Error getting root objectives: {e}")
            return []
    
    async def create(self, objective: Union[Objective, Task]) -> Union[Objective, Task]:
        """Create a new objective or task"""
        try:
            async with get_db_transaction() as conn:
                # Validate parent exists if parent_id is provided
                if objective.parent_id:
                    parent = await self.get_by_id(objective.parent_id)
                    if not parent:
                        error_msg = f"Parent objective with ID {objective.parent_id} not found"
                        self.logger.error(f"❌ {error_msg}")
                        raise ValueError(error_msg)
                    objective.degree = parent.degree + 1
                else:
                    objective.degree = 0
                
                objective.created_at = datetime.utcnow()
                objective.updated_at = datetime.utcnow()
                
                # Insert the objective
                await conn.execute("""
                    INSERT INTO objectives (
                        id, title, description, parent_id, degree, objective_type, created_at, updated_at,
                        start_date, due_date, all_day, priority_score, complexity_score, energy_requirement,
                        status, completion_percentage, context_tags, dependencies, success_criteria,
                        points_awarded_for_completion, completion_timeliness_score, recurring,
                        location, estimated_duration, actual_duration, actionable_steps
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    str(objective.id), objective.title, objective.description,
                    str(objective.parent_id) if objective.parent_id else None,
                    objective.degree, objective.objective_type.value, objective.created_at.isoformat(),
                    objective.updated_at.isoformat(),
                    objective.start_date.isoformat() if objective.start_date else None,
                    objective.due_date.isoformat() if objective.due_date else None,
                    objective.all_day, objective.priority_score, objective.complexity_score,
                    objective.energy_requirement.value, objective.status.value,
                    objective.completion_percentage, json_serialize(objective.context_tags),
                    json_serialize(objective.dependencies), json_serialize(objective.success_criteria),
                    objective.points_awarded_for_completion, objective.completion_timeliness_score,
                    json_serialize(objective.recurring.model_dump() if objective.recurring else None),
                    getattr(objective, 'location', None),
                    getattr(objective, 'estimated_duration', None).total_seconds() if getattr(objective, 'estimated_duration', None) else None,
                    getattr(objective, 'actual_duration', None).total_seconds() if getattr(objective, 'actual_duration', None) else None,
                    json_serialize(getattr(objective, 'actionable_steps', []))
                ))
                
                self.logger.info(f"✅ Created objective or task: {objective.title} (ID: {objective.id})")
                return objective
                
        except Exception as e:
            self.logger.error(f"❌ Error creating objective or task: {e}")
            raise
    
    async def update(self, objective_id: UUID, updates: dict) -> Optional[Union[Objective, Task]]:
        """Update an existing objective or task"""
        try:
            async with get_db_transaction() as conn:
                # Validate parent_id if it's being updated
                if "parent_id" in updates and updates["parent_id"] is not None:
                    parent = await self.get_by_id(updates["parent_id"])
                    if not parent:
                        error_msg = f"Parent objective with ID {updates['parent_id']} not found"
                        self.logger.error(f"❌ {error_msg}")
                        raise ValueError(error_msg)
                    updates["degree"] = parent.degree + 1
                elif "parent_id" in updates and updates["parent_id"] is None:
                    updates["degree"] = 0
                
                # Build the update query dynamically
                update_fields = []
                update_values = []
                
                # Handle special fields
                for key, value in updates.items():
                    if key == "recurring" and value is not None:
                        if hasattr(value, 'model_dump'):
                            update_fields.append(f"{key} = ?")
                            update_values.append(json_serialize(value.model_dump()))
                        else:
                            update_fields.append(f"{key} = ?")
                            update_values.append(json_serialize(value))
                    elif key in ["context_tags", "dependencies", "success_criteria", "actionable_steps"]:
                        update_fields.append(f"{key} = ?")
                        update_values.append(json_serialize(value))
                    elif key == "estimated_duration" and hasattr(value, 'total_seconds'):
                        update_fields.append(f"{key} = ?")
                        update_values.append(value.total_seconds())
                    elif key in ["start_date", "due_date"] and value is not None:
                        update_fields.append(f"{key} = ?")
                        update_values.append(value.isoformat() if isinstance(value, datetime) else value)
                    elif key in ["status", "objective_type", "energy_requirement"] and hasattr(value, 'value'):
                        update_fields.append(f"{key} = ?")
                        update_values.append(value.value)
                    else:
                        # Handle UUID conversion for other fields
                        if isinstance(value, UUID):
                            value = str(value)
                        update_fields.append(f"{key} = ?")
                        update_values.append(value)
                
                # Add updated_at
                update_fields.append("updated_at = ?")
                update_values.append(datetime.utcnow().isoformat())
                
                # Add the ID for the WHERE clause
                update_values.append(str(objective_id))
                
                # Execute the update
                await conn.execute(f"""
                    UPDATE objectives SET {', '.join(update_fields)} WHERE id = ?
                """, update_values)
                
                # Get the updated objective
                updated = await self.get_by_id(objective_id)
                if updated:
                    self.logger.info(f"✅ Updated objective or task: {updated.title} - Updated fields: {list(updates.keys())}")
                    return updated
                else:
                    raise ValueError(f"Objective or task with ID {objective_id} not found")
                
        except Exception as e:
            self.logger.error(f"❌ Error updating objective or task: {e}")
            raise
    
    async def delete(self, objective_id: UUID) -> bool:
        """Delete an objective or task and all its children (CASCADE)"""
        try:
            async with get_db_transaction() as conn:
                # SQLite with foreign keys enabled will handle CASCADE DELETE
                cursor = await conn.execute("""
                    DELETE FROM objectives WHERE id = ?
                """, (str(objective_id),))
                
                if cursor.rowcount > 0:
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
            async with db_manager.get_connection() as conn:
                cursor = await conn.execute("""
                    SELECT * FROM objectives WHERE status = ? ORDER BY created_at DESC
                """, (status.value,))
                
                objectives = []
                async for row in cursor:
                    obj = await self._row_to_objective(row)
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
            
            async with db_manager.get_connection() as conn:
                cursor = await conn.execute("""
                    SELECT * FROM objectives 
                    WHERE objective_type = ? AND start_date <= ? AND status != ?
                    ORDER BY start_date ASC
                """, (ObjectiveType.TASK.value, end_date.isoformat(), ObjectiveStatus.COMPLETED.value))
                
                tasks = []
                async for row in cursor:
                    task = await self._row_to_objective(row)
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
            async with db_manager.get_connection() as conn:
                cursor = await conn.execute("""
                    SELECT * FROM objectives 
                    WHERE title LIKE ? OR description LIKE ?
                    ORDER BY created_at DESC
                """, (f"%{query}%", f"%{query}%"))
                
                objectives = []
                async for row in cursor:
                    obj = await self._row_to_objective(row)
                    objectives.append(obj)
                
                self.logger.debug(f"🔍 Found {len(objectives)} objectives/tasks matching '{query}'")
                return objectives
                
        except Exception as e:
            self.logger.error(f"❌ Error searching objectives/tasks: {e}")
            return []
    
    async def _row_to_objective(self, row) -> Union[Objective, Task]:
        """Convert a database row to an Objective or Task object"""
        # Convert row to dict using row keys
        data = {
            'id': row['id'],
            'title': row['title'],
            'description': row['description'],
            'parent_id': row['parent_id'],
            'degree': row['degree'],
            'objective_type': row['objective_type'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
            'start_date': row['start_date'],
            'due_date': row['due_date'],
            'all_day': row['all_day'],
            'priority_score': row['priority_score'],
            'complexity_score': row['complexity_score'],
            'energy_requirement': row['energy_requirement'],
            'status': row['status'],
            'completion_percentage': row['completion_percentage'],
            'context_tags': row['context_tags'],
            'dependencies': row['dependencies'],
            'success_criteria': row['success_criteria'],
            'points_awarded_for_completion': row['points_awarded_for_completion'],
            'completion_timeliness_score': row['completion_timeliness_score'],
            'recurring': row['recurring'],
            'location': row['location'],
            'estimated_duration': row['estimated_duration'],
            'actual_duration': row['actual_duration'],
            'actionable_steps': row['actionable_steps']
        }
        
        # Parse JSON fields
        data['context_tags'] = json_deserialize(data['context_tags']) or []
        data['dependencies'] = json_deserialize(data['dependencies']) or []
        data['success_criteria'] = json_deserialize(data['success_criteria']) or []
        data['actionable_steps'] = json_deserialize(data['actionable_steps']) or []
        
        # Parse recurring field
        recurring_data = json_deserialize(data['recurring'])
        if recurring_data:
            from domain.models import RecurringInfo
            data['recurring'] = RecurringInfo(**recurring_data)
        else:
            data['recurring'] = None
        
        # Convert string IDs to UUID
        data['id'] = UUID(data['id'])
        if data['parent_id']:
            data['parent_id'] = UUID(data['parent_id'])
        
        # Convert datetime strings
        for field in ['created_at', 'updated_at', 'start_date', 'due_date']:
            if data.get(field):
                data[field] = datetime.fromisoformat(data[field])
        
        # Convert enum fields
        data['objective_type'] = ObjectiveType(data['objective_type'])
        data['status'] = ObjectiveStatus(data['status'])
        
        # Convert energy requirement
        from domain.models import EnergyLevel
        data['energy_requirement'] = EnergyLevel(data['energy_requirement'])
        
        # Convert estimated_duration and actual_duration to timedelta if present
        if data.get('estimated_duration'):
            data['estimated_duration'] = timedelta(seconds=data['estimated_duration'])
        if data.get('actual_duration'):
            data['actual_duration'] = timedelta(seconds=data['actual_duration'])
        
        # Create the appropriate object type
        if data['objective_type'] == ObjectiveType.TASK:
            return Task(**data)
        else:
            # Remove task-specific fields for Objective
            task_fields = ['location', 'estimated_duration', 'actual_duration', 'actionable_steps']
            for field in task_fields:
                data.pop(field, None)
            return Objective(**data)
    
    async def get_stats(self) -> dict:
        """Get objective statistics"""
        try:
            async with db_manager.get_connection() as conn:
                # Get counts by status
                cursor = await conn.execute("""
                    SELECT status, COUNT(*) as count FROM objectives GROUP BY status
                """)
                
                stats = {'total': 0, 'by_status': {}}
                async for row in cursor:
                    stats['by_status'][row['status']] = row['count']
                    stats['total'] += row['count']
                
                # Get counts by type
                cursor = await conn.execute("""
                    SELECT objective_type, COUNT(*) as count FROM objectives GROUP BY objective_type
                """)
                
                stats['by_type'] = {}
                async for row in cursor:
                    stats['by_type'][row['objective_type']] = row['count']
                
                return stats
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objective stats: {e}")
            return {'total': 0, 'by_status': {}, 'by_type': {}} 