#!/usr/bin/env python3
"""
Script to add test drivers for development
"""
import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_DRIVERS = [
    {
        "name": "Test Driver 1",
        "email": "testdriver1@test.com",
        "mobile": "+2000000001",
        "password": "test123",
        "user_type": "driver"
    },
    {
        "name": "Test Driver 2",
        "email": "testdriver2@test.com",
        "mobile": "+2000000002",
        "password": "test123",
        "user_type": "driver"
    },
    {
        "name": "Test Driver 3",
        "email": "testdriver3@test.com",
        "mobile": "+2000000003",
        "password": "test123",
        "user_type": "driver"
    }
]


def add_test_drivers():
    """Add test drivers for development"""

    print("🧪 Adding Test Drivers for Development")
    print("=" * 50)

    for i, driver in enumerate(TEST_DRIVERS, 1):
        print(f"\n{i}️⃣ Adding test driver: {driver['name']}")

        try:
            response = requests.post(f"{BASE_URL}/auth/signup", json=driver)

            if response.status_code == 201:
                result = response.json()
                print(f"   ✅ Test driver added!")
                print(f"   User ID: {result.get('user_id')}")
                print(f"   Name: {result.get('name')}")
                print(f"   Email: {result.get('email')}")
                print(f"   Mobile: {result.get('mobile')}")
            else:
                print(f"   ❌ Failed to add test driver: {response.text}")

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")

    print("\n" + "=" * 50)
    print("🏁 Test drivers addition completed!")


if __name__ == "__main__":
    add_test_drivers()


