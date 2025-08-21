"""
SQLAlchemy database configuration and session management

This module provides SQLAlchemy setup, session management, and database
initialization for the auxilium_planner application.
"""

from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy import event
from sqlalchemy.pool import NullPool
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from .config import settings
from .logging_config import get_logger
from .models import UserProfile, Objective, UserAchievement, EarnedCoupon, create_indexes

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
        # Use NullPool to avoid sharing a single connection across threads (StaticPool),
        # which can cause intermittent issues under concurrency with SQLite.
        self.engine = create_engine(
            self.database_url,
            echo=False,  # Set to True for SQL debugging
            poolclass=NullPool,
            pool_pre_ping=True,
            connect_args={
                "check_same_thread": False,
                "timeout": 30,
            },
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
        
        # Create session factory (SQLModel uses Session directly)
        self.SessionLocal = lambda: Session(self.engine)
        
        # Create all tables
        self.create_tables()
        
        # Apply safe, non-destructive schema upgrades for existing databases
        self.apply_non_destructive_schema_upgrades()
        
        logger.info("✅ SQLAlchemy database initialized successfully")
    
    def create_tables(self):
        """Create all database tables"""
        try:
            # Use SQLModel metadata
            SQLModel.metadata.create_all(bind=self.engine)
            
            # Create indexes
            indexes = create_indexes()
            for index in indexes:
                try:
                    index.create(bind=self.engine, checkfirst=True)
                except Exception as idx_error:
                    logger.warning(f"⚠️ Could not create index {index.name}: {idx_error}")
            
            logger.info("✅ SQLModel tables and indexes created successfully")
        except Exception as e:
            logger.error(f"❌ Error creating SQLModel tables: {e}")
            raise
    
    def apply_non_destructive_schema_upgrades(self):
        """Apply simple ALTER TABLE ADD COLUMN statements for missing columns.
        This is a lightweight alternative to Alembic for SQLite and only ever adds
        new nullable columns. It is safe to run multiple times.
        """
        if not self.engine:
            raise RuntimeError("Engine not initialized")

        try:
            with self.engine.connect() as conn:
                # Helper to fetch existing columns for a table
                def get_columns(table: str) -> set:
                    rows = conn.exec_driver_sql(f"PRAGMA table_info('{table}')").fetchall()
                    columns = set()
                    for row in rows:
                        try:
                            # Prefer mapping access (more robust across drivers)
                            if hasattr(row, "_mapping") and "name" in row._mapping:
                                columns.add(row._mapping["name"])  # expected key from PRAGMA
                            else:
                                # Fallback to positional index; PRAGMA returns (cid, name, type, notnull, dflt_value, pk)
                                columns.add(row[1])
                        except Exception as ie:
                            logger.warning(f"⚠️ Unexpected PRAGMA row format for table '{table}': {row} ({ie})")
                    return columns

                # Columns we expect on user_profile (only new, nullable fields here)
                user_profile_expected = {
                    # JSON columns
                    "preferred_work_hours": "JSON",
                    "custom_reward_config": "JSON",
                    # Boolean stored as INTEGER in SQLite
                    "use_custom_rewards": "INTEGER DEFAULT 0",
                    "limited_time_achievements_available": "JSON",
                    "completion_patterns": "JSON",
                    # Newly added gamification/progress columns
                    "daily_tasks_completed_today": "INTEGER DEFAULT 0",
                    "daily_task_goal": "INTEGER DEFAULT 5",
                    "rank_this_week": "INTEGER DEFAULT 1",
                    "rank_last_week": "INTEGER DEFAULT 1",
                    "seasonal_rank": "INTEGER DEFAULT 1",
                    "daily_bonus_available": "INTEGER DEFAULT 1",
                    "consecutive_daily_bonuses": "INTEGER DEFAULT 0",
                    "comeback_bonus_available": "INTEGER DEFAULT 0",
                    "days_since_last_activity": "INTEGER DEFAULT 0",
                    "progress_decay_warning": "INTEGER DEFAULT 0",
                }

                # Apply for user_profile
                existing_up = get_columns("user_profile") if conn.dialect.name == "sqlite" else set()
                for col, coltype in user_profile_expected.items():
                    if col not in existing_up:
                        try:
                            conn.exec_driver_sql(
                                f"ALTER TABLE user_profile ADD COLUMN {col} {coltype}"
                            )
                            logger.info(f"🛠️ Added missing column 'user_profile.{col}' ({coltype})")
                        except Exception as e:
                            logger.warning(f"⚠️ Could not add column user_profile.{col}: {e}")

                # Columns we expect on objectives (new JSON fields)
                objectives_expected = {
                    "context_tags": "JSON",
                    "dependencies": "JSON",
                    "success_criteria": "JSON",
                    "recurring": "JSON",
                    "actionable_steps": "JSON",
                    # Boolean stored as INTEGER in SQLite; default to 1 (True)
                    "is_timed": "INTEGER DEFAULT 1",
                }

                existing_obj = get_columns("objectives") if conn.dialect.name == "sqlite" else set()
                for col, coltype in objectives_expected.items():
                    if col not in existing_obj:
                        try:
                            conn.exec_driver_sql(
                                f"ALTER TABLE objectives ADD COLUMN {col} {coltype}"
                            )
                            logger.info(f"🛠️ Added missing column 'objectives.{col}' ({coltype})")
                        except Exception as e:
                            logger.warning(f"⚠️ Could not add column objectives.{col}: {e}")

                # Backfill defaults for newly added user_profile columns where NULL
                try:
                    backfill_statements = [
                        ("daily_tasks_completed_today", 0),
                        ("daily_task_goal", 5),
                        ("rank_this_week", 1),
                        ("rank_last_week", 1),
                        ("seasonal_rank", 1),
                        ("daily_bonus_available", 1),
                        ("consecutive_daily_bonuses", 0),
                        ("comeback_bonus_available", 0),
                        ("days_since_last_activity", 0),
                        ("progress_decay_warning", 0),
                    ]

                    existing_up_cols = get_columns("user_profile") if conn.dialect.name == "sqlite" else set()
                    for col, default_val in backfill_statements:
                        if col in existing_up_cols:  # Only backfill if column exists
                            try:
                                conn.exec_driver_sql(
                                    f"UPDATE user_profile SET {col} = :default_val WHERE {col} IS NULL",
                                    {"default_val": default_val},
                                )
                            except Exception as be:
                                logger.warning(f"⚠️ Could not backfill user_profile.{col}: {be}")
                except Exception as e:
                    logger.warning(f"⚠️ Error during backfill of user_profile defaults: {e}")
        except Exception as e:
            logger.error(f"❌ Error applying non-destructive schema upgrades: {e}")
            # Don't raise to avoid blocking startup; just log the error

    def drop_tables(self):
        """Drop all database tables (use with caution!)"""
        try:
            SQLModel.metadata.drop_all(bind=self.engine)
            logger.warning("⚠️ All SQLModel tables dropped")
        except Exception as e:
            logger.error(f"❌ Error dropping SQLModel tables: {e}")
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
