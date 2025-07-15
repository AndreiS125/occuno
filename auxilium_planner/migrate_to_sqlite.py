#!/usr/bin/env python3
"""
Migration script to transfer data from JSON files to SQLite database.
This script safely migrates all existing data while preserving data integrity.

⚠️  WARNING: This script should only be run once during the initial migration.
"""

import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime
from uuid import UUID
from typing import Any, Dict, List

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from core.database import initialize_database, db_manager, get_db_transaction, json_serialize, DATABASE_PATH
from core.config import settings
from core.logging_config import get_logger
from domain.models import (
    UserProfile, UserAchievement, EarnedCoupon, Objective, Task, 
    ObjectiveType, ObjectiveStatus, EnergyLevel, RecurringInfo
)

logger = get_logger("migration")

class DataMigrator:
    """Handles migration from JSON to SQLite"""
    
    def __init__(self):
        self.json_path = settings.data_file_path
        self.backup_path = self.json_path.parent / f"backup_before_migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        self.logger = logger
    
    async def migrate(self) -> bool:
        """Main migration method"""
        try:
            # Check if migration already completed
            if DATABASE_PATH.exists():
                self.logger.warning("⚠️  SQLite database already exists. Migration may have already been completed.")
                user_input = input("Do you want to continue anyway? This will overwrite existing data. (y/N): ")
                if user_input.lower() != 'y':
                    self.logger.info("Migration cancelled by user")
                    return False
            
            self.logger.info("🚀 Starting migration from JSON to SQLite")
            
            # Step 1: Initialize SQLite database
            await initialize_database()
            
            # Step 2: Load and validate JSON data
            json_data = await self._load_json_data()
            if not json_data:
                self.logger.warning("No JSON data found or file is empty")
                return True
            
            # Step 3: Create backup of original data
            await self._create_backup(json_data)
            
            # Step 4: Migrate data in transaction
            await self._migrate_data(json_data)
            
            # Step 5: Verify migration
            await self._verify_migration(json_data)
            
            self.logger.info("✅ Migration completed successfully!")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Migration failed: {e}")
            return False
    
    async def _load_json_data(self) -> Dict[str, Any]:
        """Load and validate JSON data"""
        try:
            if not self.json_path.exists():
                self.logger.info("JSON file doesn't exist, starting with empty database")
                return {}
            
            with open(self.json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.logger.info(f"📄 Loaded JSON data from {self.json_path}")
            self.logger.info(f"📊 Data summary: {len(data.get('objectives', []))} objectives, "
                           f"{len(data.get('user_memories', []))} memories")
            
            return data
            
        except Exception as e:
            self.logger.error(f"❌ Error loading JSON data: {e}")
            return {}
    
    async def _create_backup(self, data: Dict[str, Any]) -> None:
        """Create a backup of the original JSON data"""
        try:
            with open(self.backup_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, default=str)
            
            self.logger.info(f"💾 Created backup at {self.backup_path}")
            
        except Exception as e:
            self.logger.error(f"❌ Error creating backup: {e}")
            raise
    
    async def _migrate_data(self, data: Dict[str, Any]) -> None:
        """Migrate all data in a single transaction"""
        async with get_db_transaction() as conn:
            # Migrate user profile
            if 'user_profile' in data and data['user_profile']:
                await self._migrate_user_profile(conn, data['user_profile'])
            
            # Migrate objectives
            if 'objectives' in data and data['objectives']:
                await self._migrate_objectives(conn, data['objectives'])
            
            # Migrate user memories
            if 'user_memories' in data and data['user_memories']:
                await self._migrate_user_memories(conn, data['user_memories'])
            

    
    async def _migrate_user_profile(self, conn, profile_data: Dict[str, Any]) -> None:
        """Migrate user profile data"""
        try:
            self.logger.info("👤 Migrating user profile...")
            
            # Create UserProfile object to validate and set defaults
            profile = UserProfile(**profile_data)
            
            # Insert user profile
            await conn.execute("""
                INSERT OR REPLACE INTO user_profile (
                    id, username, created_at, overall_score, current_streak_days,
                    last_streak_check_date, experience_points, level, experience_to_next_level,
                    total_experience_earned, last_level_up_date, total_coupons_earned,
                    total_coupons_used, mystery_boxes_earned, mystery_boxes_opened,
                    mystery_boxes_from_levelup, mystery_box_progress, points_per_mystery_box,
                    longest_streak, streak_multiplier, streak_insurance_count,
                    last_activity_date, daily_login_streak, last_daily_bonus_date,
                    weekly_challenge_completed, weekly_challenge_progress, weekly_challenge_target,
                    current_week_number, luck_factor, bonus_multiplier_active,
                    bonus_multiplier_value, bonus_multiplier_expires, daily_tasks_completed_today,
                    daily_task_goal, weekly_tasks_completed, monthly_tasks_completed,
                    rank_this_week, rank_last_week, seasonal_rank, competitive_season,
                    daily_bonus_available, daily_bonus_value, consecutive_daily_bonuses,
                    near_miss_count, comeback_bonus_available, perfectionist_mode,
                    last_major_achievement, days_since_last_activity, progress_decay_warning,
                    preferred_work_hours, completion_patterns, timezone
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(profile.id), profile.username, profile.created_at.isoformat(),
                profile.overall_score, profile.current_streak_days,
                profile.last_streak_check_date.isoformat() if profile.last_streak_check_date else None,
                profile.experience_points, profile.level, profile.experience_to_next_level,
                profile.total_experience_earned,
                profile.last_level_up_date.isoformat() if profile.last_level_up_date else None,
                profile.total_coupons_earned, profile.total_coupons_used,
                profile.mystery_boxes_earned, profile.mystery_boxes_opened,
                profile.mystery_boxes_from_levelup, profile.mystery_box_progress,
                profile.points_per_mystery_box, profile.longest_streak, profile.streak_multiplier,
                profile.streak_insurance_count,
                profile.last_activity_date.isoformat() if profile.last_activity_date else None,
                profile.daily_login_streak,
                profile.last_daily_bonus_date.isoformat() if profile.last_daily_bonus_date else None,
                profile.weekly_challenge_completed, profile.weekly_challenge_progress,
                profile.weekly_challenge_target, profile.current_week_number, profile.luck_factor,
                profile.bonus_multiplier_active, profile.bonus_multiplier_value,
                profile.bonus_multiplier_expires.isoformat() if profile.bonus_multiplier_expires else None,
                profile.daily_tasks_completed_today, profile.daily_task_goal,
                profile.weekly_tasks_completed, profile.monthly_tasks_completed,
                profile.rank_this_week, profile.rank_last_week, profile.seasonal_rank,
                profile.competitive_season, profile.daily_bonus_available,
                profile.daily_bonus_value, profile.consecutive_daily_bonuses,
                profile.near_miss_count, profile.comeback_bonus_available,
                profile.perfectionist_mode, profile.last_major_achievement,
                profile.days_since_last_activity, profile.progress_decay_warning,
                json_serialize(profile.preferred_work_hours),
                json_serialize(profile.completion_patterns), profile.timezone
            ))
            
            # Migrate achievements
            for achievement_data in profile.achievements:
                await conn.execute("""
                    INSERT OR REPLACE INTO user_achievements (user_id, achievement_id, unlocked_at)
                    VALUES (?, ?, ?)
                """, (
                    str(profile.id), achievement_data.achievement_id,
                    achievement_data.unlocked_at.isoformat()
                ))
            
            # Migrate coupons
            for coupon_data in profile.earned_coupons:
                await conn.execute("""
                    INSERT OR REPLACE INTO earned_coupons (
                        id, user_id, coupon_type, coupon_value, earned_at, is_used,
                        used_at, expiration_date, source
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    str(coupon_data.id), str(profile.id), coupon_data.coupon_type.value,
                    coupon_data.coupon_type.value, coupon_data.earned_at.isoformat(),
                    coupon_data.is_used,
                    coupon_data.used_at.isoformat() if coupon_data.used_at else None,
                    coupon_data.expires_at.isoformat() if coupon_data.expires_at else None,
                    "migration"  # Set source as migration
                ))
            
            self.logger.info(f"✅ Migrated user profile: {profile.username}")
            
        except Exception as e:
            self.logger.error(f"❌ Error migrating user profile: {e}")
            raise
    
    async def _migrate_objectives(self, conn, objectives_data: List[Dict[str, Any]]) -> None:
        """Migrate objectives data"""
        try:
            self.logger.info(f"📋 Migrating {len(objectives_data)} objectives...")
            
            for obj_data in objectives_data:
                # Parse the objective data
                obj_data_copy = obj_data.copy()
                
                # Convert IDs to UUID objects
                obj_data_copy['id'] = UUID(obj_data_copy['id'])
                if obj_data_copy.get('parent_id'):
                    obj_data_copy['parent_id'] = UUID(obj_data_copy['parent_id'])
                
                # Convert datetime strings
                for field in ['created_at', 'updated_at', 'start_date', 'due_date']:
                    if obj_data_copy.get(field):
                        obj_data_copy[field] = datetime.fromisoformat(obj_data_copy[field])
                
                # Convert enum fields
                obj_data_copy['objective_type'] = ObjectiveType(obj_data_copy['objective_type'])
                obj_data_copy['status'] = ObjectiveStatus(obj_data_copy['status'])
                obj_data_copy['energy_requirement'] = EnergyLevel(obj_data_copy['energy_requirement'])
                
                # Handle recurring data
                if obj_data_copy.get('recurring'):
                    obj_data_copy['recurring'] = RecurringInfo(**obj_data_copy['recurring'])
                
                # Handle estimated_duration
                if obj_data_copy.get('estimated_duration'):
                    if isinstance(obj_data_copy['estimated_duration'], (int, float)):
                        # Already in seconds
                        pass
                    else:
                        # Convert timedelta to seconds
                        try:
                            obj_data_copy['estimated_duration'] = obj_data_copy['estimated_duration'].total_seconds()
                        except AttributeError:
                            # If it's not a timedelta, remove it
                            obj_data_copy['estimated_duration'] = None
                
                # Handle actual_duration
                if obj_data_copy.get('actual_duration'):
                    if isinstance(obj_data_copy['actual_duration'], (int, float)):
                        # Already in seconds
                        pass
                    else:
                        # Convert timedelta to seconds
                        try:
                            obj_data_copy['actual_duration'] = obj_data_copy['actual_duration'].total_seconds()
                        except AttributeError:
                            # If it's not a timedelta, remove it
                            obj_data_copy['actual_duration'] = None
                
                # Create the appropriate object
                if obj_data_copy['objective_type'] == ObjectiveType.TASK:
                    objective = Task(**obj_data_copy)
                else:
                    # Remove task-specific fields
                    task_fields = ['location', 'estimated_duration', 'actual_duration', 'actionable_steps']
                    for field in task_fields:
                        obj_data_copy.pop(field, None)
                    objective = Objective(**obj_data_copy)
                
                # Convert timedelta fields to seconds for database storage
                estimated_duration = getattr(objective, 'estimated_duration', None)
                if estimated_duration and hasattr(estimated_duration, 'total_seconds'):
                    estimated_duration = estimated_duration.total_seconds()
                    
                actual_duration = getattr(objective, 'actual_duration', None)
                if actual_duration and hasattr(actual_duration, 'total_seconds'):
                    actual_duration = actual_duration.total_seconds()
                
                # Insert into database
                await conn.execute("""
                    INSERT OR REPLACE INTO objectives (
                        id, title, description, parent_id, degree, objective_type,
                        created_at, updated_at, start_date, due_date, all_day,
                        priority_score, complexity_score, energy_requirement, status,
                        completion_percentage, context_tags, dependencies, success_criteria,
                        points_awarded_for_completion, completion_timeliness_score,
                        recurring, location, estimated_duration, actual_duration, actionable_steps
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    str(objective.id), objective.title, objective.description,
                    str(objective.parent_id) if objective.parent_id else None,
                    objective.degree, objective.objective_type.value,
                    objective.created_at.isoformat(), objective.updated_at.isoformat(),
                    objective.start_date.isoformat() if objective.start_date else None,
                    objective.due_date.isoformat() if objective.due_date else None,
                    objective.all_day, objective.priority_score, objective.complexity_score,
                    objective.energy_requirement.value, objective.status.value,
                    objective.completion_percentage, json_serialize(objective.context_tags),
                    json_serialize(objective.dependencies), json_serialize(objective.success_criteria),
                    objective.points_awarded_for_completion, objective.completion_timeliness_score,
                    json_serialize(objective.recurring.model_dump() if objective.recurring else None),
                    getattr(objective, 'location', None),
                    estimated_duration,
                    actual_duration,
                    json_serialize(getattr(objective, 'actionable_steps', []))
                ))
            
            self.logger.info(f"✅ Migrated {len(objectives_data)} objectives")
            
        except Exception as e:
            self.logger.error(f"❌ Error migrating objectives: {e}")
            raise
    
    async def _migrate_user_memories(self, conn, memories_data: List[Dict[str, Any]]) -> None:
        """Migrate user memories data"""
        try:
            self.logger.info(f"🧠 Migrating {len(memories_data)} user memories...")
            
            for memory_data in memories_data:
                await conn.execute("""
                    INSERT OR REPLACE INTO user_memories (id, text, category, timestamp)
                    VALUES (?, ?, ?, ?)
                """, (
                    memory_data.get('id'),
                    memory_data.get('text', ''),
                    memory_data.get('category', 'general'),
                    memory_data.get('timestamp', datetime.utcnow().isoformat())
                ))
            
            self.logger.info(f"✅ Migrated {len(memories_data)} user memories")
            
        except Exception as e:
            self.logger.error(f"❌ Error migrating user memories: {e}")
            raise
    

    

    
    async def _verify_migration(self, original_data: Dict[str, Any]) -> None:
        """Verify that migration was successful"""
        try:
            self.logger.info("🔍 Verifying migration...")
            
            async with db_manager.get_connection() as conn:
                # Check user profile
                if original_data.get('user_profile'):
                    cursor = await conn.execute("SELECT COUNT(*) FROM user_profile")
                    count = await cursor.fetchone()
                    assert count[0] == 1, "User profile not migrated correctly"
                
                # Check objectives
                if original_data.get('objectives'):
                    cursor = await conn.execute("SELECT COUNT(*) FROM objectives")
                    count = await cursor.fetchone()
                    assert count[0] == len(original_data['objectives']), f"Objectives count mismatch: expected {len(original_data['objectives'])}, got {count[0]}"
                
                # Check user memories
                if original_data.get('user_memories'):
                    cursor = await conn.execute("SELECT COUNT(*) FROM user_memories")
                    count = await cursor.fetchone()
                    assert count[0] == len(original_data['user_memories']), f"User memories count mismatch: expected {len(original_data['user_memories'])}, got {count[0]}"
            
            self.logger.info("✅ Migration verification passed")
            
        except Exception as e:
            self.logger.error(f"❌ Migration verification failed: {e}")
            raise

async def main():
    """Main migration function"""
    migrator = DataMigrator()
    success = await migrator.migrate()
    
    if success:
        print("✅ Migration completed successfully!")
        print(f"📄 Original data backed up to: {migrator.backup_path}")
        print("🗄️ SQLite database is ready to use")
    else:
        print("❌ Migration failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 