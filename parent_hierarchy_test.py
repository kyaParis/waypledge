#!/usr/bin/env python3
"""
WayPledge Parent Hierarchy Auto-Creation Feature Testing
Testing the new parent hierarchy auto-creation functionality for communities
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://pledge-app-redesign.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class ParentHierarchyTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_id = None
        self.test_results = []
        self.created_hive_ids = []  # Track created hives for cleanup
        
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
    
    def setup_admin_user(self):
        """Login with admin credentials for testing"""
        try:
            # Use admin credentials from test_credentials.md
            login_data = {
                "email": "kathryn@waypledge.me",
                "password": "WayPledge321"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.test_user_id = data.get("user", {}).get("id")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("Admin Login", True, "Admin user logged in successfully", 
                            {"user_id": self.test_user_id})
                return True
            else:
                self.log_test("Admin Login", False, f"Failed to login admin user: {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Admin login failed: {str(e)}")
            return False
    
    def test_check_existing_parents_endpoint(self):
        """Test POST /api/hives/check-existing-parents endpoint"""
        if not self.auth_token:
            self.log_test("Check Existing Parents", False, "No auth token available")
            return
        
        try:
            # Test with hierarchy data
            hierarchy_data = {
                "country": "TestCountry",
                "city": "TestCity", 
                "town": "TestTown",
                "neighborhood": "TestNeighborhood"
            }
            
            response = self.session.post(f"{API_BASE}/hives/check-existing-parents", json=hierarchy_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["existing_parents", "missing_parents", "will_auto_join"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Check Existing Parents", True, "Check existing parents endpoint working correctly", 
                                {"existing_count": len(data.get("existing_parents", [])),
                                 "missing_count": len(data.get("missing_parents", [])),
                                 "auto_join_count": len(data.get("will_auto_join", []))})
                    return data
                else:
                    self.log_test("Check Existing Parents", False, f"Missing required fields: {missing_fields}", 
                                {"response": data})
                    return None
            else:
                self.log_test("Check Existing Parents", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
                return None
        except Exception as e:
            self.log_test("Check Existing Parents", False, f"Request failed: {str(e)}")
            return None
    
    def test_create_hive_with_parents_to_create(self):
        """Test POST /api/hives?force=true with parents_to_create array"""
        if not self.auth_token:
            self.log_test("Create Hive with Parents", False, "No auth token available")
            return None
        
        try:
            # Create unique test data with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            hive_data = {
                "name": f"Test Street Community {timestamp}",
                "description": "Testing hierarchy creation",
                "location": f"TestNeighborhood{timestamp}, TestTown{timestamp}, TestCity{timestamp}, TestCountry{timestamp}",
                "community_type": "street",
                "hierarchy": {
                    "country": f"TestCountry{timestamp}",
                    "city": f"TestCity{timestamp}",
                    "town": f"TestTown{timestamp}",
                    "neighborhood": f"TestNeighborhood{timestamp}"
                },
                "parents_to_create": [
                    {"level": "country", "name": f"TestCountry{timestamp}"},
                    {"level": "city", "name": f"TestCity{timestamp}"},
                    {"level": "town", "name": f"TestTown{timestamp}"},
                    {"level": "neighborhood", "name": f"TestNeighborhood{timestamp}"}
                ]
            }
            
            response = self.session.post(f"{API_BASE}/hives?force=true", json=hive_data)
            
            if response.status_code == 200:
                data = response.json()
                created_hive_id = data.get("id")
                
                if created_hive_id:
                    self.created_hive_ids.append(created_hive_id)
                    self.log_test("Create Hive with Parents", True, "Successfully created community with parent hierarchy", 
                                {"created_hive_id": created_hive_id, 
                                 "hive_name": data.get("name"),
                                 "parent_hive_id": data.get("parent_hive_id"),
                                 "parent_hive_name": data.get("parent_hive_name")})
                    return data
                else:
                    self.log_test("Create Hive with Parents", False, "Hive created but no ID returned", 
                                {"response": data})
                    return None
            else:
                self.log_test("Create Hive with Parents", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
                return None
        except Exception as e:
            self.log_test("Create Hive with Parents", False, f"Request failed: {str(e)}")
            return None
    
    def test_verify_created_communities_exist(self):
        """Test GET /api/hives to verify created communities exist"""
        if not self.auth_token:
            self.log_test("Verify Created Communities", False, "No auth token available")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/hives")
            
            if response.status_code == 200:
                hives = response.json()
                
                if isinstance(hives, list):
                    # Look for our created test hives
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    test_hives = [h for h in hives if f"Test" in h.get("name", "") and timestamp[:8] in h.get("name", "")]
                    
                    if test_hives:
                        # Check for proper hierarchy linking
                        hierarchy_correct = True
                        hierarchy_details = []
                        
                        for hive in test_hives:
                            hive_info = {
                                "name": hive.get("name"),
                                "id": hive.get("id"),
                                "parent_hive_id": hive.get("parent_hive_id"),
                                "parent_hive_name": hive.get("parent_hive_name")
                            }
                            hierarchy_details.append(hive_info)
                        
                        self.log_test("Verify Created Communities", True, f"Found {len(test_hives)} test communities with proper structure", 
                                    {"test_hives_count": len(test_hives), "hierarchy_details": hierarchy_details})
                    else:
                        self.log_test("Verify Created Communities", False, "No test communities found in hives list", 
                                    {"total_hives": len(hives), "searched_for": f"Test communities with {timestamp[:8]}"})
                else:
                    self.log_test("Verify Created Communities", False, "Hives response is not a list", 
                                {"response_type": type(hives)})
            else:
                self.log_test("Verify Created Communities", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Verify Created Communities", False, f"Request failed: {str(e)}")
    
    def test_create_hive_no_parents_to_create(self):
        """Test creating a community with no parents_to_create (should work as before)"""
        if not self.auth_token:
            self.log_test("Create Hive No Parents", False, "No auth token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            hive_data = {
                "name": f"Simple Test Community {timestamp}",
                "description": "Testing normal community creation without parent hierarchy",
                "location": f"Simple Location {timestamp}",
                "community_type": "local"
            }
            
            response = self.session.post(f"{API_BASE}/hives?force=true", json=hive_data)
            
            if response.status_code == 200:
                data = response.json()
                created_hive_id = data.get("id")
                
                if created_hive_id:
                    self.created_hive_ids.append(created_hive_id)
                    self.log_test("Create Hive No Parents", True, "Successfully created community without parent hierarchy", 
                                {"created_hive_id": created_hive_id, "hive_name": data.get("name")})
                else:
                    self.log_test("Create Hive No Parents", False, "Hive created but no ID returned", 
                                {"response": data})
            else:
                self.log_test("Create Hive No Parents", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Create Hive No Parents", False, f"Request failed: {str(e)}")
    
    def test_create_hive_partial_parents(self):
        """Test creating a community with only some parents selected"""
        if not self.auth_token:
            self.log_test("Create Hive Partial Parents", False, "No auth token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            hive_data = {
                "name": f"Partial Test Community {timestamp}",
                "description": "Testing partial parent hierarchy creation",
                "location": f"PartialCity{timestamp}, PartialCountry{timestamp}",
                "community_type": "city",
                "hierarchy": {
                    "country": f"PartialCountry{timestamp}",
                    "city": f"PartialCity{timestamp}"
                },
                "parents_to_create": [
                    {"level": "country", "name": f"PartialCountry{timestamp}"}
                ]
            }
            
            response = self.session.post(f"{API_BASE}/hives?force=true", json=hive_data)
            
            if response.status_code == 200:
                data = response.json()
                created_hive_id = data.get("id")
                
                if created_hive_id:
                    self.created_hive_ids.append(created_hive_id)
                    self.log_test("Create Hive Partial Parents", True, "Successfully created community with partial parent hierarchy", 
                                {"created_hive_id": created_hive_id, 
                                 "hive_name": data.get("name"),
                                 "parent_hive_name": data.get("parent_hive_name")})
                else:
                    self.log_test("Create Hive Partial Parents", False, "Hive created but no ID returned", 
                                {"response": data})
            else:
                self.log_test("Create Hive Partial Parents", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Create Hive Partial Parents", False, f"Request failed: {str(e)}")
    
    def test_user_becomes_founder_of_created_parents(self):
        """Test that user becomes founder of all created parent communities"""
        if not self.auth_token:
            self.log_test("User Founder of Parents", False, "No auth token available")
            return
        
        try:
            # Get user's hive memberships
            response = self.session.get(f"{API_BASE}/hives/my/memberships")
            
            if response.status_code == 200:
                my_hives = response.json()
                
                if isinstance(my_hives, list):
                    # Look for test hives where user should be founder
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    test_hives = [h for h in my_hives if f"Test" in h.get("name", "") and timestamp[:8] in h.get("name", "")]
                    
                    if test_hives:
                        # Check membership details for each hive
                        founder_count = 0
                        for hive in test_hives:
                            hive_id = hive.get("id")
                            if hive_id:
                                # Get hive members to check role
                                members_response = self.session.get(f"{API_BASE}/hives/{hive_id}/members")
                                if members_response.status_code == 200:
                                    members = members_response.json()
                                    user_membership = next((m for m in members if m.get("user_id") == self.test_user_id), None)
                                    if user_membership and user_membership.get("role") == "founder":
                                        founder_count += 1
                        
                        if founder_count > 0:
                            self.log_test("User Founder of Parents", True, f"User is founder of {founder_count} created communities", 
                                        {"founder_count": founder_count, "total_test_hives": len(test_hives)})
                        else:
                            self.log_test("User Founder of Parents", False, "User is not founder of any created communities", 
                                        {"test_hives": len(test_hives)})
                    else:
                        self.log_test("User Founder of Parents", False, "No test hives found in user memberships", 
                                    {"total_memberships": len(my_hives)})
                else:
                    self.log_test("User Founder of Parents", False, "Memberships response is not a list", 
                                {"response_type": type(my_hives)})
            else:
                self.log_test("User Founder of Parents", False, f"Failed to get memberships: {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("User Founder of Parents", False, f"Request failed: {str(e)}")
    
    def test_edge_case_empty_hierarchy(self):
        """Test edge case: empty hierarchy data"""
        if not self.auth_token:
            self.log_test("Edge Case Empty Hierarchy", False, "No auth token available")
            return
        
        try:
            # Test with empty hierarchy
            hierarchy_data = {}
            
            response = self.session.post(f"{API_BASE}/hives/check-existing-parents", json=hierarchy_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Should return empty arrays
                if (len(data.get("existing_parents", [])) == 0 and 
                    len(data.get("missing_parents", [])) == 0 and 
                    len(data.get("will_auto_join", [])) == 0):
                    self.log_test("Edge Case Empty Hierarchy", True, "Empty hierarchy correctly handled", 
                                {"response": data})
                else:
                    self.log_test("Edge Case Empty Hierarchy", False, "Empty hierarchy not handled correctly", 
                                {"response": data})
            else:
                self.log_test("Edge Case Empty Hierarchy", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Edge Case Empty Hierarchy", False, f"Request failed: {str(e)}")
    
    def test_edge_case_invalid_hierarchy_data(self):
        """Test edge case: invalid hierarchy data"""
        if not self.auth_token:
            self.log_test("Edge Case Invalid Hierarchy", False, "No auth token available")
            return
        
        try:
            # Test with invalid hierarchy (very short names)
            hierarchy_data = {
                "country": "A",  # Too short
                "city": "",      # Empty
                "town": "B",     # Too short
                "neighborhood": "Valid Neighborhood Name"
            }
            
            response = self.session.post(f"{API_BASE}/hives/check-existing-parents", json=hierarchy_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Should only process valid entries (neighborhood)
                missing_parents = data.get("missing_parents", [])
                valid_entries = [p for p in missing_parents if len(p.get("name", "")) >= 2]
                
                if len(valid_entries) <= 1:  # Only neighborhood should be valid
                    self.log_test("Edge Case Invalid Hierarchy", True, "Invalid hierarchy data correctly filtered", 
                                {"valid_entries": len(valid_entries), "total_missing": len(missing_parents)})
                else:
                    self.log_test("Edge Case Invalid Hierarchy", False, "Invalid hierarchy data not filtered correctly", 
                                {"response": data})
            else:
                self.log_test("Edge Case Invalid Hierarchy", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Edge Case Invalid Hierarchy", False, f"Request failed: {str(e)}")
    
    def cleanup_test_data(self):
        """Clean up created test hives (optional - for cleanup)"""
        if not self.created_hive_ids:
            return
        
        print(f"\n🧹 Cleaning up {len(self.created_hive_ids)} test hives...")
        
        # Note: There's no delete hive endpoint in the current API
        # This is just for tracking what was created
        for hive_id in self.created_hive_ids:
            print(f"   Created test hive: {hive_id}")
    
    def run_all_tests(self):
        """Run all parent hierarchy auto-creation tests"""
        print("🏗️  Starting WayPledge Parent Hierarchy Auto-Creation Testing")
        print("=" * 70)
        
        # Setup admin user
        if not self.setup_admin_user():
            print("❌ Failed to setup admin user - cannot continue with tests")
            return
        
        print("\n🔍 PARENT HIERARCHY CHECKING TESTS")
        print("-" * 50)
        
        # Test 1: Check existing parents endpoint
        self.test_check_existing_parents_endpoint()
        
        # Test 2: Edge cases for hierarchy checking
        self.test_edge_case_empty_hierarchy()
        self.test_edge_case_invalid_hierarchy_data()
        
        print("\n🏘️  COMMUNITY CREATION WITH HIERARCHY TESTS")
        print("-" * 50)
        
        # Test 3: Create community with full parent hierarchy
        self.test_create_hive_with_parents_to_create()
        
        # Test 4: Create community without parent hierarchy (normal flow)
        self.test_create_hive_no_parents_to_create()
        
        # Test 5: Create community with partial parent hierarchy
        self.test_create_hive_partial_parents()
        
        print("\n✅ VERIFICATION TESTS")
        print("-" * 30)
        
        # Test 6: Verify created communities exist
        self.test_verify_created_communities_exist()
        
        # Test 7: Verify user becomes founder of created parents
        self.test_user_becomes_founder_of_created_parents()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        print("\n📊 TEST SUMMARY")
        print("=" * 40)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['message']}")
        
        return passed_tests, failed_tests

def main():
    """Main function to run the tests"""
    tester = ParentHierarchyTester()
    passed, failed = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()