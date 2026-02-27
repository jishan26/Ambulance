#!/usr/bin/env python3
"""
Test script to verify driver availability changes on login/logout
"""
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_DRIVER_EMAIL = "driver@test.com"  # Replace with actual test driver email
TEST_DRIVER_PASSWORD = "password123"    # Replace with actual test driver password

def test_driver_availability():
    """Test that driver availability changes correctly on login/logout"""
    
    print("🧪 Testing Driver Availability on Login/Logout")
    print("=" * 50)
    
    # Step 1: Login as driver
    print("\n1️⃣ Testing Driver Login...")
    login_data = {
        "phone_or_email": TEST_DRIVER_EMAIL,
        "password": TEST_DRIVER_PASSWORD,
        "user_type": "driver"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"   Status Code: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            print(f"   ✅ Login successful!")
            print(f"   User ID: {login_result.get('user_id')}")
            print(f"   Role: {login_result.get('role')}")
            
            # Get auth token
            auth_token = login_result.get('access_token')
            if not auth_token:
                print("   ❌ No access token received")
                return False
                
        else:
            print(f"   ❌ Login failed: {login_response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Login error: {str(e)}")
        return False
    
    # Step 2: Check available drivers count after login
    print("\n2️⃣ Checking available drivers count after login...")
    try:
        count_response = requests.get(f"{BASE_URL}/drivers/available-count")
        print(f"   Status Code: {count_response.status_code}")
        
        if count_response.status_code == 200:
            count_result = count_response.json()
            available_after_login = count_result.get('available_drivers', 0)
            print(f"   ✅ Available drivers after login: {available_after_login}")
        else:
            print(f"   ❌ Failed to get driver count: {count_response.text}")
            
    except Exception as e:
        print(f"   ❌ Count check error: {str(e)}")
    
    # Step 3: Logout
    print("\n3️⃣ Testing Driver Logout...")
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        logout_response = requests.delete(f"{BASE_URL}/auth/logout", headers=headers)
        print(f"   Status Code: {logout_response.status_code}")
        
        if logout_response.status_code == 200:
            print(f"   ✅ Logout successful!")
        else:
            print(f"   ❌ Logout failed: {logout_response.text}")
            
    except Exception as e:
        print(f"   ❌ Logout error: {str(e)}")
    
    # Step 4: Check available drivers count after logout
    print("\n4️⃣ Checking available drivers count after logout...")
    try:
        count_response = requests.get(f"{BASE_URL}/drivers/available-count")
        print(f"   Status Code: {count_response.status_code}")
        
        if count_response.status_code == 200:
            count_result = count_response.json()
            available_after_logout = count_result.get('available_drivers', 0)
            print(f"   ✅ Available drivers after logout: {available_after_logout}")
            
            # Compare counts
            if available_after_logout < available_after_login:
                print(f"   ✅ Driver availability correctly updated on logout!")
            else:
                print(f"   ⚠️ Driver availability may not have changed on logout")
        else:
            print(f"   ❌ Failed to get driver count: {count_response.text}")
            
    except Exception as e:
        print(f"   ❌ Count check error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    test_driver_availability()
