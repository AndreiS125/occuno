#!/usr/bin/env python3
"""
Test script for SQLModel migration

This script tests the new SQLModel-based architecture to ensure
everything works correctly before we remove the old models.
"""

import sys
import os
from uuid import uuid4
from datetime import datetime

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.models import (
    UserProfile, Objective, UserAchievement, EarnedCoupon,
    ObjectiveType, ObjectiveStatus, EnergyLevel, CouponType
)
from core.sqlalchemy_database import initialize_sqlalchemy_database, close_sqlalchemy_database
from repositories.repository_factory import get_user_profile_repository, get_objective_repository

def test_sqlmodel_migration():
    """Test the SQLModel migration"""
    print("🧪 Testing SQLModel Migration...")
    
    try:
        # Initialize database
        print("1. Initializing database...")
        initialize_sqlalchemy_database()
        print("✅ Database initialized successfully")
        
        # Get repositories
        user_repo = get_user_profile_repository()
        objective_repo = get_objective_repository()
        
        # Test 1: Create a user profile
        print("\n2. Testing user profile creation...")
        test_user = UserProfile(
            username="test_user_sqlmodel",
            experience_points=50,
            level=2,
            overall_score=150
        )
        
        created_user = user_repo.create(test_user)
        print(f"✅ Created user: {created_user.id} - {created_user.username}")
        
        # Test 2: Create an objective
        print("\n3. Testing objective creation...")
        test_objective = Objective(
            title="Test SQLModel Objective",
            description="Testing the new SQLModel architecture",
            objective_type="task",
            status="not_started",
            priority_score=0.8,
            complexity_score=0.6,
            energy_requirement="medium"
        )
        
        created_objective = objective_repo.create(test_objective)
        print(f"✅ Created objective: {created_objective.id} - {created_objective.title}")
        
        # Test 3: Add achievement to user
        print("\n4. Testing achievement addition...")
        achievement = user_repo.add_achievement(created_user.id, "test_achievement_sqlmodel")
        print(f"✅ Added achievement: {achievement.achievement_id}")
        
        # Test 4: Add coupon to user
        print("\n5. Testing coupon addition...")
        coupon = EarnedCoupon(
            coupon_type="watch_youtube",
            coupon_value="15_minutes",
            display_name="Watch YouTube (15 min)",
            expiration_date=datetime.utcnow()
        )
        
        added_coupon = user_repo.add_coupon(created_user.id, coupon)
        print(f"✅ Added coupon: {added_coupon.coupon_type}")
        
        # Test 5: Retrieve and verify data
        print("\n6. Testing data retrieval...")
        retrieved_user = user_repo.get_by_id(created_user.id)
        print(f"✅ Retrieved user: {retrieved_user.username}")
        print(f"   - Achievements: {len(retrieved_user.achievements)}")
        print(f"   - Coupons: {len(retrieved_user.earned_coupons)}")
        
        retrieved_objective = objective_repo.get_by_id(created_objective.id)
        print(f"✅ Retrieved objective: {retrieved_objective.title}")
        
        # Test 6: Update operations
        print("\n7. Testing update operations...")
        retrieved_user.experience_points += 25
        updated_user = user_repo.update(retrieved_user)
        print(f"✅ Updated user XP: {updated_user.experience_points}")
        
        retrieved_objective.status = "completed"
        updated_objective = objective_repo.update(retrieved_objective)
        print(f"✅ Updated objective status: {updated_objective.status}")
        
        # Test 7: Query operations
        print("\n8. Testing query operations...")
        all_users = user_repo.get_all()
        print(f"✅ Found {len(all_users)} users")
        
        completed_objectives = objective_repo.get_by_status("completed")
        print(f"✅ Found {len(completed_objectives)} completed objectives")
        
        task_objectives = objective_repo.get_by_type("task")
        print(f"✅ Found {len(task_objectives)} task objectives")
        
        # Test 8: Statistics
        print("\n9. Testing statistics...")
        stats = objective_repo.get_statistics()
        print(f"✅ Objective statistics:")
        print(f"   - Total: {stats['total']}")
        print(f"   - Completion rate: {stats['completion_rate']}%")
        print(f"   - By status: {stats['by_status']}")
        
        print("\n🎉 All tests passed! SQLModel migration is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        # Clean up
        print("\n10. Cleaning up...")
        close_sqlalchemy_database()
        print("✅ Database closed")

if __name__ == "__main__":
    success = test_sqlmodel_migration()
    sys.exit(0 if success else 1)
