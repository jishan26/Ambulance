#!/usr/bin/env python3
"""
Test script for WebSocket connection functionality
"""
import asyncio
import websockets
import json
import requests

# Configuration
BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws"

async def test_websocket_connection():
    """Test basic WebSocket connection functionality"""
    
    print("🧪 Testing WebSocket Connection")
    print("=" * 40)
    
    # Step 1: Test anonymous connection
    print("\n1️⃣ Testing anonymous WebSocket connection...")
    try:
        async with websockets.connect(WS_URL) as websocket:
            print("   ✅ Anonymous WebSocket connected!")
            
            # Wait for welcome message
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                message = json.loads(response)
                print(f"   📨 Received: {message.get('type', 'unknown')}")
                
                if message.get('type') == 'connection_established':
                    print("   ✅ Connection established!")
                    print(f"   Message: {message.get('message')}")
                    print(f"   Connection ID: {message.get('connection_id')}")
                
            except asyncio.TimeoutError:
                print("   ⚠️ No welcome message received within timeout")
            
            # Test ping/pong
            print("\n2️⃣ Testing ping/pong...")
            ping_message = {
                "type": "ping",
                "timestamp": "2024-01-01T12:00:00Z"
            }
            
            await websocket.send(json.dumps(ping_message))
            print("   ✅ Ping sent!")
            
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                message = json.loads(response)
                print(f"   📨 Pong response: {message.get('type', 'unknown')}")
                
                if message.get('type') == 'pong':
                    print("   ✅ Pong received!")
                
            except asyncio.TimeoutError:
                print("   ⚠️ No pong response received within timeout")
            
            # Test echo
            print("\n3️⃣ Testing echo functionality...")
            echo_message = {
                "type": "test",
                "data": "Hello WebSocket!"
            }
            
            await websocket.send(json.dumps(echo_message))
            print("   ✅ Echo message sent!")
            
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                message = json.loads(response)
                print(f"   📨 Echo response: {message.get('type', 'unknown')}")
                
                if message.get('type') == 'echo':
                    print("   ✅ Echo received!")
                    print(f"   Original message: {message.get('original_message')}")
                
            except asyncio.TimeoutError:
                print("   ⚠️ No echo response received within timeout")
            
    except Exception as e:
        print(f"   ❌ WebSocket connection error: {str(e)}")
    
    # Step 4: Test authenticated connection
    print("\n4️⃣ Testing authenticated WebSocket connection...")
    
    # First, try to login
    login_data = {
        "phone_or_email": "test@example.com",
        "password": "testpassword",
        "user_type": "driver"
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data.get('access_token')
            user_id = login_data.get('user_id')
            
            if token:
                print(f"   ✅ Login successful! User ID: {user_id}")
                
                # Connect with token
                uri = f"{WS_URL}?token={token}"
                async with websockets.connect(uri) as websocket:
                    print("   ✅ Authenticated WebSocket connected!")
                    
                    # Wait for authenticated welcome message
                    try:
                        response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                        message = json.loads(response)
                        print(f"   📨 Authenticated response: {message.get('type', 'unknown')}")
                        
                        if message.get('type') == 'connection_established':
                            print("   ✅ Authenticated connection established!")
                            print(f"   User ID: {message.get('user_id')}")
                            print(f"   User Role: {message.get('user_role')}")
                        
                    except asyncio.TimeoutError:
                        print("   ⚠️ No authenticated response received within timeout")
            else:
                print("   ❌ No access token received")
        else:
            print(f"   ❌ Login failed: {login_response.text}")
            print("   ℹ️ Skipping authenticated connection test")
            
    except Exception as e:
        print(f"   ❌ Login error: {str(e)}")
        print("   ℹ️ Skipping authenticated connection test")
    
    print("\n" + "=" * 40)
    print("🏁 WebSocket connection test completed!")

if __name__ == "__main__":
    asyncio.run(test_websocket_connection())
