#!/usr/bin/env python3
"""
Test script for driver login functionality
"""
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_DRIVER_EMAIL = "driver@test.com"
TEST_DRIVER_PASSWORD = "password123"

def test_driver_login():
    """Test driver login functionality"""
    
    print("🧪 Testing Driver Login")
    print("=" * 40)
    
    # Test data
    login_data = {
        "phone_or_email": TEST_DRIVER_EMAIL,
        "password": TEST_DRIVER_PASSWORD,
        "user_type": "driver"
    }
    
    try:
        print("\n1️⃣ Attempting driver login...")
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Login successful!")
            print(f"   User ID: {data.get('user_id')}")
            print(f"   Role: {data.get('role')}")
            print(f"   Name: {data.get('name')}")
            print(f"   Email: {data.get('email')}")
            print(f"   Mobile: {data.get('mobile')}")
            print(f"   Access Token: {data.get('access_token', 'Not provided')[:20]}...")
            
            # Test token validation
            if data.get('access_token'):
                print("\n2️⃣ Testing token validation...")
                headers = {"Authorization": f"Bearer {data['access_token']}"}
                validate_response = requests.get(f"{BASE_URL}/auth/validate-token", headers=headers)
                
                if validate_response.status_code == 200:
                    validate_data = validate_response.json()
                    print("   ✅ Token validation successful!")
                    print(f"   Valid: {validate_data.get('valid')}")
                    print(f"   ID: {validate_data.get('id')}")
                    print(f"   Role: {validate_data.get('role')}")
                else:
                    print(f"   ❌ Token validation failed: {validate_response.text}")
            
        else:
            print(f"   ❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 40)
    print("🏁 Driver login test completed!")

if __name__ == "__main__":
    test_driver_login()
