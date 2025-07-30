#!/usr/bin/env python3
"""
Test script to verify database connections and repository operations
"""

import asyncio
from repositories import ObjectiveRepository, UserProfileRepository
from core.database import initialize_database

async def main():
    print("Initializing database...")
    await initialize_database()
    
    # Test ObjectiveRepository
    print("\nTesting ObjectiveRepository...")
    obj_repo = ObjectiveRepository()
    objectives = await obj_repo.get_all()
    print(f"Found {len(objectives)} objectives in the database")
    
    # Print the first 5 objectives if any exist
    if objectives:
        print("\nFirst 5 objectives:")
        for i, obj in enumerate(objectives[:5]):
            print(f"{i+1}. {obj.title} (ID: {obj.id})")
    else:
        print("No objectives found in database")
    
    # Test UserProfileRepository
    print("\nTesting UserProfileRepository...")
    user_repo = UserProfileRepository()
    profile = await user_repo.get_default_profile()
    if profile:
        print(f"Found user profile: {profile.username}")
        print(f"Overall score: {profile.overall_score}")
        print(f"Current streak: {profile.current_streak_days}")
        print(f"Weekly challenge progress: {profile.weekly_challenge_progress}")
        print(f"Daily tasks completed today: {profile.daily_tasks_completed_today}")
    else:
        print("No user profile found")

if __name__ == "__main__":
    asyncio.run(main()) 