#!/usr/bin/env python3
"""
WayPledge DELETE Pledge Endpoint Testing
Testing the DELETE /api/pledges/{pledge_id} endpoint functionality
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://pledge-app-redesign.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class DeletePledgeAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_id = None
        self.test_results = []
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
            # Register a test user with a valid email domain
            user_data = {
                "email": f"delete_test_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
                "password": "TestPassword123!",
                "name": "Delete Test User",
                "bio": "Testing pledge deletion functionality",
                "location": "Test City, Test Country"
            }
            
            response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.test_user_id = data.get("user", {}).get("id")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_test("User Registration", True, "Test user created successfully", 
                            {"user_id": self.test_user_id, "email": user_data["email"]})
                return True
            else:
                self.log_test("User Registration", False, f"Failed to create test user: {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("User Registration", False, f"User setup failed: {str(e)}")
            return False
    
    def create_test_pledge(self):
        """Create a test pledge to be deleted later"""
        if not self.auth_token:
            self.log_test("Create Test Pledge", False, "No auth token available")
            return False
        
        try:
            pledge_data = {
                "title": f"Test Pledge for Deletion {datetime.now().strftime('%H:%M:%S')}",
                "description": "This pledge will be deleted as part of testing the DELETE endpoint",
                "category": "Community",
                "tags": ["test", "deletion", "api-testing"],
                "location": "Test Location"
            }
            
            response = self.session.post(f"{API_BASE}/pledges", json=pledge_data)
            
            if response.status_code == 200:
                data = response.json()
                self.created_pledge_id = data.get("id")
                self.log_test("Create Test Pledge", True, "Test pledge created successfully", 
                            {"pledge_id": self.created_pledge_id, "title": pledge_data["title"]})
                return True
            else:
                self.log_test("Create Test Pledge", False, f"Failed to create test pledge: {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("Create Test Pledge", False, f"Pledge creation failed: {str(e)}")
            return False
    
    def verify_pledge_exists(self):
        """Verify the created pledge exists in the pledges list"""
        if not self.created_pledge_id:
            self.log_test("Verify Pledge Exists", False, "No pledge ID to verify")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/pledges")
            
            if response.status_code == 200:
                pledges = response.json()
                
                # Look for our created pledge
                found_pledge = None
                for pledge in pledges:
                    if pledge.get("id") == self.created_pledge_id:
                        found_pledge = pledge
                        break
                
                if found_pledge:
                    self.log_test("Verify Pledge Exists", True, "Created pledge found in pledges list", 
                                {"pledge_id": self.created_pledge_id, "title": found_pledge.get("title")})
                    return True
                else:
                    self.log_test("Verify Pledge Exists", False, "Created pledge not found in pledges list", 
                                {"pledge_id": self.created_pledge_id, "total_pledges": len(pledges)})
                    return False
            else:
                self.log_test("Verify Pledge Exists", False, f"Failed to get pledges list: {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("Verify Pledge Exists", False, f"Request failed: {str(e)}")
            return False
    
    def delete_pledge(self):
        """Delete the created pledge using DELETE endpoint"""
        if not self.created_pledge_id:
            self.log_test("Delete Pledge", False, "No pledge ID to delete")
            return False
        
        if not self.auth_token:
            self.log_test("Delete Pledge", False, "No auth token available")
            return False
        
        try:
            response = self.session.delete(f"{API_BASE}/pledges/{self.created_pledge_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "deleted" in data.get("message", "").lower():
                    self.log_test("Delete Pledge", True, "Pledge deleted successfully", 
                                {"pledge_id": self.created_pledge_id, "response": data})
                    return True
                else:
                    self.log_test("Delete Pledge", False, "Unexpected delete response format", 
                                {"response": data})
                    return False
            else:
                self.log_test("Delete Pledge", False, f"Delete request failed: {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("Delete Pledge", False, f"Delete request failed: {str(e)}")
            return False
    
    def verify_pledge_deleted(self):
        """Verify the pledge is no longer in the pledges list"""
        if not self.created_pledge_id:
            self.log_test("Verify Pledge Deleted", False, "No pledge ID to verify deletion")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/pledges")
            
            if response.status_code == 200:
                pledges = response.json()
                
                # Look for our deleted pledge - it should NOT be found
                found_pledge = None
                for pledge in pledges:
                    if pledge.get("id") == self.created_pledge_id:
                        found_pledge = pledge
                        break
                
                if not found_pledge:
                    self.log_test("Verify Pledge Deleted", True, "Deleted pledge confirmed removed from pledges list", 
                                {"pledge_id": self.created_pledge_id, "total_pledges": len(pledges)})
                    return True
                else:
                    self.log_test("Verify Pledge Deleted", False, "Deleted pledge still appears in pledges list", 
                                {"pledge_id": self.created_pledge_id, "found_pledge": found_pledge})
                    return False
            else:
                self.log_test("Verify Pledge Deleted", False, f"Failed to get pledges list: {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("Verify Pledge Deleted", False, f"Request failed: {str(e)}")
            return False
    
    def test_delete_nonexistent_pledge(self):
        """Test deleting a non-existent pledge (should return 404)"""
        if not self.auth_token:
            self.log_test("Delete Nonexistent Pledge", False, "No auth token available")
            return False
        
        try:
            fake_pledge_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but doesn't exist
            response = self.session.delete(f"{API_BASE}/pledges/{fake_pledge_id}")
            
            if response.status_code == 404:
                self.log_test("Delete Nonexistent Pledge", True, "Correctly returned 404 for non-existent pledge", 
                            {"fake_id": fake_pledge_id})
                return True
            else:
                self.log_test("Delete Nonexistent Pledge", False, f"Expected 404, got {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("Delete Nonexistent Pledge", False, f"Request failed: {str(e)}")
            return False
    
    def test_delete_without_auth(self):
        """Test deleting a pledge without authentication (should return 401)"""
        if not self.created_pledge_id:
            # Create a new pledge first
            if not self.create_test_pledge():
                self.log_test("Delete Without Auth", False, "Could not create pledge for auth test")
                return False
        
        try:
            # Remove auth header temporarily
            original_headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.delete(f"{API_BASE}/pledges/{self.created_pledge_id}")
            
            # Restore auth header
            self.session.headers.update(original_headers)
            
            if response.status_code == 401:
                self.log_test("Delete Without Auth", True, "Correctly returned 401 for unauthenticated request")
                return True
            else:
                self.log_test("Delete Without Auth", False, f"Expected 401, got {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            # Restore auth header in case of exception
            self.session.headers.update(original_headers)
            self.log_test("Delete Without Auth", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all DELETE pledge endpoint tests"""
        print("🚀 Starting WayPledge DELETE Pledge Endpoint Testing")
        print("=" * 60)
        
        # Step 1: Setup test user
        if not self.setup_test_user():
            print("❌ Cannot proceed without test user")
            return False
        
        # Step 2: Create test pledge
        if not self.create_test_pledge():
            print("❌ Cannot proceed without test pledge")
            return False
        
        # Step 3: Verify pledge exists
        if not self.verify_pledge_exists():
            print("❌ Cannot proceed - pledge verification failed")
            return False
        
        # Step 4: Delete the pledge
        if not self.delete_pledge():
            print("❌ DELETE endpoint test failed")
            return False
        
        # Step 5: Verify pledge is deleted
        if not self.verify_pledge_deleted():
            print("❌ Deletion verification failed")
            return False
        
        # Step 6: Test edge cases
        self.test_delete_nonexistent_pledge()
        self.test_delete_without_auth()
        
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
    tester = DeletePledgeAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results to file
    with open("/app/delete_pledge_test_results.json", "w") as f:
        json.dump(tester.test_results, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: /app/delete_pledge_test_results.json")
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()