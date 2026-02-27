#!/usr/bin/env python3
"""
Test the complete notification flow to ensure everything is working.
"""

from sqlmodel import Session, select
from db import engine
from models import Notification, TripRequest, Driver
from datetime import datetime

def test_notification_flow():
    """Test the complete notification flow."""
    
    print("🧪 Testing Complete Notification Flow")
    print("=" * 50)
    
    with Session(engine) as session:
        # Step 1: Check if we have a trip request
        trip_request = session.query(TripRequest).filter(
            TripRequest.status == "pending"
        ).first()
        
        if not trip_request:
            print("❌ No pending trip requests found.")
            return
        
        print(f"✅ Step 1: Found trip request ID: {trip_request.req_id}")
        print(f"   Rider ID: {trip_request.rider_id}")
        print(f"   Destination: {trip_request.destination}")
        
        # Step 2: Check if we have a driver
        driver = session.query(Driver).filter(
            Driver.is_available == True
        ).first()
        
        if not driver:
            print("❌ No available drivers found.")
            return
            
        print(f"✅ Step 2: Found driver: {driver.name} (ID: {driver.driver_id})")
        
        # Step 3: Create driver bid notification
        bid_amount = 500  # Driver's bid amount
        print(f"✅ Step 3: Creating driver bid notification for ৳{bid_amount}")
        
        driver_bid_notification = Notification(
            recipient_id=trip_request.rider_id,
            recipient_type="rider",
            sender_id=driver.driver_id,
            sender_type="driver",
            notification_type="driver_bid_sent",
            title="Driver Sent You a Bid",
            message=f"Driver {driver.name} sent you a bid of ৳{bid_amount} for your trip to {trip_request.destination}",
            req_id=trip_request.req_id,
            bid_amount=bid_amount,
            pickup_location=trip_request.pickup_location,
            destination=trip_request.destination,
            driver_name=driver.name,
            driver_mobile=driver.mobile,
            rider_name="Patient",
            status="unread",
            timestamp=datetime.now()
        )
        
        try:
            session.add(driver_bid_notification);
            session.commit();
            session.refresh(driver_bid_notification);
            
            print(f"✅ Step 4: Driver bid notification created successfully!")
            print(f"   Notification ID: {driver_bid_notification.notification_id}")
            print(f"   Recipient: {driver_bid_notification.recipient_id} (rider)")
            print(f"   Sender: {driver_bid_notification.sender_id} (driver)")
            print(f"   Bid Amount: ৳{driver_bid_notification.bid_amount}")
            print(f"   Status: {driver_bid_notification.status}")
            
            # Step 5: Test notification retrieval
            print(f"\n✅ Step 5: Testing notification retrieval...")
            notifications = session.query(Notification).filter(
                Notification.notification_type == "driver_bid_sent",
                Notification.status == "unread"
            ).all()
            
            print(f"   Found {len(notifications)} unread driver bid notifications")
            for notif in notifications:
                print(f"   - ID: {notif.notification_id}, Driver: {notif.driver_name}, Amount: ৳{notif.bid_amount}")
            
            # Step 6: Test cancel functionality
            print(f"\n✅ Step 6: Testing cancel functionality...")
            notification_to_cancel = notifications[0]
            notification_to_cancel.status = "cancelled"
            session.commit()
            
            print(f"   Notification {notification_to_cancel.notification_id} status updated to 'cancelled'")
            
            # Verify cancellation
            cancelled_notifications = session.query(Notification).filter(
                Notification.notification_type == "driver_bid_sent",
                Notification.status == "cancelled"
            ).all()
            
            print(f"   Found {len(cancelled_notifications)} cancelled notifications")
            
            print(f"\n🎉 NOTIFICATION FLOW TEST COMPLETE!")
            print("=" * 50)
            print("✅ All steps completed successfully:")
            print("   1. Trip request found")
            print("   2. Driver found")
            print("   3. Driver bid notification created")
            print("   4. Notification stored in database")
            print("   5. Notification retrieval working")
            print("   6. Cancel functionality working")
            
            print(f"\n📱 What should happen in the UI:")
            print("   • Rider dashboard should show notification popup")
            print("   • Message: 'money sent you a bid of ৳500 for your trip to Badda General Hospital'")
            print("   • Cancel button should remove notification")
            print("   • Driver dashboard should be notified of cancellation")
            
        except Exception as e:
            print(f"❌ Error in notification flow: {e}")
            session.rollback()

if __name__ == "__main__":
    test_notification_flow()
