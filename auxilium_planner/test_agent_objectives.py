#!/usr/bin/env python3
"""
Test script to verify the agent can retrieve objectives correctly
"""

import asyncio
import json
from repositories import ObjectiveRepository
from agents.single_agent_graph import SingleAgentGraph
from core.database import initialize_database

async def main():
    print("Initializing database...")
    await initialize_database()
    
    # Test direct objective retrieval from repository
    print("\nDirectly testing ObjectiveRepository...")
    repo = ObjectiveRepository()
    objectives = await repo.get_all()
    print(f"Found {len(objectives)} objectives directly from repository")
    
    if objectives:
        print("\nFirst 3 objectives:")
        for i, obj in enumerate(objectives[:3]):
            print(f"{i+1}. {obj.title} (ID: {obj.id})")
    
    # Initialize the agent
    print("\nTesting agent via SingleAgentGraph...")
    agent = SingleAgentGraph()
    
    # Test agent response
    response = await agent.process_user_input("How many objectives do I have?")
    print("\nAgent response:")
    print(response)

if __name__ == "__main__":
    asyncio.run(main()) 