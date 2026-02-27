#!/usr/bin/env python3
"""
Test script to create notifications for drivers to test the driver dashboard notification system.
"""

from sqlmodel import Session, select
from db import engine
from models import Notification
from datetime import datetime

def create_driver_notifications():
    """Create test notifications for drivers."""
    
    with Session(engine) as session:
        # Test notifications for drivers
        test_notifications = [
            {
                "recipient_id": 3,  # money (driver)
                "recipient_type": "driver",
                "notification_type": "rider_bid",
                "title": "New Trip Request",
                "message": "Rider MD Rahadul has requested a trip to Badda General Hospital",
                "req_id": 131,
                "bid_amount": 250,
                "pickup_location": "unnamed road, Satarkul, Dhaka - 1212, Bangladesh",
                "destination": "Badda General Hospital",
                "rider_name": "MD Rahadul",
                "rider_mobile": "01908146326",
                "driver_name": "money",
                "status": "unread",
                "sender_id": 2,  # MD Rahadul (rider)
                "sender_type": "rider",
                "timestamp": datetime.now()
            },
            {
                "recipient_id": 2,  # put (driver)
                "recipient_type": "driver",
                "notification_type": "rider_bid",
                "title": "New Trip Request",
                "message": "Rider MD Rahadul has requested a trip to Badda General Hospital",
                "req_id": 131,
                "bid_amount": 300,
                "pickup_location": "unnamed road, Satarkul, Dhaka - 1212, Bangladesh",
                "destination": "Badda General Hospital",
                "rider_name": "MD Rahadul",
                "rider_mobile": "01908146326",
                "driver_name": "put",
                "status": "unread",
                "sender_id": 2,  # MD Rahadul (rider)
                "sender_type": "rider",
                "timestamp": datetime.now()
            },
            {
                "recipient_id": 3,  # money (driver)
                "recipient_type": "driver",
                "notification_type": "bid_accepted",
                "title": "Bid Accepted",
                "message": "Rider MD Rahadul accepted your bid of ৳300 for the trip to Badda General Hospital",
                "req_id": 131,
                "bid_amount": 300,
                "pickup_location": "unnamed road, Satarkul, Dhaka - 1212, Bangladesh",
                "destination": "Badda General Hospital",
                "rider_name": "MD Rahadul",
                "rider_mobile": "01908146326",
                "driver_name": "money",
                "status": "unread",
                "sender_id": 2,  # MD Rahadul (rider)
                "sender_type": "rider",
                "timestamp": datetime.now()
            }
        ]
        
        print("🚀 Creating test driver notifications...")
        print(f"📅 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        success_count = 0
        
        for i, notif_data in enumerate(test_notifications, 1):
            try:
                print(f"\n{i}️⃣ Creating notification for driver {notif_data['driver_name']}...")
                
                # Create notification object
                notification = Notification(**notif_data)
                
                # Add to session
                session.add(notification)
                session.commit()
                session.refresh(notification)
                
                print(f"   ✅ Created {notif_data['notification_type']} notification")
                print(f"   📧 Notification ID: {notification.notification_id}")
                print(f"   💰 Amount: ৳{notif_data['bid_amount']}")
                success_count += 1
                
            except Exception as e:
                print(f"   ❌ Error: {e}")
                session.rollback()
        
        print("\n" + "=" * 60)
        print(f"📊 Results: {success_count}/{len(test_notifications)} notifications created successfully")
        
        if success_count > 0:
            print("\n🎉 Test driver notifications created!")
            print("💡 Now test the driver dashboard to see if notifications appear.")
            print("🔍 Check driver dashboard notifications for:")
            print("   - New trip requests")
            print("   - Bid acceptance notifications")
        else:
            print("\n❌ No notifications were created. Check the database connection.")

if __name__ == "__main__":
    create_driver_notifications()
