#!/usr/bin/env python3
"""
Test the notification API to ensure it's working properly.
"""

import requests
import json
from sqlmodel import Session, select
from db import engine
from models import Notification

def test_notification_api():
    """Test the notification API endpoint."""
    
    print("🧪 Testing Notification API")
    print("=" * 50)
    
    # First, check what notifications exist in the database
    with Session(engine) as session:
        notifications = session.query(Notification).filter(
            Notification.notification_type == "driver_bid_sent",
            Notification.status == "unread"
        ).all()
        
        print(f"📊 Database Status:")
        print(f"   Found {len(notifications)} unread driver_bid_sent notifications")
        
        for notif in notifications:
            print(f"   - ID: {notif.notification_id}")
            print(f"     Driver: {notif.driver_name}")
            print(f"     Amount: ৳{notif.bid_amount}")
            print(f"     Recipient: {notif.recipient_id}")
            print(f"     Status: {notif.status}")
            print()
    
    # Test API endpoint (this will fail without proper auth, but we can see the structure)
    try:
        print("🌐 Testing API Endpoint:")
        response = requests.get("http://127.0.0.1:8000/notifications")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 401:
            print("   ✅ API is running but requires authentication (expected)")
        else:
            print("   ❌ Unexpected response")
            
    except Exception as e:
        print(f"   ❌ API Error: {e}")
    
    print("\n💡 Frontend should fetch notifications with proper authentication")
    print("   The BidNegotiation component should show driver bids if:")
    print("   1. User is logged in as rider")
    print("   2. Notifications exist in database")
    print("   3. API returns notifications successfully")
    
    return len(notifications) > 0

if __name__ == "__main__":
    has_notifications = test_notification_api()
    
    if has_notifications:
        print("\n🎉 SUCCESS: Notifications exist in database!")
        print("   The bidding interface should show driver bids.")
        print("   Check browser console for debugging logs.")
    else:
        print("\n❌ ISSUE: No notifications found in database.")
        print("   Create a test notification first.")
