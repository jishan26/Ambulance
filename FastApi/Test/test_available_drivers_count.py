#!/usr/bin/env python3
"""
Test script to check available drivers count endpoint
"""
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"

def test_available_drivers_count():
    """Test the available drivers count endpoint"""
    
    print("🧪 Testing Available Drivers Count Endpoint")
    print("=" * 50)
    
    try:
        # Test the new endpoint
        print("\n1️⃣ Testing /drivers/available-count endpoint...")
        response = requests.get(f"{BASE_URL}/drivers/available-count")
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Success!")
            print(f"   Available drivers: {data.get('available_drivers', 'N/A')}")
            print(f"   Unavailable drivers: {data.get('unavailable_drivers', 'N/A')}")
            print(f"   Total drivers: {data.get('total_drivers', 'N/A')}")
            print(f"   Message: {data.get('message', 'N/A')}")
        else:
            print(f"   ❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test the original endpoint for comparison
    print("\n2️⃣ Testing /drivers/count endpoint for comparison...")
    try:
        response = requests.get(f"{BASE_URL}/drivers/count")
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Success!")
            print(f"   Total drivers: {data.get('total_drivers', 'N/A')}")
            print(f"   Message: {data.get('message', 'N/A')}")
        else:
            print(f"   ❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    test_available_drivers_count()
