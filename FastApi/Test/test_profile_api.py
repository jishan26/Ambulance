#!/usr/bin/env python3
"""
Test script for profile API endpoints
"""
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_DRIVER_EMAIL = "driver@test.com"
TEST_DRIVER_PASSWORD = "password123"

def test_profile_api():
    """Test profile API endpoints"""
    
    print("🧪 Testing Profile API")
    print("=" * 40)
    
    auth_token = None
    user_id = None
    
    # Step 1: Login to get token
    print("\n1️⃣ Getting authentication token...")
    login_data = {
        "phone_or_email": TEST_DRIVER_EMAIL,
        "password": TEST_DRIVER_PASSWORD,
        "user_type": "driver"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if login_response.status_code == 200:
            login_data = login_response.json()
            auth_token = login_data.get('access_token')
            user_id = login_data.get('user_id')
            print(f"   ✅ Login successful! User ID: {user_id}")
        else:
            print(f"   ❌ Login failed: {login_response.text}")
            return
    except Exception as e:
        print(f"   ❌ Login error: {str(e)}")
        return
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Step 2: Test get driver profile
    print(f"\n2️⃣ Testing GET /profile/driver/{user_id}...")
    try:
        response = requests.get(f"{BASE_URL}/profile/driver/{user_id}")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            profile_data = response.json()
            print("   ✅ Driver profile retrieved!")
            print(f"   Name: {profile_data.get('name')}")
            print(f"   Email: {profile_data.get('email')}")
            print(f"   Mobile: {profile_data.get('mobile')}")
            print(f"   Ratings: {profile_data.get('ratings')}")
            print(f"   Available: {profile_data.get('is_available')}")
        else:
            print(f"   ❌ Failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Step 3: Test update driver profile
    print(f"\n3️⃣ Testing PUT /profile/driver/{user_id}...")
    try:
        update_data = {
            "name": "Updated Driver Name",
            "ratings": 4.8
        }
        
        response = requests.put(
            f"{BASE_URL}/profile/driver/{user_id}", 
            json=update_data
        )
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            profile_data = response.json()
            print("   ✅ Driver profile updated!")
            print(f"   Updated Name: {profile_data.get('name')}")
            print(f"   Updated Ratings: {profile_data.get('ratings')}")
        else:
            print(f"   ❌ Failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Step 4: Test get updated profile
    print(f"\n4️⃣ Testing GET /profile/driver/{user_id} after update...")
    try:
        response = requests.get(f"{BASE_URL}/profile/driver/{user_id}")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            profile_data = response.json()
            print("   ✅ Updated driver profile retrieved!")
            print(f"   Name: {profile_data.get('name')}")
            print(f"   Ratings: {profile_data.get('ratings')}")
        else:
            print(f"   ❌ Failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 40)
    print("🏁 Profile API test completed!")

if __name__ == "__main__":
    test_profile_api()
