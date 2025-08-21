"""
Simplified Objective Repository using SQLModel

This repository replaces the complex SQLAlchemy repository with manual conversions
with a much simpler SQLModel-based approach that eliminates conversion boilerplate.
"""

from typing import Optional, List, Union
from uuid import UUID
from datetime import datetime, timedelta
from sqlmodel import Session, select, or_, and_
from sqlalchemy.orm import selectinload

from core.models import Objective, ObjectiveType, ObjectiveStatus
from core.sqlalchemy_database import sqlalchemy_db_manager
from core.logging_config import get_logger

logger = get_logger("objective_repository")

class ObjectiveRepository:
    """Simplified repository for managing objectives using SQLModel"""
    
    def __init__(self):
        self.logger = get_logger("objective_repo")
    
    def get_by_id(self, objective_id: UUID) -> Optional[Objective]:
        """Get objective by ID with all relationships loaded"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = (
                    select(Objective)
                    .options(
                        selectinload(Objective.children),
                        selectinload(Objective.parent)
                    )
                    .where(Objective.id == objective_id)
                )
                result = session.exec(statement).first()
                
                if result:
                    self.logger.debug(f"✅ Found objective: {objective_id}")
                else:
                    self.logger.debug(f"❌ Objective not found: {objective_id}")
                
                return result
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objective {objective_id}: {e}")
            raise

    def get_by_id_and_user(self, objective_id: UUID, user_id: UUID) -> Optional[Objective]:
        """Get objective by ID scoped to a specific user"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = (
                    select(Objective)
                    .options(
                        selectinload(Objective.children),
                        selectinload(Objective.parent)
                    )
                    .where(and_(Objective.id == objective_id, Objective.user_id == user_id))
                )
                return session.exec(statement).first()
        except Exception as e:
            self.logger.error(f"❌ Error getting objective {objective_id} for user {user_id}: {e}")
            raise
    
    def get_all(self, user_id: Optional[UUID] = None) -> List[Objective]:
        """Get all objectives for a specific user (or all if no user_id provided for backward compatibility)"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = (
                    select(Objective)
                    .options(
                        selectinload(Objective.children),
                        selectinload(Objective.parent),
                        selectinload(Objective.user)
                    )
                    .order_by(Objective.created_at.desc())
                )
                
                # Filter by user if provided
                if user_id:
                    statement = statement.where(Objective.user_id == user_id)
                
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} objectives for user {user_id or 'all'}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives for user {user_id}: {e}")
            raise

    def get_by_user_id(self, user_id: UUID) -> List[Objective]:
        """Get all objectives for a specific user"""
        return self.get_all(user_id)

    def get_by_status_and_user(self, status: str, user_id: UUID) -> List[Objective]:
        """Get objectives by status for a specific user"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = (
                    select(Objective)
                    .options(
                        selectinload(Objective.children),
                        selectinload(Objective.parent)
                    )
                    .where(and_(Objective.status == status, Objective.user_id == user_id))
                    .order_by(Objective.created_at.desc())
                )
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} objectives with status {status} for user {user_id}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives by status {status} for user {user_id}: {e}")
            raise

    def get_by_parent_id_and_user(self, parent_id: Optional[UUID], user_id: UUID) -> List[Objective]:
        """Get objectives by parent ID for a specific user"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                if parent_id is None:
                    statement = (
                        select(Objective)
                        .options(
                            selectinload(Objective.children),
                            selectinload(Objective.parent)
                        )
                        .where(and_(Objective.parent_id.is_(None), Objective.user_id == user_id))
                        .order_by(Objective.created_at.desc())
                    )
                else:
                    statement = (
                        select(Objective)
                        .options(
                            selectinload(Objective.children),
                            selectinload(Objective.parent)
                        )
                        .where(and_(Objective.parent_id == parent_id, Objective.user_id == user_id))
                        .order_by(Objective.created_at.desc())
                    )
                
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} objectives with parent_id {parent_id} for user {user_id}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives by parent_id {parent_id} for user {user_id}: {e}")
            raise

    def get_due_soon_for_user(self, hours_ahead: int = 24, user_id: UUID = None) -> List[Objective]:
        """Get objectives due within the specified hours for a specific user"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                cutoff_time = datetime.utcnow() + timedelta(hours=hours_ahead)
                
                statement = (
                    select(Objective)
                    .options(
                        selectinload(Objective.children),
                        selectinload(Objective.parent)
                    )
                    .where(
                        and_(
                            Objective.due_date.is_not(None),
                            Objective.due_date <= cutoff_time,
                            Objective.status.in_(["not_started", "in_progress"]),
                            Objective.user_id == user_id,
                            # Exclude untimed objectives from due soon queries
                            Objective.is_timed == True
                        )
                    )
                    .order_by(Objective.due_date.asc())
                )
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} objectives due within {hours_ahead} hours for user {user_id}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives due soon for user {user_id}: {e}")
            raise

    def search_for_user(self, query: str, user_id: UUID) -> List[Objective]:
        """Search objectives by title and description for a specific user"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                search_term = f"%{query}%"
                statement = (
                    select(Objective)
                    .options(
                        selectinload(Objective.children),
                        selectinload(Objective.parent)
                    )
                    .where(
                        and_(
                            or_(
                                Objective.title.ilike(search_term),
                                Objective.description.ilike(search_term)
                            ),
                            Objective.user_id == user_id
                        )
                    )
                    .order_by(Objective.created_at.desc())
                )
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Found {len(results)} objectives matching '{query}' for user {user_id}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error searching objectives with query '{query}' for user {user_id}: {e}")
            raise

    def get_statistics_for_user(self, user_id: UUID) -> dict:
        """Get objective statistics for a specific user"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                # Total count for user
                total_statement = select(Objective).where(Objective.user_id == user_id)
                total_count = len(session.exec(total_statement).all())
                
                # Count by status for user
                status_values = ["not_started", "in_progress", "blocked", "completed", "cancelled"]
                status_counts = {}
                for status in status_values:
                    status_statement = select(Objective).where(
                        and_(Objective.status == status, Objective.user_id == user_id)
                    )
                    status_counts[status] = len(session.exec(status_statement).all())
                
                # Count by type for user
                type_values = ["main_objective", "sub_objective", "task", "habit"]
                type_counts = {}
                for obj_type in type_values:
                    type_statement = select(Objective).where(
                        and_(Objective.objective_type == obj_type, Objective.user_id == user_id)
                    )
                    type_counts[obj_type] = len(session.exec(type_statement).all())
                
                # Completion rate
                completed_count = status_counts.get("completed", 0)
                completion_rate = (completed_count / total_count * 100) if total_count > 0 else 0
                
                stats = {
                    "total": total_count,
                    "by_status": status_counts,
                    "by_type": type_counts,
                    "completion_rate": round(completion_rate, 2),
                    "active_count": status_counts.get("in_progress", 0),
                    "blocked_count": status_counts.get("blocked", 0),
                    "user_id": str(user_id)
                }
                
                self.logger.debug(f"✅ Generated objective statistics for user {user_id}")
                return stats
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objective statistics for user {user_id}: {e}")
            raise
    
    def get_by_type(self, objective_type: str) -> List[Objective]:
        """Get objectives by type"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = (
                    select(Objective)
                    .options(
                        selectinload(Objective.children),
                        selectinload(Objective.parent)
                    )
                    .where(Objective.objective_type == objective_type)
                    .order_by(Objective.created_at.desc())
                )
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} objectives of type {objective_type}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives by type {objective_type}: {e}")
            raise
    
    def get_by_status(self, status: str) -> List[Objective]:
        """Get objectives by status"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = (
                    select(Objective)
                    .options(
                        selectinload(Objective.children),
                        selectinload(Objective.parent)
                    )
                    .where(Objective.status == status)
                    .order_by(Objective.created_at.desc())
                )
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} objectives with status {status}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives by status {status}: {e}")
            raise
    
    def get_by_parent_id(self, parent_id: Optional[UUID]) -> List[Objective]:
        """Get objectives by parent ID (None for root objectives)"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                if parent_id is None:
                    statement = (
                        select(Objective)
                        .options(
                            selectinload(Objective.children),
                            selectinload(Objective.parent)
                        )
                        .where(Objective.parent_id.is_(None))
                        .order_by(Objective.created_at.desc())
                    )
                else:
                    statement = (
                        select(Objective)
                        .options(
                            selectinload(Objective.children),
                            selectinload(Objective.parent)
                        )
                        .where(Objective.parent_id == parent_id)
                        .order_by(Objective.created_at.desc())
                    )
                
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} objectives with parent_id {parent_id}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives by parent_id {parent_id}: {e}")
            raise
    
    def get_due_soon(self, hours_ahead: int = 24) -> List[Objective]:
        """Get objectives due within the specified hours"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                cutoff_time = datetime.utcnow() + timedelta(hours=hours_ahead)
                
                statement = (
                    select(Objective)
                    .options(
                        selectinload(Objective.children),
                        selectinload(Objective.parent)
                    )
                    .where(
                        and_(
                            Objective.due_date.is_not(None),
                            Objective.due_date <= cutoff_time,
                            Objective.status.in_(["not_started", "in_progress"])
                        )
                    )
                    .order_by(Objective.due_date.asc())
                )
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} objectives due within {hours_ahead} hours")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objectives due soon: {e}")
            raise
    
    def search(self, query: str) -> List[Objective]:
        """Search objectives by title and description"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                search_term = f"%{query}%"
                statement = (
                    select(Objective)
                    .options(
                        selectinload(Objective.children),
                        selectinload(Objective.parent)
                    )
                    .where(
                        or_(
                            Objective.title.ilike(search_term),
                            Objective.description.ilike(search_term)
                        )
                    )
                    .order_by(Objective.created_at.desc())
                )
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Found {len(results)} objectives matching '{query}'")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error searching objectives with query '{query}': {e}")
            raise
    
    def create(self, objective: Objective) -> Objective:
        """Create a new objective"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                objective.created_at = datetime.utcnow()
                objective.updated_at = datetime.utcnow()
                
                session.add(objective)
                session.flush()  # Flush to get the ID
                session.refresh(objective)  # Refresh to get relationships
                
                # Expunge from session to make it detached but accessible
                session.expunge(objective)
                
                self.logger.info(f"✅ Created objective: {objective.id} - {objective.title}")
                return objective
                
        except Exception as e:
            self.logger.error(f"❌ Error creating objective: {e}")
            raise
    
    def update(self, objective: Objective) -> Objective:
        """Update an existing objective"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                objective.updated_at = datetime.utcnow()
                
                # Merge the updated objective
                updated_objective = session.merge(objective)
                session.flush()
                session.refresh(updated_objective)
                session.expunge(updated_objective)
                
                self.logger.info(f"✅ Updated objective: {objective.id} - {objective.title}")
                return updated_objective
                
        except Exception as e:
            self.logger.error(f"❌ Error updating objective {objective.id}: {e}")
            raise
    
    def delete(self, objective_id: UUID) -> bool:
        """Delete an objective and all its children"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                statement = select(Objective).where(Objective.id == objective_id)
                objective = session.exec(statement).first()
                
                if objective:
                    session.delete(objective)  # Cascade will handle children
                    self.logger.info(f"✅ Deleted objective: {objective_id}")
                    return True
                else:
                    self.logger.warning(f"⚠️ Objective not found for deletion: {objective_id}")
                    return False
                    
        except Exception as e:
            self.logger.error(f"❌ Error deleting objective {objective_id}: {e}")
            raise
    
    def mark_completed(self, objective_id: UUID) -> Optional[Objective]:
        """Mark an objective as completed"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                statement = select(Objective).where(Objective.id == objective_id)
                objective = session.exec(statement).first()
                
                if objective:
                    objective.status = "completed"
                    objective.completion_percentage = 100.0
                    objective.updated_at = datetime.utcnow()
                    
                    session.add(objective)
                    session.flush()
                    session.refresh(objective)
                    
                    self.logger.info(f"✅ Marked objective as completed: {objective_id}")
                    return objective
                else:
                    self.logger.warning(f"⚠️ Objective not found: {objective_id}")
                    return None
                    
        except Exception as e:
            self.logger.error(f"❌ Error marking objective as completed {objective_id}: {e}")
            raise
    
    def get_hierarchy(self, root_id: Optional[UUID] = None) -> List[Objective]:
        """Get objective hierarchy starting from root_id (or all roots if None)"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                if root_id is None:
                    # Get all root objectives
                    statement = (
                        select(Objective)
                        .options(
                            selectinload(Objective.children),
                            selectinload(Objective.parent)
                        )
                        .where(Objective.parent_id.is_(None))
                        .order_by(Objective.created_at.desc())
                    )
                else:
                    # Get specific root and its hierarchy
                    statement = (
                        select(Objective)
                        .options(
                            selectinload(Objective.children),
                            selectinload(Objective.parent)
                        )
                        .where(Objective.id == root_id)
                    )
                
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved hierarchy with {len(results)} root objectives")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objective hierarchy: {e}")
            raise
    
    def get_statistics(self) -> dict:
        """Get objective statistics"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                # Total count
                total_statement = select(Objective)
                total_count = len(session.exec(total_statement).all())
                
                # Count by status
                status_values = ["not_started", "in_progress", "blocked", "completed", "cancelled"]
                status_counts = {}
                for status in status_values:
                    status_statement = select(Objective).where(Objective.status == status)
                    status_counts[status] = len(session.exec(status_statement).all())
                
                # Count by type
                type_values = ["main_objective", "sub_objective", "task", "habit"]
                type_counts = {}
                for obj_type in type_values:
                    type_statement = select(Objective).where(Objective.objective_type == obj_type)
                    type_counts[obj_type] = len(session.exec(type_statement).all())
                
                # Completion rate
                completed_count = status_counts.get("completed", 0)
                completion_rate = (completed_count / total_count * 100) if total_count > 0 else 0
                
                stats = {
                    "total": total_count,
                    "by_status": status_counts,
                    "by_type": type_counts,
                    "completion_rate": round(completion_rate, 2),
                    "active_count": status_counts.get("in_progress", 0),
                    "blocked_count": status_counts.get("blocked", 0)
                }
                
                self.logger.debug(f"✅ Generated objective statistics")
                return stats
                
        except Exception as e:
            self.logger.error(f"❌ Error getting objective statistics: {e}")
            raise
