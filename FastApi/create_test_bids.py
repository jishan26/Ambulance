#!/usr/bin/env python3
"""
Create test driver bid notifications directly in the database.
"""

from sqlmodel import Session, select
from db import engine
from models import Notification
from datetime import datetime


def create_test_bids():
    """Create test driver bid notifications in the database."""

    with Session(engine) as session:
        # Test driver bid notifications
        test_bids = [
            {
                "recipient_id": 2,  # MD Rahadul (rider)
                "recipient_type": "rider",
                "notification_type": "driver_bid_sent",
                "title": "Driver Sent You a Bid",
                "message": "Driver John Smith sent you a bid of ৳300 for your trip to Badda General Hospital",
                "req_id": 136,
                "bid_amount": 300,
                "pickup_location": "unnamed road, Satarkul, Dhaka - 1212, Bangladesh",
                "destination": "Badda General Hospital",
                "driver_name": "John Smith",
                "driver_mobile": "01712345678",
                "rider_name": "MD Rahadul",
                "status": "unread",
                "sender_id": 3,  # money (driver)
                "sender_type": "driver",
                "timestamp": datetime.now()
            },
            {
                "recipient_id": 2,  # MD Rahadul (rider)
                "recipient_type": "rider",
                "notification_type": "driver_bid_sent",
                "title": "Driver Sent You a Bid",
                "message": "Driver Sarah Johnson sent you a bid of ৳250 for your trip to Badda General Hospital",
                "req_id": 136,
                "bid_amount": 250,
                "pickup_location": "unnamed road, Satarkul, Dhaka - 1212, Bangladesh",
                "destination": "Badda General Hospital",
                "driver_name": "Sarah Johnson",
                "driver_mobile": "01787654321",
                "rider_name": "MD Rahadul",
                "status": "unread",
                "sender_id": 2,  # put (driver)
                "sender_type": "driver",
                "timestamp": datetime.now()
            },
            {
                "recipient_id": 2,  # MD Rahadul (rider)
                "recipient_type": "rider",
                "notification_type": "driver_bid_sent",
                "title": "Driver Sent You a Bid",
                "message": "Driver Ahmed Hassan sent you a bid of ৳400 for your trip to Badda General Hospital",
                "req_id": 136,
                "bid_amount": 400,
                "pickup_location": "unnamed road, Satarkul, Dhaka - 1212, Bangladesh",
                "destination": "Badda General Hospital",
                "driver_name": "Ahmed Hassan",
                "driver_mobile": "01912345678",
                "rider_name": "MD Rahadul",
                "status": "unread",
                "sender_id": 3,  # money (driver)
                "sender_type": "driver",
                "timestamp": datetime.now()
            }
        ]

        print("🚀 Creating test driver bid notifications...")
        print(f"📅 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

        success_count = 0

        for i, bid_data in enumerate(test_bids, 1):
            try:
                print(
                    f"\n{i}️⃣ Creating bid from {bid_data['driver_name']}...")

                # Create notification object
                notification = Notification(**bid_data)

                # Add to session
                session.add(notification)
                session.commit()
                session.refresh(notification)

                print(f"   ✅ Created bid for ৳{bid_data['bid_amount']}")
                print(f"   📧 Notification ID: {notification.notification_id}")
                success_count += 1

            except Exception as e:
                print(f"   ❌ Error: {e}")
                session.rollback()

        print("\n" + "=" * 60)
        print(
            f"📊 Results: {success_count}/{len(test_bids)} bids created successfully")

        if success_count > 0:
            print("\n🎉 Test driver bids created! Now check the rider dashboard.")
            print(
                "💡 The bidding system should now show driver bids with Accept/Reject/Counter buttons.")
        else:
            print("\n❌ No bids were created. Check the database connection.")


if __name__ == "__main__":
    create_test_bids()
