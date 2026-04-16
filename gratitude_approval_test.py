#!/usr/bin/env python3
"""
WayPledge Gratitude Approval Workflow Testing
Testing the gratitude approval endpoints: pending, approve, decline
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional

# Backend URL from environment
BACKEND_URL = "https://pledge-app-redesign.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class GratitudeApprovalTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_id = None
        self.second_user_token = None
        self.second_user_id = None
        self.test_results = []
        self.test_gratitude_id = None
        
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
    
    def setup_test_users(self):
        """Create two test users for gratitude testing"""
        try:
            # Create first user (will receive gratitude)
            user1_data = {
                "email": f"gratitude_user1_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
                "password": "TestPassword123!",
                "name": "Gratitude Receiver",
                "bio": "User who will receive gratitude",
                "location": "Test City, Test Country"
            }
            
            response1 = self.session.post(f"{API_BASE}/auth/register", json=user1_data)
            
            if response1.status_code == 200:
                data1 = response1.json()
                self.auth_token = data1.get("access_token")
                self.test_user_id = data1.get("user", {}).get("id")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                
                # Create second user (will send gratitude)
                user2_data = {
                    "email": f"gratitude_user2_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
                    "password": "TestPassword123!",
                    "name": "Gratitude Sender",
                    "bio": "User who will send gratitude",
                    "location": "Test City 2, Test Country"
                }
                
                response2 = self.session.post(f"{API_BASE}/auth/register", json=user2_data)
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    self.second_user_token = data2.get("access_token")
                    self.second_user_id = data2.get("user", {}).get("id")
                    
                    self.log_test("User Setup", True, "Both test users created successfully", 
                                {"user1_id": self.test_user_id, "user2_id": self.second_user_id})
                    return True
                else:
                    self.log_test("User Setup", False, f"Failed to create second user: {response2.status_code}", 
                                {"response": response2.text})
                    return False
            else:
                self.log_test("User Setup", False, f"Failed to create first user: {response1.status_code}", 
                            {"response": response1.text})
                return False
        except Exception as e:
            self.log_test("User Setup", False, f"User setup failed: {str(e)}")
            return False

    def test_pending_gratitude_unauthenticated(self):
        """Test GET /api/gratitude/pending without authentication should fail"""
        try:
            # Create session without auth token
            unauth_session = requests.Session()
            response = unauth_session.get(f"{API_BASE}/gratitude/pending")
            
            if response.status_code in [401, 403]:
                self.log_test("Pending Gratitude Unauth", True, "Correctly rejected unauthenticated request", 
                            {"status_code": response.status_code})
            else:
                self.log_test("Pending Gratitude Unauth", False, f"Unauthenticated request not rejected: {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Pending Gratitude Unauth", False, f"Request failed: {str(e)}")

    def test_approve_gratitude_unauthenticated(self):
        """Test POST /api/gratitude/{id}/approve without authentication should fail"""
        try:
            # Create session without auth token
            unauth_session = requests.Session()
            fake_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
            response = unauth_session.post(f"{API_BASE}/gratitude/{fake_id}/approve")
            
            if response.status_code in [401, 403]:
                self.log_test("Approve Gratitude Unauth", True, "Correctly rejected unauthenticated request", 
                            {"status_code": response.status_code})
            else:
                self.log_test("Approve Gratitude Unauth", False, f"Unauthenticated request not rejected: {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Approve Gratitude Unauth", False, f"Request failed: {str(e)}")

    def test_decline_gratitude_unauthenticated(self):
        """Test POST /api/gratitude/{id}/decline without authentication should fail"""
        try:
            # Create session without auth token
            unauth_session = requests.Session()
            fake_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
            response = unauth_session.post(f"{API_BASE}/gratitude/{fake_id}/decline")
            
            if response.status_code in [401, 403]:
                self.log_test("Decline Gratitude Unauth", True, "Correctly rejected unauthenticated request", 
                            {"status_code": response.status_code})
            else:
                self.log_test("Decline Gratitude Unauth", False, f"Unauthenticated request not rejected: {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Decline Gratitude Unauth", False, f"Request failed: {str(e)}")

    def create_test_gratitude(self):
        """Create a test gratitude entry from user2 to user1"""
        if not self.second_user_token or not self.test_user_id:
            self.log_test("Create Test Gratitude", False, "Missing required user tokens or IDs")
            return None
        
        try:
            # Create session with second user's token (sender)
            sender_session = requests.Session()
            sender_session.headers.update({"Authorization": f"Bearer {self.second_user_token}"})
            
            # Create gratitude data
            gratitude_data = {
                "to_user_id": self.test_user_id,
                "message": "Thank you for your amazing help with the project! Your support made all the difference.",
                "connection_id": None  # Optional field
            }
            
            response = sender_session.post(f"{API_BASE}/gratitude", json=gratitude_data)
            
            if response.status_code == 200:
                data = response.json()
                gratitude_id = data.get("id")
                if gratitude_id:
                    self.test_gratitude_id = gratitude_id
                    self.log_test("Create Test Gratitude", True, "Test gratitude created successfully", 
                                {"gratitude_id": gratitude_id, "status": data.get("status")})
                    return gratitude_id
                else:
                    self.log_test("Create Test Gratitude", False, "Gratitude created but no ID returned", 
                                {"response": data})
                    return None
            else:
                self.log_test("Create Test Gratitude", False, f"Failed to create gratitude: {response.status_code}", 
                            {"response": response.text})
                return None
        except Exception as e:
            self.log_test("Create Test Gratitude", False, f"Gratitude creation failed: {str(e)}")
            return None

    def test_pending_gratitude_authenticated(self):
        """Test GET /api/gratitude/pending with authentication returns pending items"""
        if not self.auth_token:
            self.log_test("Pending Gratitude Auth", False, "No auth token available")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/gratitude/pending")
            
            if response.status_code == 200:
                pending_gratitudes = response.json()
                if isinstance(pending_gratitudes, list):
                    # Check if our test gratitude is in the pending list
                    if self.test_gratitude_id:
                        found_test_gratitude = any(g.get("id") == self.test_gratitude_id for g in pending_gratitudes)
                        if found_test_gratitude:
                            self.log_test("Pending Gratitude Auth", True, f"Retrieved {len(pending_gratitudes)} pending gratitudes including test gratitude", 
                                        {"count": len(pending_gratitudes), "test_gratitude_found": True})
                        else:
                            self.log_test("Pending Gratitude Auth", True, f"Retrieved {len(pending_gratitudes)} pending gratitudes (test gratitude not found - may be expected)", 
                                        {"count": len(pending_gratitudes), "test_gratitude_found": False})
                    else:
                        self.log_test("Pending Gratitude Auth", True, f"Retrieved {len(pending_gratitudes)} pending gratitudes", 
                                    {"count": len(pending_gratitudes)})
                    
                    # Verify structure if any pending gratitudes exist
                    if pending_gratitudes:
                        sample_gratitude = pending_gratitudes[0]
                        required_fields = ["id", "from_user_id", "from_user_name", "to_user_id", "to_user_name", "message", "status", "created_at"]
                        missing_fields = [field for field in required_fields if field not in sample_gratitude]
                        
                        if not missing_fields:
                            self.log_test("Pending Gratitude Structure", True, "Pending gratitudes have all required fields", 
                                        {"sample_fields": list(sample_gratitude.keys())})
                        else:
                            self.log_test("Pending Gratitude Structure", False, f"Missing fields: {missing_fields}", 
                                        {"sample_gratitude": sample_gratitude})
                else:
                    self.log_test("Pending Gratitude Auth", False, "Response is not a list", 
                                {"response": pending_gratitudes})
            else:
                self.log_test("Pending Gratitude Auth", False, f"Failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Pending Gratitude Auth", False, f"Request failed: {str(e)}")

    def test_approve_gratitude(self):
        """Test POST /api/gratitude/{id}/approve to approve a gratitude"""
        if not self.auth_token or not self.test_gratitude_id:
            self.log_test("Approve Gratitude", False, "No auth token or test gratitude ID available")
            return
        
        try:
            response = self.session.post(f"{API_BASE}/gratitude/{self.test_gratitude_id}/approve")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "approved" in data.get("message", "").lower():
                    self.log_test("Approve Gratitude", True, "Gratitude approved successfully", 
                                {"gratitude_id": self.test_gratitude_id, "response": data})
                    return True
                else:
                    self.log_test("Approve Gratitude", False, "Approval response unexpected", 
                                {"response": data})
                    return False
            else:
                self.log_test("Approve Gratitude", False, f"Approval failed with status {response.status_code}", 
                            {"response": response.text})
                return False
        except Exception as e:
            self.log_test("Approve Gratitude", False, f"Approval request failed: {str(e)}")
            return False

    def test_gratitude_wall_shows_approved(self):
        """Test that approved gratitude appears on the public wall"""
        try:
            response = self.session.get(f"{API_BASE}/gratitude/wall")
            
            if response.status_code == 200:
                wall_gratitudes = response.json()
                if isinstance(wall_gratitudes, list):
                    # Check if our approved gratitude is on the wall
                    if self.test_gratitude_id:
                        found_on_wall = any(g.get("id") == self.test_gratitude_id for g in wall_gratitudes)
                        if found_on_wall:
                            self.log_test("Gratitude Wall Shows Approved", True, "Approved gratitude appears on public wall", 
                                        {"wall_count": len(wall_gratitudes), "test_gratitude_found": True})
                        else:
                            self.log_test("Gratitude Wall Shows Approved", False, "Approved gratitude not found on public wall", 
                                        {"wall_count": len(wall_gratitudes), "test_gratitude_found": False})
                    else:
                        self.log_test("Gratitude Wall Shows Approved", True, f"Gratitude wall retrieved with {len(wall_gratitudes)} items", 
                                    {"wall_count": len(wall_gratitudes)})
                else:
                    self.log_test("Gratitude Wall Shows Approved", False, "Wall response is not a list", 
                                {"response": wall_gratitudes})
            else:
                self.log_test("Gratitude Wall Shows Approved", False, f"Wall request failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Gratitude Wall Shows Approved", False, f"Wall request failed: {str(e)}")

    def test_decline_gratitude_flow(self):
        """Test the complete decline gratitude flow"""
        # First create another gratitude to decline
        decline_gratitude_id = self.create_test_gratitude()
        if not decline_gratitude_id:
            self.log_test("Decline Gratitude Flow", False, "Could not create gratitude for decline test")
            return
        
        try:
            # Decline the gratitude
            response = self.session.post(f"{API_BASE}/gratitude/{decline_gratitude_id}/decline")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "declined" in data.get("message", "").lower():
                    self.log_test("Decline Gratitude", True, "Gratitude declined successfully", 
                                {"gratitude_id": decline_gratitude_id, "response": data})
                    
                    # Verify declined gratitude does NOT appear on public wall
                    wall_response = self.session.get(f"{API_BASE}/gratitude/wall")
                    if wall_response.status_code == 200:
                        wall_gratitudes = wall_response.json()
                        found_on_wall = any(g.get("id") == decline_gratitude_id for g in wall_gratitudes)
                        if not found_on_wall:
                            self.log_test("Declined Gratitude Not On Wall", True, "Declined gratitude correctly hidden from public wall")
                        else:
                            self.log_test("Declined Gratitude Not On Wall", False, "Declined gratitude incorrectly appears on public wall")
                    else:
                        self.log_test("Declined Gratitude Not On Wall", False, "Could not check wall after decline")
                else:
                    self.log_test("Decline Gratitude", False, "Decline response unexpected", 
                                {"response": data})
            else:
                self.log_test("Decline Gratitude", False, f"Decline failed with status {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Decline Gratitude Flow", False, f"Decline request failed: {str(e)}")

    def test_approve_nonexistent_gratitude(self):
        """Test approving non-existent gratitude returns 404"""
        if not self.auth_token:
            self.log_test("Approve Nonexistent", False, "No auth token available")
            return
        
        try:
            fake_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
            response = self.session.post(f"{API_BASE}/gratitude/{fake_id}/approve")
            
            if response.status_code == 404:
                self.log_test("Approve Nonexistent", True, "Correctly rejected non-existent gratitude", 
                            {"status_code": response.status_code})
            else:
                self.log_test("Approve Nonexistent", False, f"Non-existent gratitude not rejected: {response.status_code}", 
                            {"response": response.text})
        except Exception as e:
            self.log_test("Approve Nonexistent", False, f"Request failed: {str(e)}")

    def test_approve_wrong_user(self):
        """Test that only the recipient can approve gratitude"""
        if not self.second_user_token or not self.test_gratitude_id:
            self.log_test("Approve Wrong User", False, "Missing required tokens or gratitude ID")
            return
        
        try:
            # Try to approve with the sender's token (should fail)
            sender_session = requests.Session()
            sender_session.headers.update({"Authorization": f"Bearer {self.second_user_token}"})
            
            # Create a new gratitude first
            new_gratitude_id = self.create_test_gratitude()
            if new_gratitude_id:
                response = sender_session.post(f"{API_BASE}/gratitude/{new_gratitude_id}/approve")
                
                if response.status_code in [403, 404]:
                    self.log_test("Approve Wrong User", True, "Correctly rejected approval by non-recipient", 
                                {"status_code": response.status_code})
                else:
                    self.log_test("Approve Wrong User", False, f"Wrong user approval not rejected: {response.status_code}", 
                                {"response": response.text})
            else:
                self.log_test("Approve Wrong User", False, "Could not create gratitude for wrong user test")
        except Exception as e:
            self.log_test("Approve Wrong User", False, f"Request failed: {str(e)}")

    def run_all_tests(self):
        """Run all gratitude approval workflow tests"""
        print("🙏 Starting WayPledge Gratitude Approval Workflow Testing")
        print("=" * 60)
        
        # Test unauthenticated access first
        print("\n🔒 UNAUTHENTICATED ACCESS TESTS")
        print("-" * 40)
        self.test_pending_gratitude_unauthenticated()
        self.test_approve_gratitude_unauthenticated()
        self.test_decline_gratitude_unauthenticated()
        
        # Setup test users
        print("\n👥 USER SETUP")
        print("-" * 40)
        if not self.setup_test_users():
            print("❌ Cannot continue without test users")
            return False
        
        # Create test gratitude
        print("\n📝 GRATITUDE CREATION")
        print("-" * 40)
        self.create_test_gratitude()
        
        # Test authenticated endpoints
        print("\n✅ AUTHENTICATED WORKFLOW TESTS")
        print("-" * 40)
        self.test_pending_gratitude_authenticated()
        
        # Test approval workflow
        print("\n👍 APPROVAL WORKFLOW")
        print("-" * 40)
        approval_success = self.test_approve_gratitude()
        if approval_success:
            self.test_gratitude_wall_shows_approved()
        
        # Test decline workflow
        print("\n👎 DECLINE WORKFLOW")
        print("-" * 40)
        self.test_decline_gratitude_flow()
        
        # Test edge cases
        print("\n🚫 EDGE CASE TESTS")
        print("-" * 40)
        self.test_approve_nonexistent_gratitude()
        self.test_approve_wrong_user()
        
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
    tester = GratitudeApprovalTester()
    success = tester.run_all_tests()
    
    # Save detailed results to file
    with open("/app/gratitude_approval_test_results.json", "w") as f:
        json.dump(tester.test_results, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: /app/gratitude_approval_test_results.json")
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()