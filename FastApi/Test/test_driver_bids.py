#!/usr/bin/env python3
"""
Test script to create driver bid notifications for testing the bidding system.
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"

# Test data
TEST_DRIVER_BIDS = [
    {
        "recipient_id": 2,  # MD Rahadul (rider)
        "recipient_type": "rider",
        "notification_type": "driver_bid_sent",
        "title": "Driver Sent You a Bid",
        "message": "Driver John Smith sent you a bid of ৳300 for your trip to Badda General Hospital",
        "req_id": 1,
        "bid_amount": 300,
        "pickup_location": "unnamed road, Satarkul, Dhaka - 1212, Bangladesh",
        "destination": "Badda General Hospital",
        "driver_name": "John Smith",
        "driver_mobile": "01712345678",
        "rider_name": "MD Rahadul",
        "status": "unread",
        "sender_id": 3,  # money (driver)
        "sender_type": "driver"
    },
    {
        "recipient_id": 2,  # MD Rahadul (rider)
        "recipient_type": "rider",
        "notification_type": "driver_bid_sent",
        "title": "Driver Sent You a Bid",
        "message": "Driver Sarah Johnson sent you a bid of ৳250 for your trip to Badda General Hospital",
        "req_id": 1,
        "bid_amount": 250,
        "pickup_location": "unnamed road, Satarkul, Dhaka - 1212, Bangladesh",
        "destination": "Badda General Hospital",
        "driver_name": "Sarah Johnson",
        "driver_mobile": "01787654321",
        "rider_name": "MD Rahadul",
        "status": "unread",
        "sender_id": 2,  # put (driver)
        "sender_type": "driver"
    },
    {
        "recipient_id": 2,  # MD Rahadul (rider)
        "recipient_type": "rider",
        "notification_type": "driver_bid_sent",
        "title": "Driver Sent You a Bid",
        "message": "Driver Ahmed Hassan sent you a bid of ৳400 for your trip to Badda General Hospital",
        "req_id": 1,
        "bid_amount": 400,
        "pickup_location": "unnamed road, Satarkul, Dhaka - 1212, Bangladesh",
        "destination": "Badda General Hospital",
        "driver_name": "Ahmed Hassan",
        "driver_mobile": "01912345678",
        "rider_name": "MD Rahadul",
        "status": "unread",
        "sender_id": 3,  # money (driver)
        "sender_type": "driver"
    }
]

def create_driver_bid(bid_data):
    """Create a driver bid notification."""
    try:
        response = requests.post(
            f"{BASE_URL}/notifications",
            json=bid_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Created bid from {bid_data['driver_name']} for ৳{bid_data['bid_amount']}")
            print(f"   Notification ID: {result.get('notification_id')}")
            return True
        else:
            print(f"❌ Failed to create bid from {bid_data['driver_name']}")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating bid from {bid_data['driver_name']}: {e}")
        return False

def main():
    print("🚀 Creating test driver bids for bidding system...")
    print(f"📅 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    success_count = 0
    
    for i, bid_data in enumerate(TEST_DRIVER_BIDS, 1):
        print(f"\n{i}️⃣ Creating bid from {bid_data['driver_name']}...")
        if create_driver_bid(bid_data):
            success_count += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Results: {success_count}/{len(TEST_DRIVER_BIDS)} bids created successfully")
    
    if success_count > 0:
        print("\n🎉 Test driver bids created! Now check the rider dashboard.")
        print("💡 The bidding system should now show driver bids with Accept/Reject/Counter buttons.")
    else:
        print("\n❌ No bids were created. Check the server and database connection.")

if __name__ == "__main__":
    main()
