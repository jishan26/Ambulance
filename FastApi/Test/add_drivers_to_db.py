#!/usr/bin/env python3
"""
Script to add test drivers to the database
"""
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_DRIVERS = [
    {
        "name": "John Driver",
        "email": "driver1@test.com",
        "mobile": "+1234567890",
        "password": "password123",
        "user_type": "driver"
    },
    {
        "name": "Jane Driver",
        "email": "driver2@test.com",
        "mobile": "+1234567891",
        "password": "password123",
        "user_type": "driver"
    },
    {
        "name": "Bob Driver",
        "email": "driver3@test.com",
        "mobile": "+1234567892",
        "password": "password123",
        "user_type": "driver"
    },
    {
        "name": "Alice Driver",
        "email": "driver4@test.com",
        "mobile": "+1234567893",
        "password": "password123",
        "user_type": "driver"
    },
    {
        "name": "Charlie Driver",
        "email": "driver5@test.com",
        "mobile": "+1234567894",
        "password": "password123",
        "user_type": "driver"
    }
]

def add_drivers_to_db():
    """Add test drivers to the database"""
    
    print("🚑 Adding Test Drivers to Database")
    print("=" * 50)
    
    for i, driver in enumerate(TEST_DRIVERS, 1):
        print(f"\n{i}️⃣ Adding driver: {driver['name']} ({driver['email']})")
        
        try:
            response = requests.post(f"{BASE_URL}/auth/signup", json=driver)
            
            if response.status_code == 201:
                result = response.json()
                print(f"   ✅ Driver added successfully!")
                print(f"   User ID: {result.get('user_id')}")
                print(f"   Name: {result.get('name')}")
                print(f"   Email: {result.get('email')}")
            else:
                print(f"   ❌ Failed to add driver: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Test drivers addition completed!")

if __name__ == "__main__":
    add_drivers_to_db()
