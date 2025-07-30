#!/usr/bin/env python3
"""
Simple script to verify the agent fixes
"""

import asyncio
from agents.single_agent_graph import SingleAgentGraph
from core.database import initialize_database

async def main():
    print("Initializing database...")
    await initialize_database()
    
    print("\nTesting fixed agent...")
    agent = SingleAgentGraph()
    
    # Test a query that requires the objectives
    response = await agent.process_user_input("Count how many objectives I have and summarize them by status")
    
    print("\nAgent response:")
    print(response)

if __name__ == "__main__":
    asyncio.run(main()) 