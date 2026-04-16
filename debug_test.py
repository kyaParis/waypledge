#!/usr/bin/env python3
"""
Debug test for Stories endpoints
"""

import requests
import json

BASE_URL = "https://pledge-app-redesign.preview.emergentagent.com/api"

def test_validation():
    # First register a user
    reg_data = {
        "email": f"debug_user@test.com",
        "password": "testpass123",
        "name": "Debug User",
        "bio": "Test user",
        "location": "Test City"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    print(f"Registration: {response.status_code}")
    if response.status_code == 200:
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test short story
        short_story = {"title": "Hi", "content": "Short"}
        response = requests.post(f"{BASE_URL}/stories", headers=headers, json=short_story)
        print(f"Short story test: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Test no auth
        response = requests.post(f"{BASE_URL}/stories", json=short_story)
        print(f"No auth test: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Test my stories no auth
        response = requests.get(f"{BASE_URL}/stories/mine")
        print(f"My stories no auth: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_validation()