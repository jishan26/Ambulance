#!/usr/bin/env python3
"""
Test script to verify that multiple drivers can decline the same trip request
without affecting other drivers' ability to see the request.
"""

import requests
import json
import time

# Test configuration
BASE_URL = "http://127.0.0.1:8000"
RIDER_EMAIL = "rider@test.com"
DRIVER1_EMAIL = "driver1@test.com" 
DRIVER2_EMAIL = "driver2@test.com"
DRIVER3_EMAIL = "driver3@test.com"

def login_user(email, password="password123"):
    """Login a user and return the access token"""
    response = requests.post(f"{BASE_URL}/login", json={
        "email": email,
        "password": password
    })
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"❌ Failed to login {email}: {response.text}")
        return None

def create_trip_request(token):
    """Create a trip request as a rider"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/trip-requests", json={
        "pickup_location": "Test Location",
        "destination": "Test Destination",
        "fare": 100.0
    }, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Trip request created: {data['req_id']}")
        return data["req_id"]
    else:
        print(f"❌ Failed to create trip request: {response.text}")
        return None

def get_trip_requests(token):
    """Get trip requests for a driver"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/trip-requests", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data)} trip requests")
        return data
    else:
        print(f"❌ Failed to get trip requests: {response.text}")
        return []

def decline_trip_request(token, req_id):
    """Decline a trip request as a driver"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/decline_request/{req_id}", headers=headers)
    
    if response.status_code == 200:
        print(f"✅ Trip request {req_id} declined successfully")
        return True
    else:
        print(f"❌ Failed to decline trip request: {response.text}")
        return False

def main():
    print("🧪 Testing Multiple Driver Declines")
    print("=" * 50)
    
    # Step 1: Login all users
    print("\n1. Logging in users...")
    rider_token = login_user(RIDER_EMAIL)
    driver1_token = login_user(DRIVER1_EMAIL)
    driver2_token = login_user(DRIVER2_EMAIL)
    driver3_token = login_user(DRIVER3_EMAIL)
    
    if not all([rider_token, driver1_token, driver2_token, driver3_token]):
        print("❌ Failed to login all users")
        return
    
    # Step 2: Create trip request
    print("\n2. Creating trip request...")
    req_id = create_trip_request(rider_token)
    if not req_id:
        print("❌ Failed to create trip request")
        return
    
    # Step 3: Check that all drivers can see the request
    print("\n3. Checking that all drivers can see the request...")
    driver1_requests = get_trip_requests(driver1_token)
    driver2_requests = get_trip_requests(driver2_token)
    driver3_requests = get_trip_requests(driver3_token)
    
    if not all([driver1_requests, driver2_requests, driver3_requests]):
        print("❌ Not all drivers can see the request")
        return
    
    # Step 4: Driver 1 declines
    print("\n4. Driver 1 declining...")
    decline_trip_request(driver1_token, req_id)
    
    # Step 5: Check that Driver 1 can no longer see the request
    print("\n5. Checking that Driver 1 can no longer see the request...")
    driver1_requests_after = get_trip_requests(driver1_token)
    if len(driver1_requests_after) == len(driver1_requests) - 1:
        print("✅ Driver 1 can no longer see the request")
    else:
        print("❌ Driver 1 can still see the request")
    
    # Step 6: Check that Driver 2 and 3 can still see the request
    print("\n6. Checking that Driver 2 and 3 can still see the request...")
    driver2_requests_after = get_trip_requests(driver2_token)
    driver3_requests_after = get_trip_requests(driver3_token)
    
    if len(driver2_requests_after) == len(driver2_requests):
        print("✅ Driver 2 can still see the request")
    else:
        print("❌ Driver 2 can no longer see the request")
    
    if len(driver3_requests_after) == len(driver3_requests):
        print("✅ Driver 3 can still see the request")
    else:
        print("❌ Driver 3 can no longer see the request")
    
    # Step 7: Driver 2 declines
    print("\n7. Driver 2 declining...")
    decline_trip_request(driver2_token, req_id)
    
    # Step 8: Check that Driver 3 can still see the request
    print("\n8. Checking that Driver 3 can still see the request...")
    driver3_requests_final = get_trip_requests(driver3_token)
    
    if len(driver3_requests_final) == len(driver3_requests):
        print("✅ Driver 3 can still see the request")
        print("🎉 SUCCESS: Multiple driver declines work correctly!")
    else:
        print("❌ Driver 3 can no longer see the request")
        print("❌ FAILED: Multiple driver declines not working correctly")

if __name__ == "__main__":
    main()
