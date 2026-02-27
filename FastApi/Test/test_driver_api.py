#!/usr/bin/env python3
"""
Test script to verify driver API integration
"""

import requests
import json
from datetime import datetime

API_BASE_URL = "http://127.0.0.1:8000/api"

def test_driver_api():
    """Test the driver API endpoints"""
    
    print("🧪 Testing Driver API Integration...")
    
    # Test driver ID
    driver_id = 1
    
    try:
        # Test 1: Get driver profile
        print(f"\n1️⃣ Testing GET /api/driver/profile/{driver_id}")
        response = requests.get(f"{API_BASE_URL}/driver/profile/{driver_id}")
        
        if response.status_code == 200:
            profile_data = response.json()
            print("✅ Driver profile fetched successfully!")
            print(f"   Name: {profile_data.get('name', 'N/A')}")
            print(f"   Email: {profile_data.get('email', 'N/A')}")
            print(f"   Completed Trips: {profile_data.get('completed_trips', 0)}")
            print(f"   Experience: {profile_data.get('experience_years', 0)} years")
            print(f"   Certifications: {len(profile_data.get('certifications', []))}")
        else:
            print(f"❌ Failed to fetch driver profile: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        # Test 2: Get driver stats
        print(f"\n2️⃣ Testing GET /api/driver/stats/{driver_id}")
        response = requests.get(f"{API_BASE_URL}/driver/stats/{driver_id}")
        
        if response.status_code == 200:
            stats_data = response.json()
            print("✅ Driver stats fetched successfully!")
            print(f"   Completed Trips: {stats_data.get('completed_trips', 0)}")
            print(f"   Experience: {stats_data.get('experience_years', 0)} years")
            print(f"   Shift: {stats_data.get('shift_hours', 'N/A')}")
            print(f"   Available: {stats_data.get('is_available', False)}")
        else:
            print(f"❌ Failed to fetch driver stats: {response.status_code}")
            print(f"   Response: {response.text}")
        
        # Test 3: Update driver profile
        print(f"\n3️⃣ Testing PUT /api/driver/profile/{driver_id}")
        update_data = {
            "base_location": "Updated Test Location",
            "languages": "English, Spanish, French, German",
            "equipment": "Updated equipment list",
            "is_available": True
        }
        
        response = requests.put(
            f"{API_BASE_URL}/driver/profile/{driver_id}",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Driver profile updated successfully!")
        else:
            print(f"❌ Failed to update driver profile: {response.status_code}")
            print(f"   Response: {response.text}")
        
        print("\n🎉 All tests completed!")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server. Make sure FastAPI is running on port 8000")
        return False
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        return False

if __name__ == "__main__":
    test_driver_api()
