"""
Startup initialization for auxilium_planner

This module handles database initialization for both SQLite and SQLAlchemy
systems, allowing for graceful migration and testing.
"""

import os
import asyncio
from pathlib import Path

from core.database import initialize_database as init_sqlite_db
from core.sqlalchemy_database import initialize_sqlalchemy_database
from core.logging_config import get_logger

logger = get_logger("startup")

async def initialize_databases():
    """Initialize both SQLite and SQLAlchemy databases"""
    logger.info("🚀 Initializing databases...")
    
    try:
        # Always initialize the original SQLite database
        await init_sqlite_db()
        logger.info("✅ SQLite database initialized")
        
        # Initialize SQLAlchemy database
        initialize_sqlalchemy_database()
        logger.info("✅ SQLAlchemy database initialized")
        
        # Check if migration is needed
        use_sqlalchemy = os.getenv('AUXILIUM_USE_SQLALCHEMY', 'false').lower() in ('true', '1', 'yes')
        if use_sqlalchemy:
            logger.info("🔄 Using SQLAlchemy repositories")
        else:
            logger.info("🗄️ Using SQLite repositories")
        
        logger.info("✅ Database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise

def get_database_status():
    """Get status of both database systems"""
    sqlite_db_path = Path("data/auxilium_planner.db")
    sqlalchemy_db_path = Path("data/auxilium_planner_sqlalchemy.db")
    
    status = {
        "sqlite_exists": sqlite_db_path.exists(),
        "sqlalchemy_exists": sqlalchemy_db_path.exists(),
        "use_sqlalchemy": os.getenv('AUXILIUM_USE_SQLALCHEMY', 'false').lower() in ('true', '1', 'yes'),
        "sqlite_size": sqlite_db_path.stat().st_size if sqlite_db_path.exists() else 0,
        "sqlalchemy_size": sqlalchemy_db_path.stat().st_size if sqlalchemy_db_path.exists() else 0
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
