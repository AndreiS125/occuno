#!/usr/bin/env python3
"""
Launch script for Auxilium Planner Frontend
"""
import os
import sys
import subprocess
from pathlib import Path

def check_node_version():
    """Check if Node.js is installed and version is compatible."""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ Node.js version: {version}")
            
            # Extract major version number
            major_version = int(version.lstrip('v').split('.')[0])
            if major_version < 16:
                print("⚠️  Warning: Node.js 16+ is recommended")
            
            return True
        else:
            print("❌ Node.js not found")
            return False
    except FileNotFoundError:
        print("❌ Node.js not installed")
        print("Please install Node.js from https://nodejs.org/")
        return False

def check_npm():
    """Check if npm is available."""
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ npm version: {version}")
            return True
        else:
            print("❌ npm not found")
            return False
    except FileNotFoundError:
        print("❌ npm not installed")
        return False

def check_dependencies():
    """Check if node_modules exists, if not try to install."""
    frontend_dir = Path("auxilium-frontend")
    node_modules = frontend_dir / "node_modules"
    package_json = frontend_dir / "package.json"
    
    if not package_json.exists():
        print("❌ package.json not found in auxilium-frontend directory")
        return False
    
    if not node_modules.exists():
        print("📦 Installing frontend dependencies...")
        try:
            result = subprocess.run(
                ['npm', 'install'],
                cwd=frontend_dir,
                check=True,
                capture_output=True,
                text=True
            )
            print("✅ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            print(f"Error output: {e.stderr}")
            return False
    else:
        print("✅ Dependencies already installed")
        return True

def main():
    """Main function to launch the frontend."""
    print("🚀 Starting Auxilium Planner Frontend...")
    print("=" * 50)
    
    # Check if frontend directory exists
    frontend_dir = Path("auxilium-frontend")
    if not frontend_dir.exists():
        print("❌ auxilium-frontend directory not found")
        print("Please run this script from the project root directory")
        sys.exit(1)
    
    print(f"📁 Frontend directory found: {frontend_dir.absolute()}")
    
    # Run checks
    if not check_node_version():
        sys.exit(1)
    
    if not check_npm():
        sys.exit(1)
    
    if not check_dependencies():
        sys.exit(1)
    
    print("=" * 50)
    print("🔥 Starting Next.js development server...")
    print("🌐 Frontend will be available at: http://localhost:3000")
    print("🔄 Hot reload enabled for development")
    print("=" * 50)
    
    try:
        # Start the Next.js development server
        subprocess.run(
            ['npm', 'run', 'dev'],
            cwd=frontend_dir,
            check=True
        )
    except KeyboardInterrupt:
        print("\n👋 Frontend server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start frontend server: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("❌ npm not found. Please install Node.js and npm")
        sys.exit(1)

if __name__ == "__main__":
    main() 