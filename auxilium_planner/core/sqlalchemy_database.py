"""
SQLAlchemy database configuration and session management

This module provides SQLAlchemy setup, session management, and database
initialization for the auxilium_planner application.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from contextlib import contextmanager, asynccontextmanager
from pathlib import Path
from typing import Generator
import logging

from core.config import settings
from core.logging_config import get_logger
from core.sqlalchemy_models import Base

logger = get_logger("sqlalchemy_database")

# Database path - use same location as existing SQLite database
DATABASE_PATH = Path(settings.data_file_path).parent / "auxilium_planner_sqlalchemy.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

class SQLAlchemyDatabaseManager:
    """SQLAlchemy database manager with session handling"""
    
    def __init__(self, database_url: str = DATABASE_URL):
        self.database_url = database_url
        self.engine = None
        self.SessionLocal = None
        
    def initialize(self):
        """Initialize SQLAlchemy engine and session factory"""
        logger.info(f"🗄️ Initializing SQLAlchemy database at {self.database_url}")
        
        # Ensure directory exists
        DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        # Create engine with SQLite-specific configuration
        self.engine = create_engine(
            self.database_url,
            echo=False,  # Set to True for SQL debugging
            poolclass=StaticPool,
            connect_args={
                "check_same_thread": False,
                "timeout": 30
            }
        )
        
        # Enable foreign key constraints for SQLite
        @event.listens_for(self.engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.close()
        
        # Create session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        
        # Create all tables
        self.create_tables()
        
        logger.info("✅ SQLAlchemy database initialized successfully")
    
    def create_tables(self):
        """Create all database tables"""
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("✅ SQLAlchemy tables created successfully")
        except Exception as e:
            logger.error(f"❌ Error creating SQLAlchemy tables: {e}")
            raise
    
    def drop_tables(self):
        """Drop all database tables (use with caution!)"""
        try:
            Base.metadata.drop_all(bind=self.engine)
            logger.warning("⚠️ All SQLAlchemy tables dropped")
        except Exception as e:
            logger.error(f"❌ Error dropping SQLAlchemy tables: {e}")
            raise
    
    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """Get a database session with automatic cleanup"""
        if not self.SessionLocal:
            raise RuntimeError("Database not initialized. Call initialize() first.")
        
        session = self.SessionLocal()
        try:
            yield session
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    @contextmanager
    def get_transaction(self) -> Generator[Session, None, None]:
        """Get a database session with automatic transaction management"""
        if not self.SessionLocal:
            raise RuntimeError("Database not initialized. Call initialize() first.")
        
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    def close(self):
        """Close the database engine"""
        if self.engine:
            self.engine.dispose()
            logger.info("🔒 SQLAlchemy database engine closed")

# Global database manager instance
sqlalchemy_db_manager = SQLAlchemyDatabaseManager()

# Convenience functions
def get_db_session() -> Generator[Session, None, None]:
    """Get a database session (convenience function)"""
    with sqlalchemy_db_manager.get_session() as session:
        yield session

def get_db_transaction() -> Generator[Session, None, None]:
    """Get a database transaction (convenience function)"""
    with sqlalchemy_db_manager.get_transaction() as session:
        yield session

def initialize_sqlalchemy_database():
    """Initialize the SQLAlchemy database - call this on startup"""
    sqlalchemy_db_manager.initialize()

def close_sqlalchemy_database():
    """Close the SQLAlchemy database - call this on shutdown"""
    sqlalchemy_db_manager.close()
