#!/usr/bin/env python3
"""
Quick test script for datetime comparison fix
"""
import asyncio
import json
import sys
from agents.tools.objective_tools import retrieve_objectives_by_time_period

async def test_time_period():
    try:
        # Test retrieving objectives for today
        start_date = '2025-07-19T00:00:00-07:00'
        end_date = '2025-07-19T23:59:59-07:00'
        
        result = await retrieve_objectives_by_time_period.ainvoke({
            'start_date': start_date, 
            'end_date': end_date
        })
        
        print('✅ Time period retrieval successful!')
        data = json.loads(result)
        print(f'Found {data.get("count", 0)} objectives for today')
        
    except Exception as e:
        print(f'❌ Error: {e}')
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_time_period())
    print('Test completed successfully')
