#!/usr/bin/env python3
"""
Comprehensive N+1 Query Fix Testing with Test Data Creation
This test creates test data to properly verify the batch query optimizations
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://pledge-app-redesign.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class ComprehensiveN1Tester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_id = None
        self.test_results = []
        self.created_hive_id = None
        self.created_pledge_id = None
        
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
    
    def setup_test_user(self):
        """Create a test user for authenticated endpoints"""
        try:
            user_data = {
                "email": f"n1_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
                "password": "TestPassword123!",
                "name": "N+1 Test User",
                "bio": "Testing N+1 query optimizations with real data",
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
    
    def create_test_hive(self):
        """Create a test hive to test hive-related functionality"""
        try:
            hive_data = {
                "name": f"N+1 Test Hive {datetime.now().strftime('%H%M%S')}",
                "description": "A test hive for verifying N+1 query optimizations",
                "location": "Test City, Test Country",
                "vision": "Testing batch queries for better performance"
            }
            
            response = self.session.post(f"{API_BASE}/hives", json=hive_data, params={"force": True})
            
            if response.status_code == 200:
                data = response.json()
                self.created_hive_id = data.get("id")
                self.log_test("Test Hive Creation", True, f"Created test hive: {self.created_hive_id}")
                return True
            else:
                self.log_test("Test Hive Creation", False, f"Failed to create test hive: {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("Test Hive Creation", False, f"Test hive creation failed: {str(e)}")
            return False
    
    def create_test_pledge_with_hive(self):
        """Create a test pledge associated with the test hive"""
        if not self.created_hive_id:
            self.log_test("Test Pledge Creation", False, "No test hive available for pledge creation")
            return False
        
        try:
            pledge_data = {
                "title": "N+1 Test Pledge",
                "description": "A test pledge to verify hive_name population in batch queries",
                "category": "Other",
                "tags": ["testing", "n+1", "optimization"],
                "location": "Test City",
                "hive_id": self.created_hive_id
            }
            
            response = self.session.post(f"{API_BASE}/pledges", json=pledge_data)
            
            if response.status_code == 200:
                data = response.json()
                self.created_pledge_id = data.get("id")
                hive_name = data.get("hive_name")
                self.log_test("Test Pledge Creation", True, f"Created test pledge with hive association", 
                            {"pledge_id": self.created_pledge_id, "hive_name": hive_name})
                return True
            else:
                self.log_test("Test Pledge Creation", False, f"Failed to create test pledge: {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("Test Pledge Creation", False, f"Test pledge creation failed: {str(e)}")
            return False
    
    def test_hives_with_stats(self):
        """Test GET /api/hives with comprehensive stats verification"""
        try:
            response = self.session.get(f"{API_BASE}/hives")
            
            if response.status_code == 200:
                hives = response.json()
                
                if isinstance(hives, list):
                    self.log_test("Hives Endpoint", True, f"Retrieved {len(hives)} hives successfully")
                    
                    # Find our test hive and verify its stats
                    test_hive = None
                    for hive in hives:
                        if hive.get("id") == self.created_hive_id:
                            test_hive = hive
                            break
                    
                    if test_hive:
                        required_fields = ["member_count", "pledge_count", "wish_count", "child_hive_count"]
                        missing_fields = [field for field in required_fields if field not in test_hive]
                        
                        if not missing_fields:
                            # Verify the stats are correct (should have 1 member and 1 pledge)
                            expected_stats = {
                                "member_count": 1,  # The founder
                                "pledge_count": 1 if self.created_pledge_id else 0,  # Our test pledge
                                "wish_count": 0,
                                "child_hive_count": 0
                            }
                            
                            actual_stats = {field: test_hive.get(field) for field in required_fields}
                            
                            if actual_stats == expected_stats:
                                self.log_test("Hive Stats Accuracy", True, "Test hive stats are accurate", 
                                            {"expected": expected_stats, "actual": actual_stats})
                            else:
                                self.log_test("Hive Stats Accuracy", False, "Test hive stats don't match expected values", 
                                            {"expected": expected_stats, "actual": actual_stats})
                        else:
                            self.log_test("Hive Stats Fields", False, f"Missing stats fields: {missing_fields}")
                    else:
                        self.log_test("Test Hive Verification", False, "Could not find test hive in response")
                else:
                    self.log_test("Hives Endpoint", False, "Response is not a list")
            else:
                self.log_test("Hives Endpoint", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Hives Endpoint", False, f"Request failed: {str(e)}")
    
    def test_pledges_with_hive_names(self):
        """Test GET /api/pledges with hive_name population verification"""
        try:
            response = self.session.get(f"{API_BASE}/pledges")
            
            if response.status_code == 200:
                pledges = response.json()
                
                if isinstance(pledges, list):
                    self.log_test("Pledges Endpoint", True, f"Retrieved {len(pledges)} pledges successfully")
                    
                    # Find our test pledge and verify hive_name is populated
                    test_pledge = None
                    for pledge in pledges:
                        if pledge.get("id") == self.created_pledge_id:
                            test_pledge = pledge
                            break
                    
                    if test_pledge:
                        hive_id = test_pledge.get("hive_id")
                        hive_name = test_pledge.get("hive_name")
                        
                        if hive_id and hive_name:
                            self.log_test("Pledge Hive Name Population", True, "Test pledge has hive_name populated correctly", 
                                        {"pledge_id": self.created_pledge_id, "hive_id": hive_id, "hive_name": hive_name})
                        elif hive_id and not hive_name:
                            self.log_test("Pledge Hive Name Population", False, "Test pledge has hive_id but missing hive_name", 
                                        {"pledge_id": self.created_pledge_id, "hive_id": hive_id})
                        else:
                            self.log_test("Pledge Hive Name Population", True, "Test pledge has no hive association (as expected)")
                    else:
                        self.log_test("Test Pledge Verification", False, "Could not find test pledge in response")
                        
                    # Check all pledges with hive_id have hive_name
                    pledges_with_hives = [p for p in pledges if p.get("hive_id")]
                    if pledges_with_hives:
                        missing_hive_names = [p for p in pledges_with_hives if not p.get("hive_name")]
                        if not missing_hive_names:
                            self.log_test("All Pledges Hive Names", True, f"All {len(pledges_with_hives)} pledges with hive_id have hive_name populated")
                        else:
                            self.log_test("All Pledges Hive Names", False, f"{len(missing_hive_names)} pledges missing hive_name", 
                                        {"missing_count": len(missing_hive_names)})
                    else:
                        self.log_test("All Pledges Hive Names", True, "No pledges with hive associations to check")
                else:
                    self.log_test("Pledges Endpoint", False, "Response is not a list")
            else:
                self.log_test("Pledges Endpoint", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Pledges Endpoint", False, f"Request failed: {str(e)}")
    
    def test_my_hives_membership(self):
        """Test GET /api/hives/my/memberships with batch query verification"""
        try:
            response = self.session.get(f"{API_BASE}/hives/my/memberships")
            
            if response.status_code == 200:
                my_hives = response.json()
                
                if isinstance(my_hives, list):
                    self.log_test("My Hives Endpoint", True, f"Retrieved {len(my_hives)} user hives successfully")
                    
                    # Should include our test hive
                    test_hive_found = any(hive.get("id") == self.created_hive_id for hive in my_hives)
                    
                    if test_hive_found:
                        self.log_test("My Hives Content", True, "Test hive found in user's memberships")
                        
                        # Verify stats fields are present
                        if my_hives:
                            sample_hive = my_hives[0]
                            required_fields = ["member_count", "pledge_count", "wish_count", "child_hive_count"]
                            missing_fields = [field for field in required_fields if field not in sample_hive]
                            
                            if not missing_fields:
                                self.log_test("My Hives Stats", True, "User hives have all required stats fields")
                            else:
                                self.log_test("My Hives Stats", False, f"User hives missing stats fields: {missing_fields}")
                    else:
                        self.log_test("My Hives Content", False, "Test hive not found in user's memberships")
                else:
                    self.log_test("My Hives Endpoint", False, "Response is not a list")
            else:
                self.log_test("My Hives Endpoint", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("My Hives Endpoint", False, f"Request failed: {str(e)}")
    
    def test_hive_children_endpoint(self):
        """Test GET /api/hives/{hive_id}/children with batch queries"""
        if not self.created_hive_id:
            self.log_test("Hive Children Test", False, "No test hive available")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/hives/{self.created_hive_id}/children")
            
            if response.status_code == 200:
                children = response.json()
                
                if isinstance(children, list):
                    self.log_test("Hive Children Endpoint", True, f"Retrieved {len(children)} child hives successfully")
                    
                    # Verify structure even if empty
                    if children:
                        sample_child = children[0]
                        required_fields = ["member_count", "pledge_count", "wish_count", "child_hive_count"]
                        missing_fields = [field for field in required_fields if field not in sample_child]
                        
                        if not missing_fields:
                            self.log_test("Child Hives Stats", True, "Child hives have all required stats fields")
                        else:
                            self.log_test("Child Hives Stats", False, f"Child hives missing stats fields: {missing_fields}")
                    else:
                        self.log_test("Child Hives Stats", True, "No child hives to verify (expected for new hive)")
                else:
                    self.log_test("Hive Children Endpoint", False, "Response is not a list")
            else:
                self.log_test("Hive Children Endpoint", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Hive Children Endpoint", False, f"Request failed: {str(e)}")
    
    def test_federation_partners(self):
        """Test GET /api/federation/partners endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/federation/partners")
            
            if response.status_code == 200:
                partners = response.json()
                
                if isinstance(partners, list):
                    self.log_test("Federation Partners", True, f"Retrieved {len(partners)} federated partners successfully")
                    
                    if partners:
                        sample_partner = partners[0]
                        required_fields = ["member_count", "pledge_count", "wish_count", "child_hive_count"]
                        missing_fields = [field for field in required_fields if field not in sample_partner]
                        
                        if not missing_fields:
                            self.log_test("Federation Partners Stats", True, "Federation partners have all required stats fields")
                        else:
                            self.log_test("Federation Partners Stats", False, f"Federation partners missing stats fields: {missing_fields}")
                    else:
                        self.log_test("Federation Partners Stats", True, "No federation partners to verify")
                else:
                    self.log_test("Federation Partners", False, "Response is not a list")
            else:
                self.log_test("Federation Partners", False, f"Failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Federation Partners", False, f"Request failed: {str(e)}")
    
    def run_comprehensive_tests(self):
        """Run comprehensive N+1 query optimization tests with real data"""
        print("🚀 Starting Comprehensive N+1 Query Fix Testing")
        print("=" * 60)
        
        # Setup test environment
        if not self.setup_test_user():
            return False
        
        # Create test data
        self.create_test_hive()
        self.create_test_pledge_with_hive()
        
        # Test all endpoints with real data
        self.test_hives_with_stats()
        self.test_pledges_with_hive_names()
        self.test_my_hives_membership()
        self.test_hive_children_endpoint()
        self.test_federation_partners()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST SUMMARY")
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
    tester = ComprehensiveN1Tester()
    success = tester.run_comprehensive_tests()
    
    # Save detailed results
    with open("/app/comprehensive_n1_results.json", "w") as f:
        json.dump(tester.test_results, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: /app/comprehensive_n1_results.json")
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()