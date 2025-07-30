#!/usr/bin/env python3
"""
Test script to directly access the retrieve_all_objectives repository function
without using the LangChain tool wrapper
"""

import asyncio
import json
from repositories import ObjectiveRepository
from core.database import initialize_database

async def main():
    print("Initializing database...")
    await initialize_database()
    
    print("\nDirectly accessing the ObjectiveRepository...")
    try:
        repo = ObjectiveRepository()
        objectives = await repo.get_all()
        
        print(f"Found {len(objectives)} objectives directly from repository")
        
        # Convert to JSON-compatible format
        objectives_data = [obj.dict() for obj in objectives]
        
        # Create summary statistics
        by_type = {}
        by_status = {}
        by_priority = {"high": 0, "medium": 0, "low": 0}
        
        for obj in objectives:
            # Count by type
            obj_type = obj.objective_type.value if hasattr(obj.objective_type, 'value') else str(obj.objective_type)
            by_type[obj_type] = by_type.get(obj_type, 0) + 1
            
            # Count by status
            obj_status = obj.status.value if hasattr(obj.status, 'value') else str(obj.status)
            by_status[obj_status] = by_status.get(obj_status, 0) + 1
            
            # Count by priority
            if obj.priority_score >= 0.7:
                by_priority["high"] += 1
            elif obj.priority_score >= 0.4:
                by_priority["medium"] += 1
            else:
                by_priority["low"] += 1
        
        # Print summary
        print("\nSummary:")
        print(f"  By type: {by_type}")
        print(f"  By status: {by_status}")
        print(f"  By priority: {by_priority}")
        
        # Print first 3 objectives
        if objectives:
            print("\nFirst 3 objectives:")
            for i, obj in enumerate(objectives[:3]):
                print(f"{i+1}. {obj.title} (ID: {obj.id})")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 