"""
Startup initialization for occuno_planner

This module initializes the single, unified SQLAlchemy/SQLModel database.
Legacy SQLite initialization has been removed to prevent dual-DB usage.
"""

import os
import asyncio
from pathlib import Path

from .sqlalchemy_database import initialize_sqlalchemy_database
from .sqlalchemy_database import DATABASE_PATH as SQLALCHEMY_DB_PATH
from core.logging_config import get_logger

logger = get_logger("startup")

async def initialize_databases():
    """Initialize the SQLAlchemy database only (single source of truth)."""
    logger.info("🚀 Initializing database...")

    try:
        # Initialize SQLAlchemy database
        initialize_sqlalchemy_database()
        logger.info(f"✅ SQLAlchemy database initialized at {SQLALCHEMY_DB_PATH}")
        logger.info("🔄 Using SQLAlchemy repositories")
        logger.info("✅ Database initialization completed successfully")

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise

def get_database_status():
    """Report status of databases (SQLAlchemy is authoritative).

    Returns presence/size of the deprecated legacy SQLite file only to assist
    with cleanup. The application always uses the SQLAlchemy database.
    """
    legacy_sqlite_path = Path("data/occuno_planner.db")
    sqlalchemy_db_path = SQLALCHEMY_DB_PATH

    status = {
        "sqlite_exists": legacy_sqlite_path.exists(),
        "sqlalchemy_exists": sqlalchemy_db_path.exists(),
        "use_sqlalchemy": True,
        "sqlite_size": legacy_sqlite_path.stat().st_size if legacy_sqlite_path.exists() else 0,
        "sqlalchemy_size": sqlalchemy_db_path.stat().st_size if sqlalchemy_db_path.exists() else 0,
        "sqlalchemy_path": str(sqlalchemy_db_path),
    }

    return status

if __name__ == "__main__":
    # Run initialization
    asyncio.run(initialize_databases())
    
    # Print status
    status = get_database_status()
    print("\n📊 Database Status:")
    print(f"   SQLite DB exists: {status['sqlite_exists']} ({status['sqlite_size']} bytes)")
    print(f"   SQLAlchemy DB exists: {status['sqlalchemy_exists']} ({status['sqlalchemy_size']} bytes)")
    print(f"   Using SQLAlchemy: {status['use_sqlalchemy']}")
