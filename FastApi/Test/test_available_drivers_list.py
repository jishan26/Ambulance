#!/usr/bin/env python3
"""
Test script to check available drivers list endpoint
"""
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"


def test_available_drivers_list():
    """Test the available drivers list endpoint"""

    print("🧪 Testing Available Drivers List Endpoint")
    print("=" * 50)

    try:
        # Test the new endpoint
        print("\n1️⃣ Testing /drivers/available endpoint...")
        response = requests.get(f"{BASE_URL}/drivers/available")
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Success!")
            print(f"   Count: {data.get('count', 'N/A')}")
            print(f"   Message: {data.get('message', 'N/A')}")
            
            drivers = data.get('available_drivers', [])
            print(f"   Available drivers list:")
            for i, driver in enumerate(drivers, 1):
                print(f"     {i}. ID: {driver.get('driver_id')}, Name: {driver.get('name')}, Available: {driver.get('is_available')}")
        else:
            print(f"   ❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    test_available_drivers_list()
