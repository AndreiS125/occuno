"""
Test Script for Auxilium Agent System

This script tests the core functionality of the AI agent system to ensure
everything is working correctly.
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.agent_graph import AgentGraph
from agents.memory_system import MemorySystem
from core.config import settings
from core.logging_config import get_logger

logger = get_logger("test_agent")


async def test_basic_interaction():
    """Test basic user interaction with the agent system."""
    print("🧪 Testing basic agent interaction...")
    
    try:
        # Initialize agent system
        agent_graph = AgentGraph()
        print("✅ Agent system initialized successfully")
        
        # Test basic request
        user_input = "What objectives do I have for this week?"
        response = await agent_graph.process_user_input(user_input)
        
        print(f"User: {user_input}")
        print(f"Agent: {response}")
        print("✅ Basic interaction test passed")
        
        return True
    
    except Exception as e:
        print(f"❌ Basic interaction test failed: {e}")
        return False


async def test_objective_creation():
    """Test creating objectives through the agent."""
    print("🧪 Testing objective creation...")
    
    try:
        agent_graph = AgentGraph()
        
        user_input = "Create a new task to learn Python basics for tomorrow at 2 PM"
        response = await agent_graph.process_user_input(user_input)
        
        print(f"User: {user_input}")
        print(f"Agent: {response}")
        print("✅ Objective creation test passed")
        
        return True
    
    except Exception as e:
        print(f"❌ Objective creation test failed: {e}")
        return False


async def test_memory_system():
    """Test the memory system functionality."""
    print("🧪 Testing memory system...")
    
    try:
        memory_system = MemorySystem()
        
        # Create new thread
        thread_id = await memory_system.create_new_thread()
        print(f"✅ Created thread: {thread_id}")
        
        # Test context retrieval
        context = await memory_system.get_user_context()
        print(f"✅ Retrieved user context: {len(context)} keys")
        
        # Test conversation state
        state = await memory_system.get_conversation_state(thread_id)
        print(f"✅ Retrieved conversation state: {len(state)} keys")
        
        print("✅ Memory system test passed")
        return True
    
    except Exception as e:
        print(f"❌ Memory system test failed: {e}")
        return False


async def test_tool_functionality():
    """Test individual tool functionality."""
    print("🧪 Testing tool functionality...")
    
    try:
        from agents.tools.objective_tools import retrieve_all_objectives
        from agents.tools.memory_tools import save_user_memory
        from agents.tools.utility_tools import get_current_time
        
        # Test get current time
        time_result = await get_current_time.ainvoke({})
        print(f"✅ Time tool works: {len(time_result)} chars")
        
        # Test save memory
        memory_result = await save_user_memory.ainvoke({
            "memory_text": "Test memory from agent test", 
            "category": "testing"
        })
        print(f"✅ Memory tool works: {'success' in memory_result.lower()}")
        
        # Test objectives retrieval
        objectives_result = await retrieve_all_objectives.ainvoke({})
        print(f"✅ Objectives tool works: {len(objectives_result)} chars")
        
        print("✅ Tool functionality test passed")
        return True
    
    except Exception as e:
        print(f"❌ Tool functionality test failed: {e}")
        return False


async def test_conversation_flow():
    """Test multi-turn conversation with memory."""
    print("🧪 Testing conversation flow...")
    
    try:
        agent_graph = AgentGraph()
        memory_system = MemorySystem()
        
        # Create a conversation thread
        thread_id = await memory_system.create_new_thread()
        
        # First interaction
        response1 = await agent_graph.process_user_input(
            "Tell me about my current workload",
            thread_id=thread_id
        )
        print(f"Turn 1: {len(response1)} chars")
        
        # Second interaction (should remember context)
        response2 = await agent_graph.process_user_input(
            "Based on that, what should I prioritize?",
            thread_id=thread_id
        )
        print(f"Turn 2: {len(response2)} chars")
        
        print("✅ Conversation flow test passed")
        return True
    
    except Exception as e:
        print(f"❌ Conversation flow test failed: {e}")
        return False


async def run_all_tests():
    """Run all tests and report results."""
    print("🚀 Starting Auxilium Agent System Tests")
    print("=" * 50)
    
    # Check configuration
    if not settings.google_api_key:
        print("❌ GOOGLE_API_KEY not found in environment variables")
        print("Please set your Gemini API key in .env file")
        return False
    
    print(f"✅ Configuration loaded:")
    print(f"   - Planning Model: {settings.planning_model}")
    print(f"   - Executor Model: {settings.executor_model}")
    print(f"   - Max Iterations: {settings.max_agent_iterations}")
    print()
    
    # Run tests
    tests = [
        test_memory_system,
        test_tool_functionality,
        test_basic_interaction,
        test_objective_creation,
        test_conversation_flow
    ]
    
    results = []
    for test_func in tests:
        try:
            result = await test_func()
            results.append(result)
        except Exception as e:
            print(f"❌ Test {test_func.__name__} crashed: {e}")
            results.append(False)
        print()
    
    # Report results
    print("=" * 50)
    print("📊 Test Results:")
    passed = sum(results)
    total = len(results)
    
    for i, (test_func, result) in enumerate(zip(tests, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {i+1}. {test_func.__name__}: {status}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! The agent system is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the logs and configuration.")
        return False


if __name__ == "__main__":
    # Run the tests
    success = asyncio.run(run_all_tests())
    
    if success:
        print("\n🎯 Next steps:")
        print("1. Start the server: python main.py")
        print("2. Test the API: POST http://localhost:8000/api/v1/agent/chat")
        print("3. Example request: {'message': 'Help me plan my week'}")
    else:
        print("\n🔧 Please fix the issues above before using the agent system.")
    
    sys.exit(0 if success else 1) 