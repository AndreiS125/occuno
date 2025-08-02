"""
Test script to verify SQLAlchemy migration compatibility

This script tests all major endpoints with both SQLite and SQLAlchemy
repositories to ensure complete API compatibility.
"""

import asyncio
import os
import sys
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timedelta

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from repositories.repository_factory import repository_factory, switch_to_sqlite, switch_to_sqlalchemy
from repositories.repository_factory import get_user_profile_repository, get_objective_repository, get_conversation_repository
from domain.models import UserProfile, Objective, Task, ObjectiveType, ObjectiveStatus, EnergyLevel
from core.startup import initialize_databases
from core.logging_config import get_logger

logger = get_logger("test_migration")

class MigrationTester:
    """Test class for verifying SQLAlchemy migration compatibility"""
    
    def __init__(self):
        self.test_results = {
            'sqlite': {'passed': 0, 'failed': 0, 'errors': []},
            'sqlalchemy': {'passed': 0, 'failed': 0, 'errors': []}
        }
        self.test_data = {}
    
    async def run_all_tests(self):
        """Run all tests with both repository systems"""
        logger.info("🧪 Starting comprehensive migration tests...")
        
        # Initialize databases
        await initialize_databases()
        
        # Test with SQLite repositories
        logger.info("🗄️ Testing with SQLite repositories...")
        switch_to_sqlite()
        await self.run_test_suite('sqlite')
        
        # Test with SQLAlchemy repositories
        logger.info("🔄 Testing with SQLAlchemy repositories...")
        switch_to_sqlalchemy()
        await self.run_test_suite('sqlalchemy')
        
        # Print results
        self.print_test_results()
    
    async def run_test_suite(self, repo_type: str):
        """Run complete test suite for a repository type"""
        try:
            # User Profile Tests
            await self.test_user_profile_operations(repo_type)
            
            # Objective Tests
            await self.test_objective_operations(repo_type)
            
            # Conversation Tests
            await self.test_conversation_operations(repo_type)
            
        except Exception as e:
            logger.error(f"❌ Test suite failed for {repo_type}: {e}")
            self.test_results[repo_type]['errors'].append(f"Test suite: {e}")
    
    async def test_user_profile_operations(self, repo_type: str):
        """Test user profile repository operations"""
        logger.info(f"👤 Testing user profile operations ({repo_type})...")
        
        try:
            user_repo = get_user_profile_repository()
            
            # Test 1: Get default profile
            profile = await user_repo.get_default_profile()
            assert profile is not None, "Default profile should exist"
            assert isinstance(profile, UserProfile), "Should return UserProfile instance"
            self.record_test_pass(repo_type, "Get default profile")
            
            # Test 2: Update profile
            original_score = profile.overall_score
            profile.overall_score += 100
            updated_profile = await user_repo.update_profile(profile)
            assert updated_profile.overall_score == original_score + 100, "Score should be updated"
            self.record_test_pass(repo_type, "Update profile")
            
            # Test 3: Add points
            before_score = updated_profile.overall_score
            points_profile = await user_repo.add_points(50)
            assert points_profile.overall_score == before_score + 50, "Points should be added"
            self.record_test_pass(repo_type, "Add points")
            
            # Test 4: Update streak
            streak_profile = await user_repo.update_streak(5)
            assert streak_profile.current_streak_days == 5, "Streak should be updated"
            self.record_test_pass(repo_type, "Update streak")
            
            # Store test data for comparison
            self.test_data[f'{repo_type}_profile'] = streak_profile
            
        except Exception as e:
            logger.error(f"❌ User profile test failed ({repo_type}): {e}")
            self.record_test_fail(repo_type, f"User profile: {e}")
    
    async def test_objective_operations(self, repo_type: str):
        """Test objective repository operations"""
        logger.info(f"📋 Testing objective operations ({repo_type})...")
        
        try:
            obj_repo = get_objective_repository()
            
            # Test 1: Create main objective
            main_obj = Objective(
                title=f"Test Main Objective ({repo_type})",
                description="Test main objective for migration testing",
                objective_type=ObjectiveType.MAIN_OBJECTIVE,
                priority_score=0.8
            )
            created_main = await obj_repo.create(main_obj)
            assert created_main.id == main_obj.id, "Created objective should have same ID"
            self.record_test_pass(repo_type, "Create main objective")
            
            # Test 2: Create sub-objective
            sub_obj = Objective(
                title=f"Test Sub Objective ({repo_type})",
                description="Test sub-objective",
                objective_type=ObjectiveType.SUB_OBJECTIVE,
                parent_id=created_main.id,
                priority_score=0.6
            )
            created_sub = await obj_repo.create(sub_obj)
            assert created_sub.parent_id == created_main.id, "Sub-objective should have correct parent"
            assert created_sub.degree == 1, "Sub-objective should have degree 1"
            self.record_test_pass(repo_type, "Create sub-objective")
            
            # Test 3: Create task
            task = Task(
                title=f"Test Task ({repo_type})",
                description="Test task",
                objective_type=ObjectiveType.TASK,
                parent_id=created_sub.id,
                location="Test Location",
                estimated_duration=timedelta(hours=2),
                actionable_steps=["Step 1", "Step 2"]
            )
            created_task = await obj_repo.create(task)
            assert isinstance(created_task, Task), "Should return Task instance"
            assert created_task.location == "Test Location", "Task location should be preserved"
            self.record_test_pass(repo_type, "Create task")
            
            # Test 4: Get by ID
            retrieved_main = await obj_repo.get_by_id(created_main.id)
            assert retrieved_main.title == created_main.title, "Retrieved objective should match"
            self.record_test_pass(repo_type, "Get objective by ID")
            
            # Test 5: Get children
            children = await obj_repo.get_by_parent(created_main.id)
            assert len(children) >= 1, "Should have at least one child"
            assert any(child.id == created_sub.id for child in children), "Should contain created sub-objective"
            self.record_test_pass(repo_type, "Get children objectives")
            
            # Test 6: Update objective
            updates = {
                "status": ObjectiveStatus.IN_PROGRESS,
                "completion_percentage": 25.0
            }
            updated_obj = await obj_repo.update(created_main.id, updates)
            assert updated_obj.status == ObjectiveStatus.IN_PROGRESS, "Status should be updated"
            assert updated_obj.completion_percentage == 25.0, "Completion percentage should be updated"
            self.record_test_pass(repo_type, "Update objective")
            
            # Test 7: Get all objectives
            all_objectives = await obj_repo.get_all()
            assert len(all_objectives) >= 3, "Should have at least 3 objectives"
            self.record_test_pass(repo_type, "Get all objectives")
            
            # Test 8: Search objectives
            search_results = await obj_repo.search("Test")
            assert len(search_results) >= 1, "Should find test objectives"
            self.record_test_pass(repo_type, "Search objectives")
            
            # Store test data
            self.test_data[f'{repo_type}_objectives'] = {
                'main': created_main,
                'sub': created_sub,
                'task': created_task
            }
            
        except Exception as e:
            logger.error(f"❌ Objective test failed ({repo_type}): {e}")
            self.record_test_fail(repo_type, f"Objective: {e}")
    
    async def test_conversation_operations(self, repo_type: str):
        """Test conversation repository operations"""
        logger.info(f"💬 Testing conversation operations ({repo_type})...")
        
        try:
            conv_repo = get_conversation_repository()
            
            # Test 1: Get conversation history (should create if not exists)
            thread_id = f"test_thread_{repo_type}_{uuid4().hex[:8]}"
            history = await conv_repo.get_conversation_history(thread_id)
            assert history.thread_id == thread_id, "Should return correct thread ID"
            self.record_test_pass(repo_type, "Get conversation history")
            
            # Test 2: Add exchange and save
            exchange = history.add_exchange(f"Test user message for {repo_type}")
            exchange.add_agent_message("planning", "Test planning response", "response")
            exchange.add_agent_message("executor", "Test executor response", "response")
            exchange.set_final_response("Test final response")
            
            await conv_repo.save_conversation_history(history)
            self.record_test_pass(repo_type, "Save conversation history")
            
            # Test 3: Retrieve saved history
            retrieved_history = await conv_repo.get_conversation_history(thread_id)
            assert len(retrieved_history.exchanges) >= 1, "Should have saved exchanges"
            assert retrieved_history.exchanges[0].user_message == f"Test user message for {repo_type}", "User message should match"
            self.record_test_pass(repo_type, "Retrieve conversation history")
            
            # Test 4: Get stats
            stats = await conv_repo.get_stats()
            assert 'thread_count' in stats, "Stats should include thread count"
            assert 'exchange_count' in stats, "Stats should include exchange count"
            self.record_test_pass(repo_type, "Get conversation stats")
            
            # Store test data
            self.test_data[f'{repo_type}_conversation'] = {
                'thread_id': thread_id,
                'exchange_count': len(retrieved_history.exchanges)
            }
            
        except Exception as e:
            logger.error(f"❌ Conversation test failed ({repo_type}): {e}")
            self.record_test_fail(repo_type, f"Conversation: {e}")
    
    def record_test_pass(self, repo_type: str, test_name: str):
        """Record a passing test"""
        self.test_results[repo_type]['passed'] += 1
        logger.info(f"✅ {test_name} - PASSED ({repo_type})")
    
    def record_test_fail(self, repo_type: str, error_msg: str):
        """Record a failing test"""
        self.test_results[repo_type]['failed'] += 1
        self.test_results[repo_type]['errors'].append(error_msg)
        logger.error(f"❌ {error_msg} - FAILED ({repo_type})")
    
    def print_test_results(self):
        """Print comprehensive test results"""
        logger.info("\n" + "="*60)
        logger.info("📊 MIGRATION TEST RESULTS")
        logger.info("="*60)
        
        for repo_type in ['sqlite', 'sqlalchemy']:
            results = self.test_results[repo_type]
            total_tests = results['passed'] + results['failed']
            success_rate = (results['passed'] / total_tests * 100) if total_tests > 0 else 0
            
            logger.info(f"\n{repo_type.upper()} REPOSITORIES:")
            logger.info(f"  ✅ Passed: {results['passed']}")
            logger.info(f"  ❌ Failed: {results['failed']}")
            logger.info(f"  📈 Success Rate: {success_rate:.1f}%")
            
            if results['errors']:
                logger.info(f"  🐛 Errors:")
                for error in results['errors']:
                    logger.info(f"    - {error}")
        
        # Compare data consistency between repositories
        self.compare_repository_consistency()
        
        # Overall result
        total_passed = sum(r['passed'] for r in self.test_results.values())
        total_failed = sum(r['failed'] for r in self.test_results.values())
        overall_success = (total_passed / (total_passed + total_failed) * 100) if (total_passed + total_failed) > 0 else 0
        
        logger.info(f"\n🎯 OVERALL MIGRATION SUCCESS: {overall_success:.1f}%")
        
        if overall_success >= 95:
            logger.info("🎉 MIGRATION READY FOR PRODUCTION!")
        elif overall_success >= 80:
            logger.info("⚠️  MIGRATION NEEDS MINOR FIXES")
        else:
            logger.info("🚨 MIGRATION NEEDS MAJOR FIXES")
    
    def compare_repository_consistency(self):
        """Compare data consistency between SQLite and SQLAlchemy repositories"""
        logger.info(f"\n🔍 DATA CONSISTENCY CHECK:")
        
        # Compare user profiles
        if 'sqlite_profile' in self.test_data and 'sqlalchemy_profile' in self.test_data:
            sqlite_profile = self.test_data['sqlite_profile']
            sqlalchemy_profile = self.test_data['sqlalchemy_profile']
            
            # Note: Scores may differ due to test execution order, but structure should be same
            logger.info(f"  👤 User Profile Structure: {'✅ CONSISTENT' if type(sqlite_profile) == type(sqlalchemy_profile) else '❌ INCONSISTENT'}")
        
        # Compare objectives
        if 'sqlite_objectives' in self.test_data and 'sqlalchemy_objectives' in self.test_data:
            sqlite_objs = self.test_data['sqlite_objectives']
            sqlalchemy_objs = self.test_data['sqlalchemy_objectives']
            
            # Check that both created the same types of objects
            consistent = (
                type(sqlite_objs['main']) == type(sqlalchemy_objs['main']) and
                type(sqlite_objs['sub']) == type(sqlalchemy_objs['sub']) and
                type(sqlite_objs['task']) == type(sqlalchemy_objs['task'])
            )
            logger.info(f"  📋 Objective Types: {'✅ CONSISTENT' if consistent else '❌ INCONSISTENT'}")

async def main():
    """Main test function"""
    tester = MigrationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
