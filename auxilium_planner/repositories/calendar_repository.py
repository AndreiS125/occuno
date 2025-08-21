from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select, and_
from datetime import datetime

from core.models import Calendar
from core.sqlalchemy_database import sqlalchemy_db_manager
from core.logging_config import get_logger

class CalendarRepository:
    """Repository for calendar operations"""
    
    def __init__(self):
        self.logger = get_logger("calendar_repo")
    
    def create(self, calendar: Calendar) -> Calendar:
        """Create a new calendar"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                calendar.created_at = datetime.utcnow()
                calendar.updated_at = datetime.utcnow()
                
                session.add(calendar)
                session.flush()
                session.refresh(calendar)
                session.expunge(calendar)
                
                self.logger.info(f"✅ Created calendar: {calendar.id} - {calendar.name}")
                return calendar
                
        except Exception as e:
            self.logger.error(f"❌ Error creating calendar: {e}")
            raise
    
    def get_by_id(self, calendar_id: UUID) -> Optional[Calendar]:
        """Get calendar by ID"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = select(Calendar).where(Calendar.id == calendar_id)
                result = session.exec(statement).first()
                
                if result:
                    self.logger.debug(f"✅ Found calendar: {calendar_id}")
                else:
                    self.logger.debug(f"❌ Calendar not found: {calendar_id}")
                
                return result
                
        except Exception as e:
            self.logger.error(f"❌ Error getting calendar {calendar_id}: {e}")
            raise
    
    def get_by_user_id(self, user_id: UUID) -> List[Calendar]:
        """Get all calendars for a user"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = select(Calendar).where(Calendar.user_id == user_id).order_by(Calendar.name)
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} calendars for user {user_id}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting calendars for user {user_id}: {e}")
            raise
    
    def get_default_calendar(self, user_id: UUID) -> Optional[Calendar]:
        """Get the default calendar for a user"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = select(Calendar).where(
                    and_(Calendar.user_id == user_id, Calendar.is_default == True)
                )
                result = session.exec(statement).first()
                
                self.logger.debug(f"✅ Found default calendar for user {user_id}: {result.id if result else 'None'}")
                return result
                
        except Exception as e:
            self.logger.error(f"❌ Error getting default calendar for user {user_id}: {e}")
            raise
    
    def get_visible_calendars(self, user_id: UUID) -> List[Calendar]:
        """Get all visible calendars for a user"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                statement = select(Calendar).where(
                    and_(Calendar.user_id == user_id, Calendar.is_visible == True)
                ).order_by(Calendar.name)
                results = session.exec(statement).all()
                
                self.logger.debug(f"✅ Retrieved {len(results)} visible calendars for user {user_id}")
                return list(results)
                
        except Exception as e:
            self.logger.error(f"❌ Error getting visible calendars for user {user_id}: {e}")
            raise
    
    def toggle_visibility(self, calendar_id: UUID) -> Optional[Calendar]:
        """Toggle calendar visibility"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                statement = select(Calendar).where(Calendar.id == calendar_id)
                calendar = session.exec(statement).first()
                
                if calendar:
                    calendar.is_visible = not calendar.is_visible
                    calendar.updated_at = datetime.utcnow()
                    
                    session.add(calendar)
                    session.flush()
                    session.refresh(calendar)
                    session.expunge(calendar)
                    
                    self.logger.info(f"✅ Toggled visibility for calendar: {calendar_id} - {calendar.is_visible}")
                    return calendar
                else:
                    self.logger.warning(f"⚠️ Calendar not found for visibility toggle: {calendar_id}")
                    return None
                    
        except Exception as e:
            self.logger.error(f"❌ Error toggling visibility for calendar {calendar_id}: {e}")
            raise
    
    def update(self, calendar: Calendar) -> Optional[Calendar]:
        """Update an existing calendar"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                calendar.updated_at = datetime.utcnow()
                
                updated_calendar = session.merge(calendar)
                session.flush()
                session.refresh(updated_calendar)
                session.expunge(updated_calendar)
                
                self.logger.info(f"✅ Updated calendar: {calendar.id} - {calendar.name}")
                return updated_calendar
                
        except Exception as e:
            self.logger.error(f"❌ Error updating calendar {calendar.id}: {e}")
            raise
    
    def delete(self, calendar_id: UUID) -> bool:
        """Delete a calendar"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                statement = select(Calendar).where(Calendar.id == calendar_id)
                calendar = session.exec(statement).first()
                
                if calendar:
                    session.delete(calendar)
                    self.logger.info(f"✅ Deleted calendar: {calendar_id}")
                    return True
                else:
                    self.logger.warning(f"⚠️ Calendar not found for deletion: {calendar_id}")
                    return False
                    
        except Exception as e:
            self.logger.error(f"❌ Error deleting calendar {calendar_id}: {e}")
            raise
    
    def set_default_calendar(self, user_id: UUID, calendar_id: UUID) -> bool:
        """Set a calendar as the default for a user"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                statement = select(Calendar).where(Calendar.user_id == user_id)
                user_calendars = list(session.exec(statement).all())
                
                for calendar in user_calendars:
                    calendar.is_default = (calendar.id == calendar_id)
                    calendar.updated_at = datetime.utcnow()
                    session.add(calendar)
                
                self.logger.info(f"✅ Set default calendar {calendar_id} for user {user_id}")
                return True
                
        except Exception as e:
            self.logger.error(f"❌ Error setting default calendar for user {user_id}: {e}")
            raise
    
    def ensure_default_calendar(self, user_id: UUID) -> Calendar:
        """Ensure user has a default calendar, create one if not"""
        default_calendar = self.get_default_calendar(user_id)
        
        if not default_calendar:
            # Create default calendar
            default_calendar = Calendar(
                user_id=user_id,
                name="My Calendar",
                description="Default calendar",
                color="#3b82f6",
                is_default=True,
                is_visible=True
            )
            default_calendar = self.create(default_calendar)
        
        return default_calendar
