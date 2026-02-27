#!/usr/bin/env python3
"""
Test script for rider WebSocket connection
"""
import asyncio
import websockets
import json
import requests

# Configuration
BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws"
TEST_RIDER_EMAIL = "rider@test.com"
TEST_RIDER_PASSWORD = "password123"

async def test_rider_connection():
    """Test rider WebSocket connection and functionality"""
    
    print("🧪 Testing Rider WebSocket Connection")
    print("=" * 50)
    
    # Step 1: Login to get token
    print("\n1️⃣ Getting authentication token...")
    login_data = {
        "phone_or_email": TEST_RIDER_EMAIL,
        "password": TEST_RIDER_PASSWORD,
        "user_type": "rider"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if login_response.status_code != 200:
            print(f"   ❌ Login failed: {login_response.text}")
            return
        
        login_data = login_response.json()
        token = login_data.get('access_token')
        user_id = login_data.get('user_id')
        
        if not token:
            print("   ❌ No access token received")
            return
            
        print(f"   ✅ Login successful! User ID: {user_id}")
        
    except Exception as e:
        print(f"   ❌ Login error: {str(e)}")
        return
    
    # Step 2: Connect to WebSocket
    print("\n2️⃣ Connecting to WebSocket...")
    try:
        uri = f"{WS_URL}?token={token}"
        async with websockets.connect(uri) as websocket:
            print("   ✅ WebSocket connected!")
            
            # Step 3: Send new-client message
            print("\n3️⃣ Sending new-client message...")
            new_client_message = {
                "type": "new-client",
                "data": {
                    "id": user_id,
                    "role": "rider",
                    "token": token
                }
            }
            
            await websocket.send(json.dumps(new_client_message))
            print("   ✅ New-client message sent!")
            
            # Step 4: Listen for responses
            print("\n4️⃣ Listening for WebSocket messages...")
            try:
                # Wait for connection confirmation
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                message = json.loads(response)
                print(f"   📨 Received: {message.get('type', 'unknown')}")
                
                if message.get('type') == 'connection_established':
                    print("   ✅ Connection established!")
                elif message.get('type') == 'client_registered':
                    print("   ✅ Client registered!")
                
                # Check for nearby drivers data
                if message.get('type') == 'nearby-drivers':
                    drivers = message.get('data', [])
                    print(f"   🚑 Received {len(drivers)} nearby drivers!")
                    for i, driver in enumerate(drivers[:3], 1):  # Show first 3
                        print(f"     {i}. Driver ID: {driver.get('id')}, Location: {driver.get('latitude')}, {driver.get('longitude')}")
                
            except asyncio.TimeoutError:
                print("   ⚠️ No response received within timeout")
            
            # Step 5: Send ping
            print("\n5️⃣ Testing ping/pong...")
            ping_message = {
                "type": "ping",
                "timestamp": "2024-01-01T12:00:00Z"
            }
            
            await websocket.send(json.dumps(ping_message))
            print("   ✅ Ping sent!")
            
            # Wait for pong response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                message = json.loads(response)
                print(f"   📨 Pong response: {message.get('type', 'unknown')}")
                
                if message.get('type') == 'pong':
                    print("   ✅ Pong received!")
                
            except asyncio.TimeoutError:
                print("   ⚠️ No pong response received within timeout")
            
            # Step 6: Test trip request
            print("\n6️⃣ Testing trip request...")
            trip_request = {
                "type": "new-trip-request",
                "data": {
                    "req_id": 123,
                    "rider_id": user_id,
                    "pickup_location": "Test Pickup",
                    "destination": "Test Destination",
                    "fare": 25.50,
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "timestamp": "2024-01-01T12:00:00Z",
                    "status": "pending"
                }
            }
            
            await websocket.send(json.dumps(trip_request))
            print("   ✅ Trip request sent!")
            
            # Wait for trip request response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                message = json.loads(response)
                print(f"   📨 Trip response: {message.get('type', 'unknown')}")
                
            except asyncio.TimeoutError:
                print("   ⚠️ No trip response received within timeout")
            
    except Exception as e:
        print(f"   ❌ WebSocket error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Rider connection test completed!")

if __name__ == "__main__":
    asyncio.run(test_rider_connection())
