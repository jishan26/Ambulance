#!/usr/bin/env python3
"""
Script to add sample drivers with locations to the database
"""
import requests
import json
import random

# Configuration
BASE_URL = "http://127.0.0.1:8000"
SAMPLE_DRIVERS = [
    {
        "name": "Emergency Driver 1",
        "email": "emergency1@test.com",
        "mobile": "+1111111111",
        "password": "password123",
        "user_type": "driver",
        "location": {"latitude": 40.7128, "longitude": -74.0060}  # NYC
    },
    {
        "name": "Emergency Driver 2",
        "email": "emergency2@test.com",
        "mobile": "+1111111112",
        "password": "password123",
        "user_type": "driver",
        "location": {"latitude": 40.7589, "longitude": -73.9851}  # Times Square
    },
    {
        "name": "Emergency Driver 3",
        "email": "emergency3@test.com",
        "mobile": "+1111111113",
        "password": "password123",
        "user_type": "driver",
        "location": {"latitude": 40.7505, "longitude": -73.9934}  # Central Park
    },
    {
        "name": "Emergency Driver 4",
        "email": "emergency4@test.com",
        "mobile": "+1111111114",
        "password": "password123",
        "user_type": "driver",
        "location": {"latitude": 40.6892, "longitude": -74.0445}  # Statue of Liberty
    },
    {
        "name": "Emergency Driver 5",
        "email": "emergency5@test.com",
        "mobile": "+1111111115",
        "password": "password123",
        "user_type": "driver",
        "location": {"latitude": 40.7614, "longitude": -73.9776}  # Broadway
    }
]

def add_sample_drivers():
    """Add sample drivers with locations to the database"""
    
    print("🚑 Adding Sample Drivers with Locations")
    print("=" * 50)
    
    for i, driver in enumerate(SAMPLE_DRIVERS, 1):
        print(f"\n{i}️⃣ Adding sample driver: {driver['name']}")
        
        try:
            # Signup driver
            signup_data = {k: v for k, v in driver.items() if k != 'location'}
            response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
            
            if response.status_code == 201:
                result = response.json()
                user_id = result.get('user_id')
                print(f"   ✅ Driver added! User ID: {user_id}")
                
                # Login to get token
                login_data = {
                    "phone_or_email": driver['email'],
                    "password": driver['password'],
                    "user_type": "driver"
                }
                
                login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
                
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    token = login_result.get('access_token')
                    
                    # Set driver as available
                    headers = {"Authorization": f"Bearer {token}"}
                    availability_data = {"is_available": True}
                    
                    update_response = requests.put(
                        f"{BASE_URL}/drivers/availability", 
                        json=availability_data, 
                        headers=headers
                    )
                    
                    if update_response.status_code == 200:
                        print(f"   ✅ Driver set as available")
                    else:
                        print(f"   ⚠️ Failed to set availability: {update_response.text}")
                    
                    # Add location (this would typically be done via WebSocket in real app)
                    print(f"   📍 Location: {driver['location']['latitude']}, {driver['location']['longitude']}")
                    
                    # Logout
                    logout_response = requests.delete(f"{BASE_URL}/auth/logout", headers=headers)
                    if logout_response.status_code == 200:
                        print(f"   ✅ Logout successful")
                    
                else:
                    print(f"   ❌ Login failed: {login_response.text}")
                    
            else:
                print(f"   ❌ Failed to add driver: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Sample drivers addition completed!")

if __name__ == "__main__":
    add_sample_drivers()
