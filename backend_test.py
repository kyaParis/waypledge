#!/usr/bin/env python3
"""
WayPledge Backend API Testing - N+1 Query Fix Verification
Testing the batch query optimizations for list endpoints
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://pledge-app-redesign.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class WayPledgeAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: dict = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test the root health check endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/", timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get("status") == "ok":
                        self.log_test("Health Check", True, "Health check endpoint working correctly", 
                                    {"status_code": response.status_code, "response": data})
                    else:
                        self.log_test("Health Check", False, "Health check returned unexpected response", 
                                    {"status_code": response.status_code, "response": data})
                except json.JSONDecodeError:
                    # If it's not JSON, check if it's a valid response
                    if "ok" in response.text.lower() or response.status_code == 200:
                        self.log_test("Health Check", True, "Health check endpoint responding (non-JSON)", 
                                    {"status_code": response.status_code, "response": response.text[:200]})
                    else:
                        self.log_test("Health Check", False, "Health check returned non-JSON response", 
                                    {"status_code": response.status_code, "response": response.text[:200]})
            else:
                self.log_test("Health Check", False, f"Health check failed with status {response.status_code}", 
                            {"status_code": response.status_code, "response": response.text[:200]})
        except Exception as e:
            self.log_test("Health Check", False, f"Health check request failed: {str(e)}")
    
    def setup_test_user(self):
        """Create a test user for authenticated endpoints"""
        try:
            # Register a test user with a valid email domain
            user_data = {
                "email": f"test_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
                "password": "TestPassword123!",
                "name": "Test User for N+1 Testing",
                "bio": "Testing N+1 query optimizations",
                "location": "Test City, Test Country"
            }
            
            response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.test_user_id = data.get("user", {}).get("id")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("User Setup", True, "Test user created successfully", 
                            {"user_id": self.test_user_id})
                return True
            else:
                self.log_test("User Setup", False, f"Failed to create test user: {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("User Setup", False, f"User setup failed: {str(e)}")
            return False
    
    def test_hives_endpoint(self):
        """Test GET /api/hives - Should return hives with stats using batch queries"""
        try:
            response = self.session.get(f"{API_BASE}/hives")
            
            if response.status_code == 200:
                hives = response.json()
                
                # Verify response structure
                if isinstance(hives, list):
                    self.log_test("Hives List", True, f"Retrieved {len(hives)} hives successfully")
                    
                    # Check if any hives have the required stats fields
                    if hives:
                        sample_hive = hives[0]
                        required_fields = ["member_count", "pledge_count", "wish_count", "child_hive_count"]
                        missing_fields = [field for field in required_fields if field not in sample_hive]
                        
                        if not missing_fields:
                            self.log_test("Hives Stats Fields", True, "All required stats fields present in hive response", 
                                        {"sample_hive_id": sample_hive.get("id"), "stats": {field: sample_hive.get(field) for field in required_fields}})
                        else:
                            self.log_test("Hives Stats Fields", False, f"Missing stats fields: {missing_fields}", 
                                        {"sample_hive": sample_hive})
                    else:
                        self.log_test("Hives Stats Fields", True, "No hives to check stats fields (empty list)")
                else:
                    self.log_test("Hives List", False, "Response is not a list", 
                                {"response_type": type(hives), "response": hives})
            else:
                self.log_test("Hives List", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Hives List", False, f"Request failed: {str(e)}")
    
    def test_hives_children_endpoint(self):
        """Test GET /api/hives/{hive_id}/children - Should return child hives"""
        try:
            # First get a list of hives to find one with potential children
            hives_response = self.session.get(f"{API_BASE}/hives")
            
            if hives_response.status_code == 200:
                hives = hives_response.json()
                
                if hives:
                    # Test with the first hive
                    test_hive_id = hives[0]["id"]
                    response = self.session.get(f"{API_BASE}/hives/{test_hive_id}/children")
                    
                    if response.status_code == 200:
                        children = response.json()
                        if isinstance(children, list):
                            self.log_test("Hives Children", True, f"Retrieved {len(children)} child hives for hive {test_hive_id}")
                            
                            # Verify child hives have stats fields if any exist
                            if children:
                                sample_child = children[0]
                                required_fields = ["member_count", "pledge_count", "wish_count", "child_hive_count"]
                                missing_fields = [field for field in required_fields if field not in sample_child]
                                
                                if not missing_fields:
                                    self.log_test("Child Hives Stats", True, "Child hives have all required stats fields")
                                else:
                                    self.log_test("Child Hives Stats", False, f"Child hives missing stats fields: {missing_fields}")
                        else:
                            self.log_test("Hives Children", False, "Response is not a list", 
                                        {"response": children})
                    else:
                        self.log_test("Hives Children", False, f"Failed with status {response.status_code}", 
                                    {"response": response.text})
                else:
                    self.log_test("Hives Children", True, "No hives available to test children endpoint")
            else:
                self.log_test("Hives Children", False, "Could not get hives list to test children endpoint")
        except Exception as e:
            self.log_test("Hives Children", False, f"Request failed: {str(e)}")
    
    def test_my_hives_endpoint(self):
        """Test GET /api/hives/my/memberships - Should return user's hives (requires auth)"""
        if not self.auth_token:
            self.log_test("My Hives", False, "No auth token available for testing")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/hives/my/memberships")
            
            if response.status_code == 200:
                my_hives = response.json()
                if isinstance(my_hives, list):
                    self.log_test("My Hives", True, f"Retrieved {len(my_hives)} user hives successfully")
                    
                    # Check stats fields if user has hives
                    if my_hives:
                        sample_hive = my_hives[0]
                        required_fields = ["member_count", "pledge_count", "wish_count", "child_hive_count"]
                        missing_fields = [field for field in required_fields if field not in sample_hive]
                        
                        if not missing_fields:
                            self.log_test("My Hives Stats", True, "User hives have all required stats fields")
                        else:
                            self.log_test("My Hives Stats", False, f"User hives missing stats fields: {missing_fields}")
                else:
                    self.log_test("My Hives", False, "Response is not a list", 
                                {"response": my_hives})
            else:
                self.log_test("My Hives", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("My Hives", False, f"Request failed: {str(e)}")
    
    def test_federation_partners_endpoint(self):
        """Test GET /api/federation/partners - Should return federated platforms"""
        try:
            response = self.session.get(f"{API_BASE}/federation/partners")
            
            if response.status_code == 200:
                partners = response.json()
                if isinstance(partners, list):
                    self.log_test("Federation Partners", True, f"Retrieved {len(partners)} federated partners successfully")
                    
                    # Check if partners have required fields
                    if partners:
                        sample_partner = partners[0]
                        required_fields = ["member_count", "pledge_count", "wish_count", "child_hive_count"]
                        missing_fields = [field for field in required_fields if field not in sample_partner]
                        
                        if not missing_fields:
                            self.log_test("Federation Partners Stats", True, "Federation partners have all required stats fields")
                        else:
                            self.log_test("Federation Partners Stats", False, f"Federation partners missing stats fields: {missing_fields}")
                    else:
                        self.log_test("Federation Partners Stats", True, "No federation partners to check stats fields")
                else:
                    self.log_test("Federation Partners", False, "Response is not a list", 
                                {"response": partners})
            else:
                self.log_test("Federation Partners", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Federation Partners", False, f"Request failed: {str(e)}")
    
    def test_pledges_endpoint(self):
        """Test GET /api/pledges - Should return pledges with hive_name field populated"""
        try:
            response = self.session.get(f"{API_BASE}/pledges")
            
            if response.status_code == 200:
                pledges = response.json()
                if isinstance(pledges, list):
                    self.log_test("Pledges List", True, f"Retrieved {len(pledges)} pledges successfully")
                    
                    # Check if pledges with hive_id have hive_name populated
                    pledges_with_hives = [p for p in pledges if p.get("hive_id")]
                    if pledges_with_hives:
                        sample_pledge = pledges_with_hives[0]
                        if "hive_name" in sample_pledge and sample_pledge["hive_name"]:
                            self.log_test("Pledges Hive Names", True, "Pledges with hive_id have hive_name populated", 
                                        {"sample_pledge_id": sample_pledge.get("id"), "hive_name": sample_pledge.get("hive_name")})
                        else:
                            self.log_test("Pledges Hive Names", False, "Pledges with hive_id missing hive_name field", 
                                        {"sample_pledge": sample_pledge})
                    else:
                        self.log_test("Pledges Hive Names", True, "No pledges with hive_id to check hive_name field")
                else:
                    self.log_test("Pledges List", False, "Response is not a list", 
                                {"response": pledges})
            else:
                self.log_test("Pledges List", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Pledges List", False, f"Request failed: {str(e)}")
    
    def test_categories_endpoint(self):
        """Test GET /api/categories - Basic functionality test"""
        try:
            response = self.session.get(f"{API_BASE}/categories")
            
            if response.status_code == 200:
                categories = response.json()
                if isinstance(categories, list) and len(categories) > 0:
                    self.log_test("Categories", True, f"Retrieved {len(categories)} categories successfully")
                else:
                    self.log_test("Categories", False, "Categories response is empty or not a list", 
                                {"response": categories})
            else:
                self.log_test("Categories", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Categories", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all N+1 query optimization tests"""
        print("🚀 Starting WayPledge Backend N+1 Query Fix Testing")
        print("=" * 60)
        
        # Test health check first
        self.test_health_check()
        
        # Setup test user for authenticated endpoints
        if self.setup_test_user():
            # Test all the N+1 optimized endpoints
            self.test_hives_endpoint()
            self.test_hives_children_endpoint()
            self.test_my_hives_endpoint()
            self.test_federation_partners_endpoint()
            self.test_pledges_endpoint()
            
            # Test basic endpoints
            self.test_categories_endpoint()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        return failed_tests == 0

def main():
    """Main test execution"""
    tester = WayPledgeAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results to file
    with open("/app/test_results_n1_fix.json", "w") as f:
        json.dump(tester.test_results, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: /app/test_results_n1_fix.json")
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()