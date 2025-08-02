"""
Migration script to transfer data from existing SQLite database to SQLAlchemy

This script migrates all data from the current SQLite database to the new
SQLAlchemy-managed database while preserving all data integrity and relationships.
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime
from uuid import UUID
import json

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from core.database import db_manager as old_db_manager, initialize_database as init_old_db
from core.sqlalchemy_database import sqlalchemy_db_manager, initialize_sqlalchemy_database
from core.sqlalchemy_models import (
    UserProfileModel, ObjectiveModel, UserAchievementModel, EarnedCouponModel,
    ConversationThreadModel, ConversationExchangeModel, 
    ExchangeAgentMessageModel, ExchangeStreamingEventModel
)
from core.logging_config import get_logger

logger = get_logger("migration")

class DataMigrator:
    """Handles migration of data from old SQLite to SQLAlchemy"""
    
    def __init__(self):
        self.stats = {
            'user_profiles': 0,
            'objectives': 0,
            'achievements': 0,
            'coupons': 0,
            'conversation_threads': 0,
            'conversation_exchanges': 0,
            'agent_messages': 0,
            'streaming_events': 0,
            'errors': []
        }
    
    async def migrate_all(self):
        """Migrate all data from old database to new SQLAlchemy database"""
        logger.info("🚀 Starting migration from SQLite to SQLAlchemy")
        
        try:
            # Initialize both databases
            await init_old_db()
            initialize_sqlalchemy_database()
            
            # Migrate data in order (respecting foreign key constraints)
            await self.migrate_user_profiles()
            await self.migrate_objectives()
            await self.migrate_conversation_data()
            
            # Print migration summary
            self.print_migration_summary()
            
            logger.info("✅ Migration completed successfully!")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            self.stats['errors'].append(str(e))
            raise
    
    async def migrate_user_profiles(self):
        """Migrate user profiles, achievements, and coupons"""
        logger.info("👤 Migrating user profiles...")
        
        try:
            async with old_db_manager.get_connection() as old_conn:
                # Get user profiles
                cursor = await old_conn.execute("SELECT * FROM user_profile")
                profiles = await cursor.fetchall()
                
                with sqlalchemy_db_manager.get_transaction() as session:
                    for profile_row in profiles:
                        # Create user profile model
                        profile_model = UserProfileModel()
                        
                        # Map all fields
                        profile_model.id = UUID(profile_row['id'])
                        profile_model.username = profile_row['username']
                        profile_model.created_at = datetime.fromisoformat(profile_row['created_at']) if profile_row['created_at'] else datetime.utcnow()
                        profile_model.overall_score = profile_row['overall_score'] or 0
                        profile_model.current_streak_days = profile_row['current_streak_days'] or 0
                        profile_model.last_streak_check_date = datetime.fromisoformat(profile_row['last_streak_check_date']) if profile_row['last_streak_check_date'] else None
                        profile_model.experience_points = profile_row['experience_points'] or 0
                        profile_model.level = profile_row['level'] or 1
                        profile_model.experience_to_next_level = profile_row['experience_to_next_level'] or 100
                        profile_model.total_experience_earned = profile_row['total_experience_earned'] or 0
                        profile_model.last_level_up_date = datetime.fromisoformat(profile_row['last_level_up_date']) if profile_row['last_level_up_date'] else None
                        profile_model.total_coupons_earned = profile_row['total_coupons_earned'] or 0
                        profile_model.total_coupons_used = profile_row['total_coupons_used'] or 0
                        profile_model.favorite_coupon_types = self._parse_json(profile_row.get('favorite_coupon_types'))
                        profile_model.mystery_boxes_earned = profile_row['mystery_boxes_earned'] or 0
                        profile_model.mystery_boxes_opened = profile_row['mystery_boxes_opened'] or 0
                        profile_model.mystery_boxes_from_levelup = profile_row['mystery_boxes_from_levelup'] or 0
                        profile_model.mystery_box_progress = profile_row['mystery_box_progress'] or 0
                        profile_model.points_per_mystery_box = profile_row['points_per_mystery_box'] or 100
                        profile_model.longest_streak = profile_row['longest_streak'] or 0
                        profile_model.streak_multiplier = profile_row['streak_multiplier'] or 1.0
                        profile_model.streak_insurance_count = profile_row['streak_insurance_count'] or 0
                        profile_model.last_activity_date = datetime.fromisoformat(profile_row['last_activity_date']) if profile_row['last_activity_date'] else None
                        profile_model.daily_login_streak = profile_row['daily_login_streak'] or 0
                        profile_model.last_daily_bonus_date = datetime.fromisoformat(profile_row['last_daily_bonus_date']) if profile_row['last_daily_bonus_date'] else None
                        profile_model.weekly_challenge_completed = bool(profile_row['weekly_challenge_completed'])
                        profile_model.weekly_challenge_progress = profile_row['weekly_challenge_progress'] or 0
                        profile_model.weekly_challenge_target = profile_row['weekly_challenge_target'] or 5
                        profile_model.current_week_number = profile_row['current_week_number'] or 0
                        profile_model.luck_factor = profile_row['luck_factor'] or 1.0
                        profile_model.bonus_multiplier_active = bool(profile_row['bonus_multiplier_active'])
                        profile_model.bonus_multiplier_value = profile_row['bonus_multiplier_value'] or 1.0
                        profile_model.bonus_multiplier_expires = datetime.fromisoformat(profile_row['bonus_multiplier_expires']) if profile_row['bonus_multiplier_expires'] else None
                        profile_model.custom_reward_config = self._parse_json(profile_row.get('custom_reward_config'))
                        profile_model.use_custom_rewards = bool(profile_row.get('use_custom_rewards', False))
                        profile_model.daily_tasks_completed_today = profile_row['daily_tasks_completed_today'] or 0
                        profile_model.daily_task_goal = profile_row['daily_task_goal'] or 3
                        profile_model.weekly_tasks_completed = profile_row['weekly_tasks_completed'] or 0
                        profile_model.monthly_tasks_completed = profile_row['monthly_tasks_completed'] or 0
                        profile_model.rank_this_week = profile_row['rank_this_week'] or 1
                        profile_model.rank_last_week = profile_row['rank_last_week'] or 1
                        profile_model.seasonal_rank = profile_row['seasonal_rank'] or 1
                        profile_model.competitive_season = profile_row['competitive_season'] or 1
                        profile_model.limited_time_achievements_available = self._parse_json(profile_row.get('limited_time_achievements_available')) or []
                        profile_model.daily_bonus_available = bool(profile_row.get('daily_bonus_available', True))
                        profile_model.daily_bonus_value = profile_row['daily_bonus_value'] or 10
                        profile_model.consecutive_daily_bonuses = profile_row['consecutive_daily_bonuses'] or 0
                        profile_model.near_miss_count = profile_row['near_miss_count'] or 0
                        profile_model.comeback_bonus_available = bool(profile_row['comeback_bonus_available'])
                        profile_model.perfectionist_mode = bool(profile_row['perfectionist_mode'])
                        profile_model.last_major_achievement = datetime.fromisoformat(profile_row['last_major_achievement']) if profile_row['last_major_achievement'] else None
                        profile_model.days_since_last_activity = profile_row['days_since_last_activity'] or 0
                        profile_model.progress_decay_warning = bool(profile_row['progress_decay_warning'])
                        profile_model.preferred_work_hours = self._parse_json(profile_row.get('preferred_work_hours'))
                        profile_model.completion_patterns = self._parse_json(profile_row.get('completion_patterns'))
                        profile_model.timezone = profile_row['timezone'] or 'UTC'
                        
                        session.add(profile_model)
                        self.stats['user_profiles'] += 1
                        
                        # Migrate achievements for this user
                        await self.migrate_user_achievements(old_conn, session, profile_model.id)
                        
                        # Migrate coupons for this user
                        await self.migrate_user_coupons(old_conn, session, profile_model.id)
                
                logger.info(f"✅ Migrated {self.stats['user_profiles']} user profiles")
                
        except Exception as e:
            logger.error(f"❌ Error migrating user profiles: {e}")
            self.stats['errors'].append(f"User profiles: {e}")
            raise
    
    async def migrate_user_achievements(self, old_conn, session, user_id: UUID):
        """Migrate achievements for a specific user"""
        cursor = await old_conn.execute(
            "SELECT * FROM user_achievements WHERE user_id = ?", 
            (str(user_id),)
        )
        achievements = await cursor.fetchall()
        
        for ach_row in achievements:
            ach_model = UserAchievementModel(
                user_id=user_id,
                achievement_id=ach_row['achievement_id'],
                unlocked_at=datetime.fromisoformat(ach_row['unlocked_at']) if ach_row['unlocked_at'] else datetime.utcnow()
            )
            session.add(ach_model)
            self.stats['achievements'] += 1
    
    async def migrate_user_coupons(self, old_conn, session, user_id: UUID):
        """Migrate coupons for a specific user"""
        cursor = await old_conn.execute(
            "SELECT * FROM earned_coupons WHERE user_id = ?", 
            (str(user_id),)
        )
        coupons = await cursor.fetchall()
        
        for coupon_row in coupons:
            coupon_model = EarnedCouponModel(
                id=UUID(coupon_row['id']),
                user_id=user_id,
                coupon_type=coupon_row['coupon_type'],
                coupon_value=coupon_row['coupon_value'],
                display_name=coupon_row.get('display_name'),
                earned_at=datetime.fromisoformat(coupon_row['earned_at']) if coupon_row['earned_at'] else datetime.utcnow(),
                is_used=bool(coupon_row['is_used']),
                used_at=datetime.fromisoformat(coupon_row['used_at']) if coupon_row['used_at'] else None,
                expiration_date=datetime.fromisoformat(coupon_row['expiration_date']) if coupon_row['expiration_date'] else None,
                source=coupon_row.get('source', 'migration')
            )
            session.add(coupon_model)
            self.stats['coupons'] += 1
    
    async def migrate_objectives(self):
        """Migrate objectives and tasks"""
        logger.info("📋 Migrating objectives and tasks...")
        
        try:
            async with old_db_manager.get_connection() as old_conn:
                cursor = await old_conn.execute("SELECT * FROM objectives ORDER BY created_at ASC")
                objectives = await cursor.fetchall()
                
                with sqlalchemy_db_manager.get_transaction() as session:
                    for obj_row in objectives:
                        obj_model = ObjectiveModel()
                        
                        # Map all fields
                        obj_model.id = UUID(obj_row['id'])
                        obj_model.title = obj_row['title']
                        obj_model.description = obj_row['description']
                        obj_model.parent_id = UUID(obj_row['parent_id']) if obj_row['parent_id'] else None
                        obj_model.degree = obj_row['degree'] or 0
                        obj_model.objective_type = obj_row['objective_type']
                        obj_model.created_at = datetime.fromisoformat(obj_row['created_at']) if obj_row['created_at'] else datetime.utcnow()
                        obj_model.updated_at = datetime.fromisoformat(obj_row['updated_at']) if obj_row['updated_at'] else datetime.utcnow()
                        obj_model.start_date = datetime.fromisoformat(obj_row['start_date']) if obj_row['start_date'] else None
                        obj_model.due_date = datetime.fromisoformat(obj_row['due_date']) if obj_row['due_date'] else None
                        obj_model.all_day = bool(obj_row['all_day'])
                        obj_model.priority_score = obj_row['priority_score'] or 0.5
                        obj_model.complexity_score = obj_row['complexity_score'] or 0.5
                        obj_model.energy_requirement = obj_row['energy_requirement'] or 'medium'
                        obj_model.status = obj_row['status'] or 'not_started'
                        obj_model.completion_percentage = obj_row['completion_percentage'] or 0.0
                        obj_model.context_tags = self._parse_json(obj_row.get('context_tags')) or []
                        obj_model.dependencies = self._parse_json(obj_row.get('dependencies')) or []
                        obj_model.success_criteria = self._parse_json(obj_row.get('success_criteria')) or []
                        obj_model.points_awarded_for_completion = obj_row['points_awarded_for_completion'] or 0
                        obj_model.completion_timeliness_score = obj_row['completion_timeliness_score']
                        obj_model.recurring = self._parse_json(obj_row.get('recurring'))
                        obj_model.location = obj_row.get('location')
                        obj_model.estimated_duration = obj_row.get('estimated_duration')
                        obj_model.actual_duration = obj_row.get('actual_duration')
                        obj_model.actionable_steps = self._parse_json(obj_row.get('actionable_steps')) or []
                        
                        session.add(obj_model)
                        self.stats['objectives'] += 1
                
                logger.info(f"✅ Migrated {self.stats['objectives']} objectives and tasks")
                
        except Exception as e:
            logger.error(f"❌ Error migrating objectives: {e}")
            self.stats['errors'].append(f"Objectives: {e}")
            raise
    
    async def migrate_conversation_data(self):
        """Migrate conversation threads, exchanges, messages, and events"""
        logger.info("💬 Migrating conversation data...")
        
        try:
            async with old_db_manager.get_connection() as old_conn:
                # Migrate conversation threads
                cursor = await old_conn.execute("SELECT * FROM conversation_threads")
                threads = await cursor.fetchall()
                
                with sqlalchemy_db_manager.get_transaction() as session:
                    for thread_row in threads:
                        thread_model = ConversationThreadModel(
                            thread_id=thread_row['thread_id'],
                            created_at=datetime.fromisoformat(thread_row['created_at']) if thread_row['created_at'] else datetime.utcnow(),
                            last_updated=datetime.fromisoformat(thread_row['last_updated']) if thread_row['last_updated'] else datetime.utcnow()
                        )
                        session.add(thread_model)
                        self.stats['conversation_threads'] += 1
                        
                        # Migrate exchanges for this thread
                        await self.migrate_conversation_exchanges(old_conn, session, thread_row['thread_id'])
                
                logger.info(f"✅ Migrated {self.stats['conversation_threads']} conversation threads")
                logger.info(f"✅ Migrated {self.stats['conversation_exchanges']} conversation exchanges")
                logger.info(f"✅ Migrated {self.stats['agent_messages']} agent messages")
                logger.info(f"✅ Migrated {self.stats['streaming_events']} streaming events")
                
        except Exception as e:
            logger.error(f"❌ Error migrating conversation data: {e}")
            self.stats['errors'].append(f"Conversation data: {e}")
            raise
    
    async def migrate_conversation_exchanges(self, old_conn, session, thread_id: str):
        """Migrate exchanges for a specific thread"""
        cursor = await old_conn.execute(
            "SELECT * FROM conversation_exchanges WHERE thread_id = ? ORDER BY timestamp ASC", 
            (thread_id,)
        )
        exchanges = await cursor.fetchall()
        
        for exchange_row in exchanges:
            exchange_model = ConversationExchangeModel(
                id=exchange_row['id'],
                thread_id=thread_id,
                user_message=exchange_row['user_message'],
                planner_summary=exchange_row['planner_summary'] or '',
                executor_summary=exchange_row['executor_summary'] or '',
                timestamp=datetime.fromisoformat(exchange_row['timestamp']) if exchange_row['timestamp'] else datetime.utcnow(),
                final_response=exchange_row['final_response'] or '',
                execution_metadata=self._parse_json(exchange_row.get('execution_metadata')) or {},
                is_complete=bool(exchange_row['is_complete'])
            )
            session.add(exchange_model)
            self.stats['conversation_exchanges'] += 1
            
            # Migrate agent messages for this exchange
            await self.migrate_agent_messages(old_conn, session, exchange_row['id'])
            
            # Migrate streaming events for this exchange
            await self.migrate_streaming_events(old_conn, session, exchange_row['id'])
    
    async def migrate_agent_messages(self, old_conn, session, exchange_id: str):
        """Migrate agent messages for a specific exchange"""
        cursor = await old_conn.execute(
            "SELECT * FROM exchange_agent_messages WHERE exchange_id = ? ORDER BY timestamp ASC", 
            (exchange_id,)
        )
        messages = await cursor.fetchall()
        
        for msg_row in messages:
            msg_model = ExchangeAgentMessageModel(
                id=msg_row['id'],
                exchange_id=exchange_id,
                agent=msg_row['agent'],
                content=msg_row['content'],
                message_type=msg_row['message_type'] or 'response',
                thinking_content=msg_row['thinking_content'] or '',
                tool_calls=self._parse_json(msg_row.get('tool_calls')) or [],
                timestamp=datetime.fromisoformat(msg_row['timestamp']) if msg_row['timestamp'] else datetime.utcnow(),
                tool_name=msg_row.get('tool_name'),
                tool_args=self._parse_json(msg_row.get('tool_args')) or {},
                tool_result_parsed=self._parse_json(msg_row.get('tool_result_parsed')) or {},
                tool_call_id=msg_row.get('tool_call_id')
            )
            session.add(msg_model)
            self.stats['agent_messages'] += 1
    
    async def migrate_streaming_events(self, old_conn, session, exchange_id: str):
        """Migrate streaming events for a specific exchange"""
        cursor = await old_conn.execute(
            "SELECT * FROM exchange_streaming_events WHERE exchange_id = ? ORDER BY timestamp ASC", 
            (exchange_id,)
        )
        events = await cursor.fetchall()
        
        for event_row in events:
            event_model = ExchangeStreamingEventModel(
                id=event_row['id'],
                exchange_id=exchange_id,
                event_type=event_row['event_type'],
                agent=event_row['agent'],
                content=event_row['content'],
                event_metadata=self._parse_json(event_row.get('metadata')) or {},
                timestamp=datetime.fromisoformat(event_row['timestamp']) if event_row['timestamp'] else datetime.utcnow()
            )
            session.add(event_model)
            self.stats['streaming_events'] += 1
    
    def _parse_json(self, json_str):
        """Parse JSON string safely"""
        if json_str is None:
            return None
        try:
            return json.loads(json_str)
        except (json.JSONDecodeError, TypeError):
            return None
    
    def print_migration_summary(self):
        """Print migration summary"""
        logger.info("📊 Migration Summary:")
        logger.info(f"   👤 User Profiles: {self.stats['user_profiles']}")
        logger.info(f"   🏆 Achievements: {self.stats['achievements']}")
        logger.info(f"   🎫 Coupons: {self.stats['coupons']}")
        logger.info(f"   📋 Objectives/Tasks: {self.stats['objectives']}")
        logger.info(f"   💬 Conversation Threads: {self.stats['conversation_threads']}")
        logger.info(f"   🔄 Conversation Exchanges: {self.stats['conversation_exchanges']}")
        logger.info(f"   📝 Agent Messages: {self.stats['agent_messages']}")
        logger.info(f"   ⚡ Streaming Events: {self.stats['streaming_events']}")
        
        if self.stats['errors']:
            logger.error(f"❌ Errors encountered: {len(self.stats['errors'])}")
            for error in self.stats['errors']:
                logger.error(f"   - {error}")

async def main():
    """Main migration function"""
    migrator = DataMigrator()
    await migrator.migrate_all()

if __name__ == "__main__":
    asyncio.run(main())
