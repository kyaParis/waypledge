#!/usr/bin/env python3
"""
Backend API Testing for WayPledge Stories Endpoints
Tests the Stories endpoints for the Gratitude Wall feature
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://pledge-app-redesign.preview.emergentagent.com/api"
TIMEOUT = 30

class TestResults:
    def __init__(self):
        self.tests = []
        self.passed = 0
        self.failed = 0
    
    def add_test(self, name, passed, details=""):
        self.tests.append({
            "name": name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
        if details:
            print(f"   Details: {details}")
    
    def summary(self):
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        print(f"\n{'='*60}")
        print(f"STORIES ENDPOINTS TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {total}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"{'='*60}")
        
        if self.failed > 0:
            print("\nFAILED TESTS:")
            for test in self.tests:
                if not test["passed"]:
                    print(f"❌ {test['name']}: {test['details']}")

def make_request(method, endpoint, headers=None, data=None, timeout=TIMEOUT):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=timeout)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=timeout)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=timeout)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=timeout)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def register_user(email, password, name, display_name=None):
    """Register a new user"""
    data = {
        "email": email,
        "password": password,
        "name": name,
        "display_name": display_name,
        "bio": "Test user for Stories API testing",
        "location": "Test City"
    }
    
    response = make_request("POST", "/auth/register", data=data)
    if response and response.status_code == 200:
        return response.json()
    return None

def login_user(email, password):
    """Login user and return token"""
    data = {"email": email, "password": password}
    response = make_request("POST", "/auth/login", data=data)
    if response and response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_stories_endpoints():
    """Test all Stories endpoints"""
    results = TestResults()
    
    print("🧪 TESTING STORIES ENDPOINTS FOR GRATITUDE WALL")
    print("=" * 60)
    
    # Test data
    regular_user_email = f"storyuser_{int(time.time())}@test.com"
    admin_user_email = "admin@waypledge.me"  # From ADMIN_EMAILS in .env
    password = "testpass123"
    
    regular_token = None
    admin_token = None
    story_id = None
    
    # 1. Register regular user
    print("\n1. Registering regular user...")
    reg_result = register_user(regular_user_email, password, "Story Tester", "StoryTester123")
    if reg_result:
        regular_token = reg_result["access_token"]
        results.add_test("Register regular user", True, f"User {regular_user_email} registered successfully")
    else:
        results.add_test("Register regular user", False, "Failed to register regular user")
        return results
    
    # 2. Register/Login admin user
    print("\n2. Setting up admin user...")
    admin_reg = register_user(admin_user_email, password, "Admin User", "AdminUser")
    if admin_reg:
        admin_token = admin_reg["access_token"]
        results.add_test("Setup admin user", True, f"Admin {admin_user_email} setup successfully")
    else:
        # Try to login if already exists
        admin_token = login_user(admin_user_email, password)
        if admin_token:
            results.add_test("Setup admin user", True, f"Admin {admin_user_email} logged in successfully")
        else:
            results.add_test("Setup admin user", False, "Failed to setup admin user")
            return results
    
    # 3. Test POST /api/stories - Submit story as regular user
    print("\n3. Testing story submission...")
    headers = {"Authorization": f"Bearer {regular_token}"}
    story_data = {
        "title": "My Amazing WayPledge Experience",
        "content": "This is a test story about how WayPledge helped me connect with amazing people in my community. The platform made it so easy to find help when I needed it most, and I was able to give back by offering my own skills to others. It's truly a wonderful way to build stronger communities through mutual support and kindness."
    }
    
    response = make_request("POST", "/stories", headers=headers, data=story_data)
    if response and response.status_code == 200:
        story_data_response = response.json()
        story_id = story_data_response["id"]
        if story_data_response["status"] == "pending":
            results.add_test("Submit story", True, f"Story submitted with ID {story_id}, status: pending")
        else:
            results.add_test("Submit story", False, f"Story status should be 'pending', got: {story_data_response['status']}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        results.add_test("Submit story", False, f"Failed to submit story: {error_msg}")
    
    # 4. Test validation - story too short
    print("\n4. Testing story validation...")
    short_story = {"title": "Hi", "content": "Short"}
    response = make_request("POST", "/stories", headers=headers, data=short_story)
    if response and response.status_code == 400:
        results.add_test("Story validation (too short)", True, "Correctly rejected short story")
    else:
        results.add_test("Story validation (too short)", False, "Should reject stories that are too short")
    
    # 5. Test GET /api/stories - Public stories (should be empty initially)
    print("\n5. Testing public stories endpoint...")
    response = make_request("GET", "/stories")
    if response and response.status_code == 200:
        stories = response.json()
        # Should not contain our pending story
        pending_story_found = any(s["id"] == story_id for s in stories if story_id)
        if not pending_story_found:
            results.add_test("Get public stories (pending not visible)", True, "Pending story correctly not visible in public list")
        else:
            results.add_test("Get public stories (pending not visible)", False, "Pending story should not be visible in public list")
    else:
        results.add_test("Get public stories (pending not visible)", False, "Failed to get public stories")
    
    # 6. Test GET /api/stories/mine - User's own stories
    print("\n6. Testing user's own stories...")
    response = make_request("GET", "/stories/mine", headers=headers)
    if response and response.status_code == 200:
        my_stories = response.json()
        my_story_found = any(s["id"] == story_id for s in my_stories if story_id)
        if my_story_found:
            results.add_test("Get my stories", True, "User can see their own pending story")
        else:
            results.add_test("Get my stories", False, "User should be able to see their own pending story")
    else:
        results.add_test("Get my stories", False, "Failed to get user's own stories")
    
    # 7. Test GET /api/admin/stories/pending - Admin view pending stories
    print("\n7. Testing admin pending stories...")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request("GET", "/admin/stories/pending", headers=admin_headers)
    if response and response.status_code == 200:
        pending_stories = response.json()
        admin_story_found = any(s["id"] == story_id for s in pending_stories if story_id)
        if admin_story_found:
            results.add_test("Admin get pending stories", True, "Admin can see pending stories")
        else:
            results.add_test("Admin get pending stories", False, "Admin should be able to see pending stories")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        results.add_test("Admin get pending stories", False, f"Failed to get pending stories: {error_msg}")
    
    # 8. Test non-admin access to pending stories
    print("\n8. Testing non-admin access restriction...")
    response = make_request("GET", "/admin/stories/pending", headers=headers)
    if response and response.status_code == 403:
        results.add_test("Non-admin access restriction", True, "Non-admin correctly blocked from pending stories")
    else:
        results.add_test("Non-admin access restriction", False, "Non-admin should be blocked from pending stories")
    
    # 9. Test POST /api/admin/stories/{id}/approve - Approve story
    print("\n9. Testing story approval...")
    if story_id:
        response = make_request("POST", f"/admin/stories/{story_id}/approve", headers=admin_headers)
        if response and response.status_code == 200:
            results.add_test("Approve story", True, "Story approved successfully")
            
            # Verify story now appears in public list
            time.sleep(1)  # Brief delay
            response = make_request("GET", "/stories")
            if response and response.status_code == 200:
                public_stories = response.json()
                approved_story_found = any(s["id"] == story_id and s["status"] == "approved" for s in public_stories)
                if approved_story_found:
                    results.add_test("Approved story in public list", True, "Approved story now visible in public list")
                else:
                    results.add_test("Approved story in public list", False, "Approved story should be visible in public list")
            else:
                results.add_test("Approved story in public list", False, "Failed to verify approved story in public list")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            results.add_test("Approve story", False, f"Failed to approve story: {error_msg}")
    else:
        results.add_test("Approve story", False, "No story ID available for approval test")
    
    # 10. Test story rejection workflow
    print("\n10. Testing story rejection...")
    # Submit another story to test rejection
    reject_story_data = {
        "title": "Another Test Story for Rejection",
        "content": "This is another test story that will be used to test the rejection workflow. It has enough content to pass validation but will be rejected by the admin to test that functionality."
    }
    
    response = make_request("POST", "/stories", headers=headers, data=reject_story_data)
    if response and response.status_code == 200:
        reject_story_id = response.json()["id"]
        
        # Reject the story
        response = make_request("POST", f"/admin/stories/{reject_story_id}/reject", headers=admin_headers)
        if response and response.status_code == 200:
            results.add_test("Reject story", True, "Story rejected successfully")
            
            # Verify rejected story doesn't appear in public list
            time.sleep(1)  # Brief delay
            response = make_request("GET", "/stories")
            if response and response.status_code == 200:
                public_stories = response.json()
                rejected_story_found = any(s["id"] == reject_story_id for s in public_stories)
                if not rejected_story_found:
                    results.add_test("Rejected story not in public list", True, "Rejected story correctly not visible in public list")
                else:
                    results.add_test("Rejected story not in public list", False, "Rejected story should not be visible in public list")
            else:
                results.add_test("Rejected story not in public list", False, "Failed to verify rejected story not in public list")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            results.add_test("Reject story", False, f"Failed to reject story: {error_msg}")
    else:
        results.add_test("Reject story", False, "Failed to submit story for rejection test")
    
    # 11. Test authentication requirements
    print("\n11. Testing authentication requirements...")
    # Test submitting story without auth
    response = make_request("POST", "/stories", data=story_data)
    if response and response.status_code == 403:
        results.add_test("Story submission requires auth", True, "Correctly requires authentication for story submission")
    else:
        results.add_test("Story submission requires auth", False, "Should require authentication for story submission")
    
    # Test getting my stories without auth
    response = make_request("GET", "/stories/mine")
    if response and response.status_code == 403:
        results.add_test("My stories requires auth", True, "Correctly requires authentication for my stories")
    else:
        results.add_test("My stories requires auth", False, "Should require authentication for my stories")
    
    # 12. Test admin-only endpoints with regular user
    print("\n12. Testing admin-only access...")
    if story_id:
        # Try to approve with regular user
        response = make_request("POST", f"/admin/stories/{story_id}/approve", headers=headers)
        if response and response.status_code == 403:
            results.add_test("Admin-only approve access", True, "Regular user correctly blocked from approving stories")
        else:
            results.add_test("Admin-only approve access", False, "Regular user should be blocked from approving stories")
        
        # Try to reject with regular user
        response = make_request("POST", f"/admin/stories/{story_id}/reject", headers=headers)
        if response and response.status_code == 403:
            results.add_test("Admin-only reject access", True, "Regular user correctly blocked from rejecting stories")
        else:
            results.add_test("Admin-only reject access", False, "Regular user should be blocked from rejecting stories")
    
    return results

if __name__ == "__main__":
    print("🚀 Starting Stories Endpoints Testing...")
    print(f"Backend URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = test_stories_endpoints()
    results.summary()
    
    # Save results to file
    with open("/app/stories_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "base_url": BASE_URL,
            "summary": {
                "total": results.passed + results.failed,
                "passed": results.passed,
                "failed": results.failed,
                "success_rate": (results.passed / (results.passed + results.failed) * 100) if (results.passed + results.failed) > 0 else 0
            },
            "tests": results.tests
        }, f, indent=2)
    
    print(f"\n📊 Detailed results saved to: /app/stories_test_results.json")