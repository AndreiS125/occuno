#!/usr/bin/env python3
"""
Migration script to migrate conversation history from JSON to SQLite.

This script:
1. Reads existing conversation history from JSON files
2. Migrates the data to SQLite database
3. Creates a backup of the original JSON data
4. Verifies the migration was successful
"""

import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
import shutil

# Set up the Python path
import sys
sys.path.append(str(Path(__file__).parent))

from core.database import initialize_database
from core.logging_config import get_logger
from core.config import settings
from repositories.sqlite_conversation_repository import (
    SQLiteConversationRepository,
    ConversationHistory,
    ExchangeSummary,
    AgentMessage,
    StreamingEvent
)

logger = get_logger("conversation_migration")

class ConversationMigration:
    """Handles migration of conversation history from JSON to SQLite."""
    
    def __init__(self):
        self.logger = logger
        self.conversation_repo = SQLiteConversationRepository()
        self.json_file = Path(settings.data_file_path).parent / "conversation_history.json"
        self.backup_file = Path(settings.data_file_path).parent / f"conversation_history_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    def load_json_data(self) -> Dict[str, Any]:
        """Load conversation history from JSON file."""
        try:
            if not self.json_file.exists():
                self.logger.warning(f"JSON file not found: {self.json_file}")
                return {}
            
            with open(self.json_file, 'r') as f:
                data = json.load(f)
                self.logger.info(f"Loaded {len(data)} threads from JSON file")
                return data
        
        except Exception as e:
            self.logger.error(f"Error loading JSON data: {e}")
            return {}
    
    def create_backup(self) -> bool:
        """Create a backup of the original JSON file."""
        try:
            if self.json_file.exists():
                shutil.copy2(self.json_file, self.backup_file)
                self.logger.info(f"Created backup: {self.backup_file}")
                return True
            else:
                self.logger.warning("No JSON file to backup")
                return False
        
        except Exception as e:
            self.logger.error(f"Error creating backup: {e}")
            return False
    
    def parse_json_to_conversation_history(self, thread_id: str, thread_data: Dict[str, Any]) -> ConversationHistory:
        """Parse JSON thread data into ConversationHistory object."""
        history = ConversationHistory(thread_id)
        
        # Set timestamps if available
        if 'created_at' in thread_data:
            history.created_at = thread_data['created_at']
        if 'last_updated' in thread_data:
            history.last_updated = thread_data['last_updated']
        
        # Parse exchanges
        exchanges = thread_data.get('exchanges', [])
        for exchange_data in exchanges:
            exchange = ExchangeSummary(
                user_message=exchange_data.get('user_message', ''),
                planner_summary=exchange_data.get('planner_summary', ''),
                executor_summary=exchange_data.get('executor_summary', '')
            )
            
            # Set exchange metadata
            exchange.id = exchange_data.get('id', exchange.id)
            exchange.timestamp = exchange_data.get('timestamp', exchange.timestamp)
            exchange.final_response = exchange_data.get('final_response', '')
            exchange.execution_metadata = exchange_data.get('execution_metadata', {})
            exchange.is_complete = exchange_data.get('is_complete', False)
            
            # Parse agent messages
            agent_messages = exchange_data.get('agent_messages', [])
            for msg_data in agent_messages:
                message = AgentMessage(
                    agent=msg_data.get('agent', ''),
                    content=msg_data.get('content', ''),
                    message_type=msg_data.get('message_type', 'response'),
                    thinking_content=msg_data.get('thinking_content', ''),
                    tool_calls=msg_data.get('tool_calls', []),
                    timestamp=msg_data.get('timestamp')
                )
                
                # Set enhanced tool data
                message.id = msg_data.get('id', message.id)
                message.tool_name = msg_data.get('tool_name')
                message.tool_args = msg_data.get('tool_args', {})
                message.tool_result_parsed = msg_data.get('tool_result_parsed', {})
                message.tool_call_id = msg_data.get('tool_call_id')
                
                exchange.agent_messages.append(message)
            
            # Parse streaming events
            streaming_events = exchange_data.get('streaming_events', [])
            for event_data in streaming_events:
                event = StreamingEvent(
                    event_type=event_data.get('event_type', ''),
                    agent=event_data.get('agent', ''),
                    content=event_data.get('content', ''),
                    metadata=event_data.get('metadata', {})
                )
                
                event.id = event_data.get('id', event.id)
                event.timestamp = event_data.get('timestamp', event.timestamp)
                
                exchange.streaming_events.append(event)
            
            history.exchanges.append(exchange)
        
        return history
    
    async def migrate_thread(self, thread_id: str, thread_data: Dict[str, Any]) -> bool:
        """Migrate a single thread from JSON to SQLite."""
        try:
            # Parse JSON data to conversation history
            history = self.parse_json_to_conversation_history(thread_id, thread_data)
            
            # Save to SQLite
            await self.conversation_repo.save_conversation_history(history)
            
            self.logger.info(f"Migrated thread {thread_id} with {len(history.exchanges)} exchanges")
            return True
        
        except Exception as e:
            self.logger.error(f"Error migrating thread {thread_id}: {e}")
            return False
    
    async def migrate_all_data(self) -> Dict[str, Any]:
        """Migrate all conversation data from JSON to SQLite."""
        self.logger.info("Starting conversation history migration to SQLite")
        
        # Load JSON data
        json_data = self.load_json_data()
        if not json_data:
            return {
                'success': False,
                'message': 'No JSON data to migrate',
                'threads_migrated': 0,
                'threads_failed': 0
            }
        
        # Create backup
        backup_created = self.create_backup()
        if not backup_created:
            self.logger.warning("Backup creation failed, proceeding anyway")
        
        # Migration statistics
        threads_migrated = 0
        threads_failed = 0
        failed_threads = []
        
        # Migrate each thread
        for thread_id, thread_data in json_data.items():
            try:
                success = await self.migrate_thread(thread_id, thread_data)
                if success:
                    threads_migrated += 1
                else:
                    threads_failed += 1
                    failed_threads.append(thread_id)
            except Exception as e:
                self.logger.error(f"Error processing thread {thread_id}: {e}")
                threads_failed += 1
                failed_threads.append(thread_id)
        
        # Report results
        result = {
            'success': threads_failed == 0,
            'threads_migrated': threads_migrated,
            'threads_failed': threads_failed,
            'failed_threads': failed_threads,
            'backup_file': str(self.backup_file) if backup_created else None
        }
        
        self.logger.info(f"Migration completed: {threads_migrated} threads migrated, {threads_failed} failed")
        
        return result
    
    async def verify_migration(self) -> Dict[str, Any]:
        """Verify the migration was successful by comparing data."""
        self.logger.info("Verifying migration...")
        
        try:
            # Load original JSON data
            json_data = self.load_json_data()
            
            # Get statistics from SQLite
            stats = await self.conversation_repo.get_stats()
            
            json_threads = len(json_data)
            json_exchanges = sum(len(thread.get('exchanges', [])) for thread in json_data.values())
            
            sqlite_threads = stats.get('thread_count', 0)
            sqlite_exchanges = stats.get('exchange_count', 0)
            
            verification_result = {
                'json_threads': json_threads,
                'json_exchanges': json_exchanges,
                'sqlite_threads': sqlite_threads,
                'sqlite_exchanges': sqlite_exchanges,
                'threads_match': json_threads == sqlite_threads,
                'exchanges_match': json_exchanges == sqlite_exchanges,
                'success': json_threads == sqlite_threads and json_exchanges == sqlite_exchanges
            }
            
            self.logger.info(f"Verification result: {verification_result}")
            
            return verification_result
        
        except Exception as e:
            self.logger.error(f"Error during verification: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def test_basic_operations(self) -> bool:
        """Test basic SQLite operations after migration."""
        try:
            self.logger.info("Testing basic SQLite operations...")
            
            # Test getting stats
            stats = await self.conversation_repo.get_stats()
            self.logger.info(f"Database stats: {stats}")
            
            # Test getting a conversation history
            if stats.get('thread_count', 0) > 0:
                # Load JSON data to get a thread ID
                json_data = self.load_json_data()
                if json_data:
                    test_thread_id = list(json_data.keys())[0]
                    history = await self.conversation_repo.get_conversation_history(test_thread_id)
                    self.logger.info(f"Test thread {test_thread_id} has {len(history.exchanges)} exchanges")
            
            return True
        
        except Exception as e:
            self.logger.error(f"Error during basic operations test: {e}")
            return False

async def main():
    """Main migration function."""
    try:
        # Initialize database
        await initialize_database()
        
        # Create migration instance
        migration = ConversationMigration()
        
        # Perform migration
        result = await migration.migrate_all_data()
        
        print(f"\n{'='*60}")
        print("CONVERSATION HISTORY MIGRATION RESULTS")
        print(f"{'='*60}")
        print(f"Migration Success: {result['success']}")
        print(f"Threads Migrated: {result['threads_migrated']}")
        print(f"Threads Failed: {result['threads_failed']}")
        
        if result['failed_threads']:
            print(f"Failed Threads: {result['failed_threads']}")
        
        if result['backup_file']:
            print(f"Backup Created: {result['backup_file']}")
        
        # Verify migration
        verification = await migration.verify_migration()
        print(f"\nVERIFICATION RESULTS:")
        print(f"Threads: JSON={verification['json_threads']}, SQLite={verification['sqlite_threads']}, Match={verification['threads_match']}")
        print(f"Exchanges: JSON={verification['json_exchanges']}, SQLite={verification['sqlite_exchanges']}, Match={verification['exchanges_match']}")
        print(f"Overall Verification: {'PASSED' if verification['success'] else 'FAILED'}")
        
        # Test basic operations
        operations_test = await migration.test_basic_operations()
        print(f"Basic Operations Test: {'PASSED' if operations_test else 'FAILED'}")
        
        if result['success'] and verification['success'] and operations_test:
            print(f"\n✅ MIGRATION COMPLETED SUCCESSFULLY!")
            print(f"Your conversation history has been safely migrated to SQLite.")
            print(f"The original JSON file has been backed up to: {result['backup_file']}")
        else:
            print(f"\n❌ MIGRATION ENCOUNTERED ISSUES!")
            print(f"Please check the logs for details.")
        
        print(f"{'='*60}")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        print(f"❌ MIGRATION FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 