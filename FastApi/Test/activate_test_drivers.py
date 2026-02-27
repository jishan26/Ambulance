#!/usr/bin/env python3
"""
Script to activate test drivers in the database
"""
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_DRIVERS = [
    {"email": "driver1@test.com", "password": "password123"},
    {"email": "driver2@test.com", "password": "password123"},
    {"email": "driver3@test.com", "password": "password123"},
]

def activate_test_drivers():
    """Activate test drivers by logging them in"""
    
    print("🚑 Activating Test Drivers")
    print("=" * 40)
    
    for i, driver in enumerate(TEST_DRIVERS, 1):
        print(f"\n{i}️⃣ Activating driver: {driver['email']}")
        
        # Login as driver
        login_data = {
            "phone_or_email": driver["email"],
            "password": driver["password"],
            "user_type": "driver"
        }
        
        try:
            login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if login_response.status_code == 200:
                login_result = login_response.json()
                token = login_result.get('access_token')
                user_id = login_result.get('user_id')
                
                print(f"   ✅ Login successful! User ID: {user_id}")
                
                # Update availability to True
                headers = {"Authorization": f"Bearer {token}"}
                availability_data = {"is_available": True}
                
                update_response = requests.put(
                    f"{BASE_URL}/drivers/availability", 
                    json=availability_data, 
                    headers=headers
                )
                
                if update_response.status_code == 200:
                    print(f"   ✅ Driver activated (available: True)")
                else:
                    print(f"   ❌ Failed to activate driver: {update_response.text}")
                
                # Logout
                logout_response = requests.delete(f"{BASE_URL}/auth/logout", headers=headers)
                if logout_response.status_code == 200:
                    print(f"   ✅ Logout successful")
                else:
                    print(f"   ⚠️ Logout failed: {logout_response.text}")
                    
            else:
                print(f"   ❌ Login failed: {login_response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 40)
    print("🏁 Test drivers activation completed!")

if __name__ == "__main__":
    activate_test_drivers()
