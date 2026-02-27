#!/usr/bin/env python3
"""
Test script for driver WebSocket functionality
"""
import asyncio
import websockets
import json
import requests

# Configuration
BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws"
TEST_DRIVER_EMAIL = "driver@test.com"
TEST_DRIVER_PASSWORD = "password123"

async def test_driver_websocket():
    """Test driver WebSocket connection and functionality"""
    
    print("🧪 Testing Driver WebSocket")
    print("=" * 40)
    
    # Step 1: Login to get token
    print("\n1️⃣ Getting authentication token...")
    login_data = {
        "phone_or_email": TEST_DRIVER_EMAIL,
        "password": TEST_DRIVER_PASSWORD,
        "user_type": "driver"
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
                    "role": "driver",
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
                
            except asyncio.TimeoutError:
                print("   ⚠️ No response received within timeout")
            
            # Step 5: Send location update
            print("\n5️⃣ Testing location update...")
            location_message = {
                "type": "add-location",
                "data": {
                    "driver_id": user_id,
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "timestamp": "2024-01-01T12:00:00Z"
                }
            }
            
            await websocket.send(json.dumps(location_message))
            print("   ✅ Location update sent!")
            
            # Wait for location update response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                message = json.loads(response)
                print(f"   📨 Location response: {message.get('type', 'unknown')}")
                
                if message.get('type') == 'location_updated':
                    print("   ✅ Location update confirmed!")
                
            except asyncio.TimeoutError:
                print("   ⚠️ No location response received within timeout")
            
            # Step 6: Send ping
            print("\n6️⃣ Testing ping/pong...")
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
            
    except Exception as e:
        print(f"   ❌ WebSocket error: {str(e)}")
    
    print("\n" + "=" * 40)
    print("🏁 Driver WebSocket test completed!")

if __name__ == "__main__":
    asyncio.run(test_driver_websocket())
