#!/usr/bin/env python3
"""
Complete test script for driver availability system
"""
import requests
import json
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_DRIVER_EMAIL = "driver@test.com"
TEST_DRIVER_PASSWORD = "password123"

def test_complete_availability_system():
    """Test the complete driver availability system"""
    
    print("🧪 Testing Complete Driver Availability System")
    print("=" * 60)
    
    auth_token = None
    
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
            auth_token = login_result.get('access_token')
        else:
            print(f"   ❌ Login failed: {login_response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Login error: {str(e)}")
        return False
    
    # Step 2: Check initial driver count
    print("\n2️⃣ Checking initial driver counts...")
    try:
        count_response = requests.get(f"{BASE_URL}/drivers/available-count")
        if count_response.status_code == 200:
            count_data = count_response.json()
            initial_available = count_data.get('available_drivers', 0)
            print(f"   ✅ Initial available drivers: {initial_available}")
        else:
            print(f"   ❌ Failed to get initial count: {count_response.text}")
    except Exception as e:
        print(f"   ❌ Error getting initial count: {str(e)}")
    
    # Step 3: Update driver availability to True
    print("\n3️⃣ Testing driver availability update to True...")
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        availability_data = {"is_available": True}
        
        update_response = requests.put(
            f"{BASE_URL}/drivers/availability", 
            json=availability_data, 
            headers=headers
        )
        print(f"   Status Code: {update_response.status_code}")
        
        if update_response.status_code == 200:
            print(f"   ✅ Availability updated to True!")
        else:
            print(f"   ❌ Failed to update availability: {update_response.text}")
    except Exception as e:
        print(f"   ❌ Error updating availability: {str(e)}")
    
    # Step 4: Check updated count
    print("\n4️⃣ Checking updated driver counts...")
    try:
        count_response = requests.get(f"{BASE_URL}/drivers/available-count")
        if count_response.status_code == 200:
            count_data = count_response.json()
            updated_available = count_data.get('available_drivers', 0)
            print(f"   ✅ Updated available drivers: {updated_available}")
        else:
            print(f"   ❌ Failed to get updated count: {count_response.text}")
    except Exception as e:
        print(f"   ❌ Error getting updated count: {str(e)}")
    
    # Step 5: Update driver availability to False
    print("\n5️⃣ Testing driver availability update to False...")
    try:
        availability_data = {"is_available": False}
        
        update_response = requests.put(
            f"{BASE_URL}/drivers/availability", 
            json=availability_data, 
            headers=headers
        )
        print(f"   Status Code: {update_response.status_code}")
        
        if update_response.status_code == 200:
            print(f"   ✅ Availability updated to False!")
        else:
            print(f"   ❌ Failed to update availability: {update_response.text}")
    except Exception as e:
        print(f"   ❌ Error updating availability: {str(e)}")
    
    # Step 6: Check final count
    print("\n6️⃣ Checking final driver counts...")
    try:
        count_response = requests.get(f"{BASE_URL}/drivers/available-count")
        if count_response.status_code == 200:
            count_data = count_response.json()
            final_available = count_data.get('available_drivers', 0)
            print(f"   ✅ Final available drivers: {final_available}")
        else:
            print(f"   ❌ Failed to get final count: {count_response.text}")
    except Exception as e:
        print(f"   ❌ Error getting final count: {str(e)}")
    
    # Step 7: Test logout
    print("\n7️⃣ Testing driver logout...")
    try:
        logout_response = requests.delete(f"{BASE_URL}/auth/logout", headers=headers)
        print(f"   Status Code: {logout_response.status_code}")
        
        if logout_response.status_code == 200:
            print(f"   ✅ Logout successful!")
        else:
            print(f"   ❌ Logout failed: {logout_response.text}")
    except Exception as e:
        print(f"   ❌ Logout error: {str(e)}")
    
    print("\n" + "=" * 60)
    print("🏁 Complete availability system test finished!")

if __name__ == "__main__":
    test_complete_availability_system()
