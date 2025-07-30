#!/usr/bin/env python3
"""
Test script for timedelta binding fix
"""
import asyncio
import json
import sys
from agents.tools.objective_tools import create_objective

async def test_create_with_duration():
    try:
        # Test creating a task with estimated duration (this was causing the timedelta error)
        objective_data = {
            'title': 'Test Task with Duration',
            'description': 'Testing if timedelta binding is fixed',
            'objective_type': 'task',
            'all_day': False,
            'priority_score': 0.7,
            'estimated_duration_minutes': 60,  # This creates a timedelta internally
            'location': 'Home Office'
        }
        
        result = await create_objective.ainvoke({'objective_data': json.dumps(objective_data)})
        
        print('✅ Task creation with duration successful!')
        data = json.loads(result)
        if data.get('success'):
            print(f'Created task: {data.get("message")}')
            print(f'Task ID: {data.get("id")}')
        else:
            print(f'❌ Error: {data.get("error")}')
            sys.exit(1)
        
    except Exception as e:
        print(f'❌ Exception: {e}')
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_create_with_duration())
    print('Test completed successfully')
