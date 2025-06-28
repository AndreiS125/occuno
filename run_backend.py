#!/usr/bin/env python3
"""
Launch script for Auxilium Planner Backend
"""
import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python version: {sys.version.split()[0]}")

def check_virtual_environment():
    """Check if we're in a virtual environment."""
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ Virtual environment detected")
        return True
    else:
        print("⚠️  Warning: Not running in a virtual environment")
        return False

def check_dependencies():
    """Check if required dependencies are installed."""
    try:
        import fastapi
        import uvicorn
        print("✅ Core dependencies found")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install dependencies with: pip install -r requirements.txt")
        return False

def main():
    """Main function to launch the backend."""
    print("🚀 Starting Auxilium Planner Backend...")
    print("=" * 50)
    
    # Change to the auxilium_planner directory
    backend_dir = Path("auxilium_planner")
    if not backend_dir.exists():
        print("❌ auxilium_planner directory not found")
        print("Please run this script from the project root directory")
        sys.exit(1)
    
    os.chdir(backend_dir)
    print(f"📁 Changed to directory: {os.getcwd()}")
    
    # Run checks
    check_python_version()
    
    if not check_dependencies():
        sys.exit(1)
    
    check_virtual_environment()
    
    print("=" * 50)
    print("🔥 Launching FastAPI server...")
    print("📊 Logs will be saved to: logs/auxilium_planner.log")
    print("🌐 API will be available at: http://localhost:8000")
    print("📚 API docs available at: http://localhost:8000/docs")
    print("=" * 50)
    
    try:
        # Launch the FastAPI app
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,  # Enable auto-reload for development
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 