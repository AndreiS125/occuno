#!/usr/bin/env python3
"""
Test script for FastAPI-Users authentication endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health")
    print(f"Health Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    print()

def test_register():
    """Test user registration"""
    print("🔍 Testing user registration...")
    
    user_data = {
        "username": "testuser@example.com",
        "email": "testuser@example.com", 
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print(f"Register Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("✅ Registration successful!")
        return response.cookies
    else:
        print("❌ Registration failed")
        return None
    print()

def test_login():
    """Test user login"""
    print("🔍 Testing user login...")
    
    # FastAPI-Users expects form data for login
    login_data = {
        "username": "testuser@example.com",
        "password": "testpassword123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/jwt/login", data=login_data)
    print(f"Login Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 204:  # FastAPI-Users returns 204 for successful login
        print("✅ Login successful!")
        return response.cookies
    else:
        print("❌ Login failed")
        return None
    print()

def test_me(cookies):
    """Test getting current user"""
    print("🔍 Testing /auth/me endpoint...")
    
    response = requests.get(f"{BASE_URL}/users/me", cookies=cookies)
    print(f"Me Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Get current user successful!")
        return response.json()
    else:
        print("❌ Get current user failed")
        return None
    print()

def test_google_oauth():
    """Test Google OAuth initiation"""
    print("🔍 Testing Google OAuth initiation...")
    
    response = requests.get(f"{BASE_URL}/auth/google/authorize")
    print(f"Google OAuth Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Auth URL: {data.get('authorization_url')}")
        print("✅ Google OAuth initiation successful!")
    else:
        print("❌ Google OAuth initiation failed")
    print()

def main():
    """Run all tests"""
    print("🚀 Testing FastAPI-Users Authentication Migration\n")
    
    # Test health first
    test_health()
    
    # Test registration
    register_cookies = test_register()
    
    # Test login
    login_cookies = test_login()
    
    # Test getting current user
    if login_cookies:
        test_me(login_cookies)
    elif register_cookies:
        test_me(register_cookies)
    
    # Test Google OAuth
    test_google_oauth()
    
    print("🎯 Authentication testing complete!")

if __name__ == "__main__":
    main()
