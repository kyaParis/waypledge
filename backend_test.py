#!/usr/bin/env python3
"""
WayPledge Backend API Test Suite
Tests all backend endpoints for the WayPledge application
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://pledge-app-redesign.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class WayPledgeAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.user1_token = None
        self.user2_token = None
        self.user1_id = None
        self.user2_id = None
        self.user1_email = None
        self.user2_email = None
        self.pledge_id = None
        self.wish_id = None
        self.connection_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, auth_token: str = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}", 400
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, str(e), 0
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("🔐 Testing User Registration & Authentication...")
        
        # Generate unique emails for this test run
        import time
        timestamp = str(int(time.time()))
        
        # Test User 1 Registration
        user1_data = {
            "email": f"alice{timestamp}@waypledge.com",
            "password": "securepass123",
            "name": "Alice Johnson",
            "bio": "Community helper and teacher",
            "location": "San Francisco, CA"
        }
        
        self.user1_email = user1_data["email"]
        
        success, response, status_code = self.make_request("POST", "/auth/register", user1_data)
        
        if success and "access_token" in response:
            self.user1_token = response["access_token"]
            self.user1_id = response["user"]["id"]
            self.log_test("User 1 Registration", True, f"User ID: {self.user1_id}")
        else:
            self.log_test("User 1 Registration", False, f"Status: {status_code}", response)
            return False
        
        # Test User 2 Registration
        user2_data = {
            "email": f"bob{timestamp}@waypledge.com",
            "password": "securepass456",
            "name": "Bob Smith",
            "bio": "Gardening enthusiast",
            "location": "Oakland, CA"
        }
        
        self.user2_email = user2_data["email"]
        
        success, response, status_code = self.make_request("POST", "/auth/register", user2_data)
        
        if success and "access_token" in response:
            self.user2_token = response["access_token"]
            self.user2_id = response["user"]["id"]
            self.log_test("User 2 Registration", True, f"User ID: {self.user2_id}")
        else:
            self.log_test("User 2 Registration", False, f"Status: {status_code}", response)
            return False
        
        return True
    
    def test_user_login(self):
        """Test user login endpoint"""
        login_data = {
            "email": self.user1_email,
            "password": "securepass123"
        }
        
        success, response, status_code = self.make_request("POST", "/auth/login", login_data)
        
        if success and "access_token" in response:
            self.log_test("User Login", True, "Login successful")
            return True
        else:
            self.log_test("User Login", False, f"Status: {status_code}", response)
            return False
    
    def test_get_current_user(self):
        """Test get current user endpoint"""
        success, response, status_code = self.make_request("GET", "/auth/me", auth_token=self.user1_token)
        
        if success and "id" in response and response["id"] == self.user1_id:
            self.log_test("Get Current User", True, f"Retrieved user: {response['name']}")
            return True
        else:
            self.log_test("Get Current User", False, f"Status: {status_code}", response)
            return False
    
    def test_categories(self):
        """Test categories endpoint"""
        print("📂 Testing Categories...")
        
        success, response, status_code = self.make_request("GET", "/categories")
        
        if success and isinstance(response, list) and len(response) > 0:
            categories = [cat["name"] for cat in response]
            self.log_test("Get Categories", True, f"Found {len(categories)} categories: {', '.join(categories[:3])}...")
            return True
        else:
            self.log_test("Get Categories", False, f"Status: {status_code}", response)
            return False
    
    def test_pledges(self):
        """Test pledge endpoints"""
        print("🤝 Testing Pledges...")
        
        # Create a pledge
        pledge_data = {
            "title": "Offering coding lessons",
            "description": "I can teach Python and JavaScript to beginners and intermediate learners",
            "category": "Skills & Knowledge",
            "tags": ["coding", "education", "python", "javascript"]
        }
        
        success, response, status_code = self.make_request("POST", "/pledges", pledge_data, self.user1_token)
        
        if success and "id" in response:
            self.pledge_id = response["id"]
            self.log_test("Create Pledge", True, f"Pledge ID: {self.pledge_id}")
        else:
            self.log_test("Create Pledge", False, f"Status: {status_code}", response)
            return False
        
        # Get all pledges
        success, response, status_code = self.make_request("GET", "/pledges")
        
        if success and isinstance(response, list):
            pledge_found = any(p["id"] == self.pledge_id for p in response)
            self.log_test("Get All Pledges", pledge_found, f"Found {len(response)} pledges, our pledge included: {pledge_found}")
        else:
            self.log_test("Get All Pledges", False, f"Status: {status_code}", response)
            return False
        
        # Get my pledges
        success, response, status_code = self.make_request("GET", "/pledges/mine", auth_token=self.user1_token)
        
        if success and isinstance(response, list):
            my_pledge_found = any(p["id"] == self.pledge_id for p in response)
            self.log_test("Get My Pledges", my_pledge_found, f"Found {len(response)} my pledges")
        else:
            self.log_test("Get My Pledges", False, f"Status: {status_code}", response)
            return False
        
        return True
    
    def test_wishes(self):
        """Test wish endpoints"""
        print("🌟 Testing Wishes...")
        
        # Create a wish
        wish_data = {
            "title": "Need gardening help",
            "description": "Looking for someone to help with garden maintenance and plant care",
            "category": "Services",
            "tags": ["gardening", "outdoor", "plants"]
        }
        
        success, response, status_code = self.make_request("POST", "/wishes", wish_data, self.user2_token)
        
        if success and "id" in response:
            self.wish_id = response["id"]
            self.log_test("Create Wish", True, f"Wish ID: {self.wish_id}")
        else:
            self.log_test("Create Wish", False, f"Status: {status_code}", response)
            return False
        
        # Get all wishes
        success, response, status_code = self.make_request("GET", "/wishes")
        
        if success and isinstance(response, list):
            wish_found = any(w["id"] == self.wish_id for w in response)
            self.log_test("Get All Wishes", wish_found, f"Found {len(response)} wishes, our wish included: {wish_found}")
        else:
            self.log_test("Get All Wishes", False, f"Status: {status_code}", response)
            return False
        
        # Get my wishes
        success, response, status_code = self.make_request("GET", "/wishes/mine", auth_token=self.user2_token)
        
        if success and isinstance(response, list):
            my_wish_found = any(w["id"] == self.wish_id for w in response)
            self.log_test("Get My Wishes", my_wish_found, f"Found {len(response)} my wishes")
        else:
            self.log_test("Get My Wishes", False, f"Status: {status_code}", response)
            return False
        
        return True
    
    def test_search_and_filter(self):
        """Test search and filter functionality"""
        print("🔍 Testing Search & Filter...")
        
        # Test category filter for pledges (URL encode the & character)
        success, response, status_code = self.make_request("GET", "/pledges?category=Skills%20%26%20Knowledge")
        
        if success and isinstance(response, list):
            skills_pledges = [p for p in response if p["category"] == "Skills & Knowledge"]
            self.log_test("Filter Pledges by Category", len(skills_pledges) > 0, f"Found {len(skills_pledges)} Skills & Knowledge pledges")
        else:
            self.log_test("Filter Pledges by Category", False, f"Status: {status_code}", response)
        
        # Test search for wishes
        success, response, status_code = self.make_request("GET", "/wishes?search=garden")
        
        if success and isinstance(response, list):
            garden_wishes = [w for w in response if "garden" in w["title"].lower() or "garden" in w["description"].lower()]
            self.log_test("Search Wishes", len(garden_wishes) > 0, f"Found {len(garden_wishes)} wishes matching 'garden'")
        else:
            self.log_test("Search Wishes", False, f"Status: {status_code}", response)
        
        return True
    
    def test_connections(self):
        """Test connection endpoints"""
        print("🔗 Testing Connections...")
        
        # Create a connection (User 2 connects to User 1's pledge)
        connection_data = {
            "pledge_id": self.pledge_id,
            "receiver_id": self.user1_id,
            "message": "Hi! I'm interested in learning Python. Could you help me get started?"
        }
        
        success, response, status_code = self.make_request("POST", "/connections", connection_data, self.user2_token)
        
        if success and "id" in response:
            self.connection_id = response["id"]
            self.log_test("Create Connection", True, f"Connection ID: {self.connection_id}")
        else:
            self.log_test("Create Connection", False, f"Status: {status_code}", response)
            return False
        
        # Get connections for User 1
        success, response, status_code = self.make_request("GET", "/connections", auth_token=self.user1_token)
        
        if success and isinstance(response, list):
            connection_found = any(c["id"] == self.connection_id for c in response)
            self.log_test("Get Connections (User 1)", connection_found, f"Found {len(response)} connections")
        else:
            self.log_test("Get Connections (User 1)", False, f"Status: {status_code}", response)
        
        # Get connections for User 2
        success, response, status_code = self.make_request("GET", "/connections", auth_token=self.user2_token)
        
        if success and isinstance(response, list):
            connection_found = any(c["id"] == self.connection_id for c in response)
            self.log_test("Get Connections (User 2)", connection_found, f"Found {len(response)} connections")
        else:
            self.log_test("Get Connections (User 2)", False, f"Status: {status_code}", response)
        
        return True
    
    def test_messages(self):
        """Test message endpoints"""
        print("💬 Testing Messages...")
        
        if not self.connection_id:
            self.log_test("Messages Test", False, "No connection ID available")
            return False
        
        # Send a message (User 1 replies)
        message_data = {
            "connection_id": self.connection_id,
            "content": "Hi! I'd be happy to help you learn Python. When would be a good time to start?"
        }
        
        success, response, status_code = self.make_request("POST", "/messages", message_data, self.user1_token)
        
        if success and "id" in response:
            self.log_test("Send Message", True, f"Message sent successfully")
        else:
            self.log_test("Send Message", False, f"Status: {status_code}", response)
            return False
        
        # Get messages for the connection
        success, response, status_code = self.make_request("GET", f"/messages/{self.connection_id}", auth_token=self.user1_token)
        
        if success and isinstance(response, list) and len(response) >= 2:
            self.log_test("Get Messages", True, f"Retrieved {len(response)} messages")
        else:
            self.log_test("Get Messages", False, f"Status: {status_code}, Messages: {len(response) if isinstance(response, list) else 0}", response)
        
        return True
    
    def test_gratitude(self):
        """Test gratitude endpoints"""
        print("🙏 Testing Gratitude...")
        
        # Create gratitude (User 2 thanks User 1)
        gratitude_data = {
            "to_user_id": self.user1_id,
            "connection_id": self.connection_id,
            "message": "Thank you so much for offering to teach Python! Your willingness to share knowledge is amazing."
        }
        
        success, response, status_code = self.make_request("POST", "/gratitude", gratitude_data, self.user2_token)
        
        if success and "id" in response:
            gratitude_id = response["id"]
            self.log_test("Create Gratitude", True, f"Gratitude ID: {gratitude_id}")
        else:
            self.log_test("Create Gratitude", False, f"Status: {status_code}", response)
            return False
        
        # Get gratitude wall
        success, response, status_code = self.make_request("GET", "/gratitude/wall")
        
        if success and isinstance(response, list):
            our_gratitude = any(g.get("to_user_id") == self.user1_id for g in response)
            self.log_test("Get Gratitude Wall", our_gratitude, f"Found {len(response)} gratitude messages")
        else:
            self.log_test("Get Gratitude Wall", False, f"Status: {status_code}", response)
        
        # Get my received gratitude (User 1)
        success, response, status_code = self.make_request("GET", "/gratitude/mine", auth_token=self.user1_token)
        
        if success and isinstance(response, list):
            received_gratitude = any(g.get("from_user_id") == self.user2_id for g in response)
            self.log_test("Get My Gratitude", received_gratitude, f"User 1 received {len(response)} gratitude messages")
        else:
            self.log_test("Get My Gratitude", False, f"Status: {status_code}", response)
        
        return True
    
    def test_user_profile(self):
        """Test user profile endpoint"""
        print("👤 Testing User Profile...")
        
        success, response, status_code = self.make_request("GET", f"/users/{self.user1_id}")
        
        if success and "id" in response and response["id"] == self.user1_id:
            self.log_test("Get User Profile", True, f"Retrieved profile for: {response['name']}")
            return True
        else:
            self.log_test("Get User Profile", False, f"Status: {status_code}", response)
            return False
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting WayPledge Backend API Tests")
        print("=" * 50)
        
        # Test sequence
        tests = [
            self.test_user_registration,
            self.test_user_login,
            self.test_get_current_user,
            self.test_categories,
            self.test_pledges,
            self.test_wishes,
            self.test_search_and_filter,
            self.test_connections,
            self.test_messages,
            self.test_gratitude,
            self.test_user_profile
        ]
        
        passed = 0
        total = 0
        
        for test_func in tests:
            try:
                result = test_func()
                if result:
                    passed += 1
                total += 1
            except Exception as e:
                print(f"❌ FAIL {test_func.__name__}: Exception occurred - {str(e)}")
                total += 1
        
        print("=" * 50)
        print(f"🏁 Test Summary: {passed}/{total} test groups passed")
        
        # Count individual test results
        individual_passed = sum(1 for result in self.test_results if result["success"])
        individual_total = len(self.test_results)
        print(f"📊 Individual Tests: {individual_passed}/{individual_total} passed")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return passed, total, individual_passed, individual_total

def main():
    """Main test execution"""
    tester = WayPledgeAPITester()
    
    try:
        passed, total, individual_passed, individual_total = tester.run_all_tests()
        
        # Exit with appropriate code
        if passed == total and individual_passed == individual_total:
            print("\n✅ All tests passed!")
            sys.exit(0)
        else:
            print(f"\n⚠️  Some tests failed. {passed}/{total} test groups passed, {individual_passed}/{individual_total} individual tests passed")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()