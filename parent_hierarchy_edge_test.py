#!/usr/bin/env python3
"""
WayPledge Parent Hierarchy Auto-Creation - Additional Edge Case Testing
Testing additional edge cases and error scenarios
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://pledge-app-redesign.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class ParentHierarchyEdgeCaseTester:
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
    
    def setup_admin_user(self):
        """Login with admin credentials for testing"""
        try:
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
                self.log_test("Admin Login", True, "Admin user logged in successfully")
                return True
            else:
                self.log_test("Admin Login", False, f"Failed to login: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Login failed: {str(e)}")
            return False
    
    def test_duplicate_parent_creation_prevention(self):
        """Test that duplicate parent communities are not created"""
        if not self.auth_token:
            self.log_test("Duplicate Prevention", False, "No auth token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Create first community with parents
            hive_data_1 = {
                "name": f"First Duplicate Test {timestamp}",
                "description": "First community to test duplicate prevention",
                "location": f"DupeNeighborhood{timestamp}, DupeCity{timestamp}, DupeCountry{timestamp}",
                "community_type": "neighborhood",
                "hierarchy": {
                    "country": f"DupeCountry{timestamp}",
                    "city": f"DupeCity{timestamp}",
                    "neighborhood": f"DupeNeighborhood{timestamp}"
                },
                "parents_to_create": [
                    {"level": "country", "name": f"DupeCountry{timestamp}"},
                    {"level": "city", "name": f"DupeCity{timestamp}"}
                ]
            }
            
            response_1 = self.session.post(f"{API_BASE}/hives?force=true", json=hive_data_1)
            
            if response_1.status_code == 200:
                # Now create second community with same parent names
                hive_data_2 = {
                    "name": f"Second Duplicate Test {timestamp}",
                    "description": "Second community to test duplicate prevention",
                    "location": f"DupeNeighborhood2{timestamp}, DupeCity{timestamp}, DupeCountry{timestamp}",
                    "community_type": "neighborhood",
                    "hierarchy": {
                        "country": f"DupeCountry{timestamp}",
                        "city": f"DupeCity{timestamp}",
                        "neighborhood": f"DupeNeighborhood2{timestamp}"
                    },
                    "parents_to_create": [
                        {"level": "country", "name": f"DupeCountry{timestamp}"},  # Should already exist
                        {"level": "city", "name": f"DupeCity{timestamp}"}        # Should already exist
                    ]
                }
                
                response_2 = self.session.post(f"{API_BASE}/hives?force=true", json=hive_data_2)
                
                if response_2.status_code == 200:
                    # Check that we don't have duplicate parent communities
                    hives_response = self.session.get(f"{API_BASE}/hives")
                    if hives_response.status_code == 200:
                        hives = hives_response.json()
                        
                        # Count communities with our test names
                        dupe_country_count = len([h for h in hives if h.get("name") == f"DupeCountry{timestamp}"])
                        dupe_city_count = len([h for h in hives if h.get("name") == f"DupeCity{timestamp}"])
                        
                        if dupe_country_count == 1 and dupe_city_count == 1:
                            self.log_test("Duplicate Prevention", True, "Duplicate parent communities correctly prevented", 
                                        {"country_count": dupe_country_count, "city_count": dupe_city_count})
                        else:
                            self.log_test("Duplicate Prevention", False, "Duplicate parent communities were created", 
                                        {"country_count": dupe_country_count, "city_count": dupe_city_count})
                    else:
                        self.log_test("Duplicate Prevention", False, "Could not verify duplicate prevention")
                else:
                    self.log_test("Duplicate Prevention", False, f"Second community creation failed: {response_2.status_code}")
            else:
                self.log_test("Duplicate Prevention", False, f"First community creation failed: {response_1.status_code}")
        except Exception as e:
            self.log_test("Duplicate Prevention", False, f"Request failed: {str(e)}")
    
    def test_hierarchy_linking_correctness(self):
        """Test that parent-child hierarchy linking is correct"""
        if not self.auth_token:
            self.log_test("Hierarchy Linking", False, "No auth token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Create community with full hierarchy
            hive_data = {
                "name": f"Hierarchy Test Street {timestamp}",
                "description": "Testing hierarchy linking correctness",
                "location": f"HierNeighborhood{timestamp}, HierTown{timestamp}, HierCity{timestamp}, HierCountry{timestamp}",
                "community_type": "street",
                "hierarchy": {
                    "country": f"HierCountry{timestamp}",
                    "city": f"HierCity{timestamp}",
                    "town": f"HierTown{timestamp}",
                    "neighborhood": f"HierNeighborhood{timestamp}"
                },
                "parents_to_create": [
                    {"level": "country", "name": f"HierCountry{timestamp}"},
                    {"level": "city", "name": f"HierCity{timestamp}"},
                    {"level": "town", "name": f"HierTown{timestamp}"},
                    {"level": "neighborhood", "name": f"HierNeighborhood{timestamp}"}
                ]
            }
            
            response = self.session.post(f"{API_BASE}/hives?force=true", json=hive_data)
            
            if response.status_code == 200:
                # Get all hives and check hierarchy linking
                hives_response = self.session.get(f"{API_BASE}/hives")
                if hives_response.status_code == 200:
                    hives = hives_response.json()
                    
                    # Find our test hives
                    test_hives = [h for h in hives if f"Hier" in h.get("name", "") and timestamp in h.get("name", "")]
                    
                    if len(test_hives) >= 4:  # Should have country, city, town, neighborhood, street
                        # Build hierarchy map
                        hive_map = {h["name"]: h for h in test_hives}
                        
                        # Check linking: street -> neighborhood -> town -> city -> country -> None
                        street_hive = hive_map.get(f"Hierarchy Test Street {timestamp}")
                        neighborhood_hive = hive_map.get(f"HierNeighborhood{timestamp}")
                        town_hive = hive_map.get(f"HierTown{timestamp}")
                        city_hive = hive_map.get(f"HierCity{timestamp}")
                        country_hive = hive_map.get(f"HierCountry{timestamp}")
                        
                        linking_correct = True
                        linking_details = []
                        
                        if street_hive and neighborhood_hive:
                            if street_hive.get("parent_hive_id") == neighborhood_hive.get("id"):
                                linking_details.append("✅ Street -> Neighborhood")
                            else:
                                linking_correct = False
                                linking_details.append("❌ Street -> Neighborhood")
                        
                        if neighborhood_hive and town_hive:
                            if neighborhood_hive.get("parent_hive_id") == town_hive.get("id"):
                                linking_details.append("✅ Neighborhood -> Town")
                            else:
                                linking_correct = False
                                linking_details.append("❌ Neighborhood -> Town")
                        
                        if town_hive and city_hive:
                            if town_hive.get("parent_hive_id") == city_hive.get("id"):
                                linking_details.append("✅ Town -> City")
                            else:
                                linking_correct = False
                                linking_details.append("❌ Town -> City")
                        
                        if city_hive and country_hive:
                            if city_hive.get("parent_hive_id") == country_hive.get("id"):
                                linking_details.append("✅ City -> Country")
                            else:
                                linking_correct = False
                                linking_details.append("❌ City -> Country")
                        
                        if country_hive:
                            if country_hive.get("parent_hive_id") is None:
                                linking_details.append("✅ Country -> None")
                            else:
                                linking_correct = False
                                linking_details.append("❌ Country -> None")
                        
                        if linking_correct:
                            self.log_test("Hierarchy Linking", True, "Hierarchy linking is correct", 
                                        {"linking_details": linking_details})
                        else:
                            self.log_test("Hierarchy Linking", False, "Hierarchy linking has errors", 
                                        {"linking_details": linking_details})
                    else:
                        self.log_test("Hierarchy Linking", False, f"Expected 5 test hives, found {len(test_hives)}")
                else:
                    self.log_test("Hierarchy Linking", False, "Could not get hives list")
            else:
                self.log_test("Hierarchy Linking", False, f"Community creation failed: {response.status_code}")
        except Exception as e:
            self.log_test("Hierarchy Linking", False, f"Request failed: {str(e)}")
    
    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access hierarchy endpoints"""
        try:
            # Create session without auth token
            unauth_session = requests.Session()
            
            # Test check-existing-parents endpoint
            hierarchy_data = {
                "country": "TestCountry",
                "city": "TestCity"
            }
            
            response = unauth_session.post(f"{API_BASE}/hives/check-existing-parents", json=hierarchy_data)
            
            if response.status_code in [401, 403]:
                self.log_test("Unauthenticated Access", True, "Unauthenticated access correctly rejected", 
                            {"status_code": response.status_code})
            else:
                self.log_test("Unauthenticated Access", False, f"Unauthenticated access not rejected: {response.status_code}")
        except Exception as e:
            self.log_test("Unauthenticated Access", False, f"Request failed: {str(e)}")
    
    def test_malformed_parents_to_create(self):
        """Test handling of malformed parents_to_create data"""
        if not self.auth_token:
            self.log_test("Malformed Parents Data", False, "No auth token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Test with malformed parents_to_create
            hive_data = {
                "name": f"Malformed Test {timestamp}",
                "description": "Testing malformed parents_to_create handling",
                "location": f"MalformedLocation{timestamp}",
                "community_type": "local",
                "parents_to_create": [
                    {"level": "invalid_level", "name": "InvalidLevel"},  # Invalid level
                    {"level": "country"},  # Missing name
                    {"name": "MissingLevel"},  # Missing level
                    {"level": "city", "name": ""}  # Empty name
                ]
            }
            
            response = self.session.post(f"{API_BASE}/hives?force=true", json=hive_data)
            
            # Should either succeed (ignoring invalid entries) or fail gracefully
            if response.status_code in [200, 400, 422]:
                if response.status_code == 200:
                    self.log_test("Malformed Parents Data", True, "Malformed data handled gracefully (created with valid entries)", 
                                {"status_code": response.status_code})
                else:
                    self.log_test("Malformed Parents Data", True, "Malformed data correctly rejected", 
                                {"status_code": response.status_code})
            else:
                self.log_test("Malformed Parents Data", False, f"Unexpected response: {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Malformed Parents Data", False, f"Request failed: {str(e)}")
    
    def test_very_long_hierarchy_names(self):
        """Test handling of very long hierarchy names"""
        if not self.auth_token:
            self.log_test("Long Hierarchy Names", False, "No auth token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Test with very long names
            long_name = "VeryLongCommunityNameThatExceedsNormalLimits" * 5  # ~200 chars
            
            hierarchy_data = {
                "country": long_name,
                "city": long_name,
                "town": long_name,
                "neighborhood": long_name
            }
            
            response = self.session.post(f"{API_BASE}/hives/check-existing-parents", json=hierarchy_data)
            
            if response.status_code == 200:
                data = response.json()
                # Should handle long names gracefully
                self.log_test("Long Hierarchy Names", True, "Long hierarchy names handled correctly", 
                            {"missing_parents_count": len(data.get("missing_parents", []))})
            else:
                self.log_test("Long Hierarchy Names", False, f"Long names not handled: {response.status_code}")
        except Exception as e:
            self.log_test("Long Hierarchy Names", False, f"Request failed: {str(e)}")
    
    def test_special_characters_in_names(self):
        """Test handling of special characters in hierarchy names"""
        if not self.auth_token:
            self.log_test("Special Characters", False, "No auth token available")
            return
        
        try:
            # Test with special characters
            hierarchy_data = {
                "country": "Test-Country_123",
                "city": "Test City (Special)",
                "town": "Test & Town",
                "neighborhood": "Test@Neighborhood.com"
            }
            
            response = self.session.post(f"{API_BASE}/hives/check-existing-parents", json=hierarchy_data)
            
            if response.status_code == 200:
                data = response.json()
                # Should handle special characters gracefully
                self.log_test("Special Characters", True, "Special characters in names handled correctly", 
                            {"missing_parents_count": len(data.get("missing_parents", []))})
            else:
                self.log_test("Special Characters", False, f"Special characters not handled: {response.status_code}")
        except Exception as e:
            self.log_test("Special Characters", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all edge case tests"""
        print("🧪 Starting WayPledge Parent Hierarchy Edge Case Testing")
        print("=" * 65)
        
        # Setup admin user
        if not self.setup_admin_user():
            print("❌ Failed to setup admin user - cannot continue with tests")
            return
        
        print("\n🔒 SECURITY & ACCESS TESTS")
        print("-" * 35)
        self.test_unauthenticated_access()
        
        print("\n🔄 DUPLICATE PREVENTION TESTS")
        print("-" * 40)
        self.test_duplicate_parent_creation_prevention()
        
        print("\n🔗 HIERARCHY LINKING TESTS")
        print("-" * 35)
        self.test_hierarchy_linking_correctness()
        
        print("\n🚫 ERROR HANDLING TESTS")
        print("-" * 30)
        self.test_malformed_parents_to_create()
        self.test_very_long_hierarchy_names()
        self.test_special_characters_in_names()
        
        # Summary
        print("\n📊 EDGE CASE TEST SUMMARY")
        print("=" * 45)
        
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
    """Main function to run the edge case tests"""
    tester = ParentHierarchyEdgeCaseTester()
    passed, failed = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()