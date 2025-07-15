import sqlite3
import asyncio
import aiosqlite
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from uuid import UUID
import json
import logging

from core.config import settings
from core.logging_config import get_logger

logger = get_logger("database")

# Database path
DATABASE_PATH = Path(settings.data_file_path).parent / "auxilium_planner.db"

class DatabaseManager:
    """Database manager for SQLite operations with connection pooling"""
    
    def __init__(self, db_path: Path = DATABASE_PATH):
        self.db_path = db_path
        self._connection_pool: List[aiosqlite.Connection] = []
        self._pool_lock = asyncio.Lock()
        self._max_connections = 10
        
    async def initialize(self):
        """Initialize the database with all tables"""
        logger.info(f"🗄️ Initializing SQLite database at {self.db_path}")
        
        # Ensure directory exists
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        async with aiosqlite.connect(self.db_path) as db:
            # Enable foreign keys and WAL mode for better concurrency
            await db.execute("PRAGMA foreign_keys = ON")
            await db.execute("PRAGMA journal_mode = WAL")
            await db.execute("PRAGMA synchronous = NORMAL")
            await db.execute("PRAGMA cache_size = -64000")  # 64MB cache
            await db.execute("PRAGMA temp_store = MEMORY")
            
            # Configure row factory to return dictionaries
            db.row_factory = aiosqlite.Row
            
            # Create tables
            await self._create_tables(db)
            await db.commit()
            
        logger.info("✅ Database initialized successfully")
    
    async def _create_tables(self, db: aiosqlite.Connection):
        """Create all database tables"""
        
        # User Profile table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_profile (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                overall_score INTEGER DEFAULT 0,
                current_streak_days INTEGER DEFAULT 0,
                last_streak_check_date TIMESTAMP,
                experience_points INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                experience_to_next_level INTEGER DEFAULT 100,
                total_experience_earned INTEGER DEFAULT 0,
                last_level_up_date TIMESTAMP,
                total_coupons_earned INTEGER DEFAULT 0,
                total_coupons_used INTEGER DEFAULT 0,
                mystery_boxes_earned INTEGER DEFAULT 0,
                mystery_boxes_opened INTEGER DEFAULT 0,
                mystery_boxes_from_levelup INTEGER DEFAULT 0,
                mystery_box_progress INTEGER DEFAULT 0,
                points_per_mystery_box INTEGER DEFAULT 100,
                longest_streak INTEGER DEFAULT 0,
                streak_multiplier REAL DEFAULT 1.0,
                streak_insurance_count INTEGER DEFAULT 0,
                last_activity_date TIMESTAMP,
                daily_login_streak INTEGER DEFAULT 0,
                last_daily_bonus_date TIMESTAMP,
                weekly_challenge_completed BOOLEAN DEFAULT FALSE,
                weekly_challenge_progress INTEGER DEFAULT 0,
                weekly_challenge_target INTEGER DEFAULT 5,
                current_week_number INTEGER DEFAULT 0,
                luck_factor REAL DEFAULT 1.0,
                bonus_multiplier_active BOOLEAN DEFAULT FALSE,
                bonus_multiplier_value REAL DEFAULT 1.0,
                bonus_multiplier_expires TIMESTAMP,
                daily_tasks_completed_today INTEGER DEFAULT 0,
                daily_task_goal INTEGER DEFAULT 3,
                weekly_tasks_completed INTEGER DEFAULT 0,
                monthly_tasks_completed INTEGER DEFAULT 0,
                rank_this_week INTEGER DEFAULT 1,
                rank_last_week INTEGER DEFAULT 1,
                seasonal_rank INTEGER DEFAULT 1,
                competitive_season INTEGER DEFAULT 1,
                daily_bonus_available BOOLEAN DEFAULT TRUE,
                daily_bonus_value INTEGER DEFAULT 10,
                consecutive_daily_bonuses INTEGER DEFAULT 0,
                near_miss_count INTEGER DEFAULT 0,
                comeback_bonus_available BOOLEAN DEFAULT FALSE,
                perfectionist_mode BOOLEAN DEFAULT FALSE,
                last_major_achievement TEXT,
                days_since_last_activity INTEGER DEFAULT 0,
                progress_decay_warning BOOLEAN DEFAULT FALSE,
                preferred_work_hours TEXT,  -- JSON field
                completion_patterns TEXT,   -- JSON field
                timezone TEXT DEFAULT 'UTC'
            )
        """)
        
        # Objectives table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS objectives (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                parent_id TEXT,
                degree INTEGER DEFAULT 0,
                objective_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                start_date TIMESTAMP,
                due_date TIMESTAMP,
                all_day BOOLEAN DEFAULT FALSE,
                priority_score REAL DEFAULT 0.5,
                complexity_score REAL DEFAULT 0.5,
                energy_requirement TEXT DEFAULT 'medium',
                status TEXT DEFAULT 'not_started',
                completion_percentage REAL DEFAULT 0.0,
                context_tags TEXT,  -- JSON array
                dependencies TEXT,  -- JSON array
                success_criteria TEXT,  -- JSON array
                points_awarded_for_completion INTEGER DEFAULT 0,
                completion_timeliness_score REAL,
                recurring TEXT,  -- JSON object
                location TEXT,
                estimated_duration REAL,  -- seconds
                actual_duration REAL,     -- seconds
                actionable_steps TEXT,    -- JSON array
                FOREIGN KEY (parent_id) REFERENCES objectives(id) ON DELETE CASCADE
            )
        """)
        
        # User Achievements table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                achievement_id TEXT NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
                UNIQUE(user_id, achievement_id)
            )
        """)
        
        # Earned Coupons table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS earned_coupons (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                coupon_type TEXT NOT NULL,
                coupon_value TEXT NOT NULL,
                display_name TEXT,  -- Preserve exact name shown on the wheel
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_used BOOLEAN DEFAULT FALSE,
                used_at TIMESTAMP,
                expiration_date TIMESTAMP,
                source TEXT,  -- where it came from
                FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
            )
        """)
        

        
        # User Memories table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Conversation Threads table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS conversation_threads (
                thread_id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Conversation Exchanges table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS conversation_exchanges (
                id TEXT PRIMARY KEY,
                thread_id TEXT NOT NULL,
                user_message TEXT NOT NULL,
                planner_summary TEXT DEFAULT '',
                executor_summary TEXT DEFAULT '',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                final_response TEXT DEFAULT '',
                execution_metadata TEXT DEFAULT '{}',  -- JSON object
                is_complete BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (thread_id) REFERENCES conversation_threads(thread_id) ON DELETE CASCADE
            )
        """)
        
        # Exchange Agent Messages table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS exchange_agent_messages (
                id TEXT PRIMARY KEY,
                exchange_id TEXT NOT NULL,
                agent TEXT NOT NULL,  -- 'planning' or 'executor'
                content TEXT NOT NULL,
                message_type TEXT DEFAULT 'response',  -- 'response', 'thinking', 'tool_call', 'tool_result'
                thinking_content TEXT DEFAULT '',
                tool_calls TEXT DEFAULT '[]',  -- JSON array
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tool_name TEXT,
                tool_args TEXT DEFAULT '{}',  -- JSON object
                tool_result_parsed TEXT DEFAULT '{}',  -- JSON object
                tool_call_id TEXT,
                FOREIGN KEY (exchange_id) REFERENCES conversation_exchanges(id) ON DELETE CASCADE
            )
        """)
        
        # Exchange Streaming Events table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS exchange_streaming_events (
                id TEXT PRIMARY KEY,
                exchange_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                agent TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT DEFAULT '{}',  -- JSON object
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (exchange_id) REFERENCES conversation_exchanges(id) ON DELETE CASCADE
            )
        """)
        
        # Create indexes for better performance
        await db.execute("CREATE INDEX IF NOT EXISTS idx_objectives_parent_id ON objectives(parent_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_objectives_status ON objectives(status)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_objectives_due_date ON objectives(due_date)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_objectives_type ON objectives(objective_type)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_earned_coupons_user_id ON earned_coupons(user_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_earned_coupons_is_used ON earned_coupons(is_used)")
        
        # Migration: Add display_name column to earned_coupons if it doesn't exist
        try:
            await db.execute("ALTER TABLE earned_coupons ADD COLUMN display_name TEXT")
            print("🔄 Added display_name column to earned_coupons table")
        except Exception as e:
            # Column already exists, which is fine
            if "duplicate column name" not in str(e).lower():
                print(f"⚠️ Migration warning: {e}")
        
        await db.commit()
        print("✅ Database initialization completed")

        
        # Conversation history indexes
        await db.execute("CREATE INDEX IF NOT EXISTS idx_conversation_exchanges_thread_id ON conversation_exchanges(thread_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_conversation_exchanges_timestamp ON conversation_exchanges(timestamp)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_exchange_agent_messages_exchange_id ON exchange_agent_messages(exchange_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_exchange_agent_messages_agent ON exchange_agent_messages(agent)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_exchange_agent_messages_timestamp ON exchange_agent_messages(timestamp)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_exchange_streaming_events_exchange_id ON exchange_streaming_events(exchange_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_exchange_streaming_events_timestamp ON exchange_streaming_events(timestamp)")
        
        logger.info("✅ Database tables created successfully")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get a database connection from the pool"""
        async with self._pool_lock:
            if self._connection_pool:
                conn = self._connection_pool.pop()
            else:
                conn = await aiosqlite.connect(self.db_path)
                await conn.execute("PRAGMA foreign_keys = ON")
                await conn.execute("PRAGMA journal_mode = WAL")
                conn.row_factory = aiosqlite.Row
        
        try:
            yield conn
        finally:
            async with self._pool_lock:
                if len(self._connection_pool) < self._max_connections:
                    self._connection_pool.append(conn)
                else:
                    await conn.close()
    
    async def close_all_connections(self):
        """Close all connections in the pool"""
        async with self._pool_lock:
            for conn in self._connection_pool:
                await conn.close()
            self._connection_pool.clear()

# Global database manager instance
db_manager = DatabaseManager()

# Utility functions for JSON serialization
def json_serialize(obj: Any) -> str:
    """Serialize object to JSON string for database storage"""
    if obj is None:
        return None
    
    def json_encoder(o):
        if isinstance(o, UUID):
            return str(o)
        elif isinstance(o, datetime):
            return o.isoformat()
        elif isinstance(o, timedelta):
            return o.total_seconds()
        return o
    
    return json.dumps(obj, default=json_encoder)

def json_deserialize(json_str: str) -> Any:
    """Deserialize JSON string from database"""
    if json_str is None:
        return None
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return None

# Database initialization function
async def initialize_database():
    """Initialize the database - call this on startup"""
    await db_manager.initialize()

# Context manager for database transactions
@asynccontextmanager
async def get_db_transaction():
    """Get a database transaction context"""
    async with db_manager.get_connection() as conn:
        try:
            await conn.execute("BEGIN")
            yield conn
            await conn.commit()
        except Exception:
            await conn.rollback()
            raise 