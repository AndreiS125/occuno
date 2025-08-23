#!/usr/bin/env python3
"""
Migration Management Script for SQLAlchemy

This script provides commands to manage the migration from SQLite to SQLAlchemy,
including data migration, testing, and switching between repository systems.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from core.startup import initialize_databases, get_database_status
from migrations.migrate_to_sqlalchemy import DataMigrator
from tests.test_sqlalchemy_migration import MigrationTester
from repositories.repository_factory import switch_to_sqlite, switch_to_sqlalchemy
from core.logging_config import get_logger

logger = get_logger("migration_manager")

class MigrationManager:
    """Manager for SQLAlchemy migration operations"""
    
    def __init__(self):
        self.commands = {
            'status': self.show_status,
            'init': self.initialize_databases,
            'migrate': self.migrate_data,
            'test': self.test_migration,
            'switch-sqlite': self.switch_to_sqlite,
            'switch-sqlalchemy': self.switch_to_sqlalchemy,
            'help': self.show_help
        }
    
    async def run(self, command: str = None):
        """Run migration management command"""
        if not command or command not in self.commands:
            self.show_help()
            return
        
        try:
            await self.commands[command]()
        except Exception as e:
            logger.error(f"❌ Command '{command}' failed: {e}")
            sys.exit(1)
    
    async def show_status(self):
        """Show current database status"""
        logger.info("📊 Database Status")
        logger.info("=" * 50)
        
        status = get_database_status()
        
        logger.info(f"SQLite Database:")
        logger.info(f"  📁 Exists: {status['sqlite_exists']}")
        logger.info(f"  📏 Size: {status['sqlite_size']:,} bytes")
        
        logger.info(f"\nSQLAlchemy Database:")
        logger.info(f"  📁 Exists: {status['sqlalchemy_exists']}")
        logger.info(f"  📏 Size: {status['sqlalchemy_size']:,} bytes")
        
        logger.info(f"\nCurrent Configuration:")
        logger.info(f"  🔄 Using SQLAlchemy: {status['use_sqlalchemy']}")
        logger.info(f"  🌍 Environment Variable: {os.getenv('OCCUNO_USE_SQLALCHEMY', 'not set')}")
        
        # Show migration recommendations
        if status['sqlite_exists'] and not status['sqlalchemy_exists']:
            logger.info(f"\n💡 Recommendation: Run 'migrate' to transfer data to SQLAlchemy")
        elif status['sqlite_exists'] and status['sqlalchemy_exists']:
            if status['sqlalchemy_size'] == 0:
                logger.info(f"\n💡 Recommendation: SQLAlchemy database is empty, run 'migrate'")
            else:
                logger.info(f"\n✅ Both databases exist and have data")
        
        if not status['use_sqlalchemy']:
            logger.info(f"\n🔄 To switch to SQLAlchemy: Run 'switch-sqlalchemy'")
    
    async def initialize_databases(self):
        """Initialize both database systems"""
        logger.info("🚀 Initializing databases...")
        await initialize_databases()
        logger.info("✅ Database initialization completed")
    
    async def migrate_data(self):
        """Migrate data from SQLite to SQLAlchemy"""
        logger.info("🔄 Starting data migration...")
        
        # Check if source database exists
        status = get_database_status()
        if not status['sqlite_exists']:
            logger.error("❌ Source SQLite database does not exist. Run 'init' first.")
            return
        
        # Run migration
        migrator = DataMigrator()
        await migrator.migrate_all()
        
        logger.info("✅ Data migration completed successfully!")
        logger.info("💡 You can now run 'test' to verify the migration")
    
    async def test_migration(self):
        """Test migration compatibility"""
        logger.info("🧪 Testing migration compatibility...")
        
        tester = MigrationTester()
        await tester.run_all_tests()
        
        logger.info("✅ Migration testing completed")
    
    async def switch_to_sqlite(self):
        """Switch to using SQLite repositories"""
        logger.info("🗄️ Switching to SQLite repositories...")
        
        # Set environment variable
        os.environ['OCCUNO_USE_SQLALCHEMY'] = 'false'
        switch_to_sqlite()
        
        logger.info("✅ Switched to SQLite repositories")
        logger.info("💡 Set environment variable OCCUNO_USE_SQLALCHEMY=false to persist this setting")
    
    async def switch_to_sqlalchemy(self):
        """Switch to using SQLAlchemy repositories"""
        logger.info("🔄 Switching to SQLAlchemy repositories...")
        
        # Check if SQLAlchemy database exists and has data
        status = get_database_status()
        if not status['sqlalchemy_exists'] or status['sqlalchemy_size'] == 0:
            logger.warning("⚠️ SQLAlchemy database is empty or doesn't exist")
            logger.info("💡 Run 'migrate' first to transfer data")
            return
        
        # Set environment variable
        os.environ['OCCUNO_USE_SQLALCHEMY'] = 'true'
        switch_to_sqlalchemy()
        
        logger.info("✅ Switched to SQLAlchemy repositories")
        logger.info("💡 Set environment variable OCCUNO_USE_SQLALCHEMY=true to persist this setting")
    
    def show_help(self):
        """Show help information"""
        logger.info("🛠️  SQLAlchemy Migration Manager")
        logger.info("=" * 50)
        logger.info("Available commands:")
        logger.info("")
        logger.info("  status           - Show current database status")
        logger.info("  init             - Initialize both database systems")
        logger.info("  migrate          - Migrate data from SQLite to SQLAlchemy")
        logger.info("  test             - Test migration compatibility")
        logger.info("  switch-sqlite    - Switch to SQLite repositories")
        logger.info("  switch-sqlalchemy - Switch to SQLAlchemy repositories")
        logger.info("  help             - Show this help message")
        logger.info("")
        logger.info("Examples:")
        logger.info("  python manage_migration.py status")
        logger.info("  python manage_migration.py migrate")
        logger.info("  python manage_migration.py test")
        logger.info("")
        logger.info("Environment Variables:")
        logger.info("  OCCUNO_USE_SQLALCHEMY=true   - Use SQLAlchemy repositories")
        logger.info("  OCCUNO_USE_SQLALCHEMY=false  - Use SQLite repositories (default)")

async def main():
    """Main function"""
    command = sys.argv[1] if len(sys.argv) > 1 else None
    
    manager = MigrationManager()
    await manager.run(command)

if __name__ == "__main__":
    asyncio.run(main())
