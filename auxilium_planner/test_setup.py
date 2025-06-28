#!/usr/bin/env python3
"""
Simple test script to verify Auxilium setup
"""
import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_setup():
    print("🔍 Testing Auxilium Setup...")
    print("-" * 50)
    
    # Test 1: Check Python version
    print(f"✓ Python version: {sys.version.split()[0]}")
    
    # Test 2: Check environment variables
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        print(f"✓ GEMINI_API_KEY is set (length: {len(api_key)})")
    else:
        print("❌ GEMINI_API_KEY is not set!")
        print("   Please set it in your .env file")
        return False
    
    # Test 3: Import core modules
    try:
        from domain.models import Objective, Task, UserProfile
        print("✓ Domain models imported successfully")
    except Exception as e:
        print(f"❌ Failed to import domain models: {e}")
        return False
    
    # Test 4: Import repositories
    try:
        from repositories import ObjectiveRepository, UserProfileRepository
        print("✓ Repositories imported successfully")
    except Exception as e:
        print(f"❌ Failed to import repositories: {e}")
        return False
    
    # Test 5: Import agent system
    try:
        from agents import AgentSystem
        print("✓ Agent system imported successfully")
    except Exception as e:
        print(f"❌ Failed to import agent system: {e}")
        return False
    
    # Test 6: Test basic repository operations
    try:
        user_repo = UserProfileRepository()
        profile = await user_repo.ensure_default_profile()
        print(f"✓ Created/loaded user profile: {profile.username}")
    except Exception as e:
        print(f"❌ Failed to create user profile: {e}")
        return False
    
    # Test 7: Test Gemini connection (simple test)
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model="gemini-pro",
            google_api_key=api_key,
            temperature=0.3
        )
        # Just test initialization, not actual API call
        print("✓ Gemini LLM initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Gemini: {e}")
        return False
    
    print("-" * 50)
    print("✅ All tests passed! Auxilium is ready to run.")
    print("\nTo start the server, run:")
    print("  python main.py")
    
    return True

if __name__ == "__main__":
    success = asyncio.run(test_setup())
    sys.exit(0 if success else 1) 