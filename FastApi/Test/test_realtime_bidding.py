#!/usr/bin/env python3
"""
Test real-time bidding system by creating a driver bid notification.
This simulates the complete flow: Driver sends bid → Rider gets notification → Rider can cancel or accept.
"""

from sqlmodel import Session, select
from db import engine
from models import Notification, TripRequest, Driver
from datetime import datetime
import time

def test_realtime_bidding():
    """Test the complete real-time bidding flow."""
    
    print("🚀 Testing Real-Time Bidding System")
    print("=" * 50)
    
    with Session(engine) as session:
        # Find an active trip request
        trip_request = session.query(TripRequest).filter(
            TripRequest.status == "pending"
        ).first()
        
        if not trip_request:
            print("❌ No pending trip requests found.")
            print("💡 Please create a trip request first from the rider dashboard.")
            return
        
        print(f"🚑 Found trip request:")
        print(f"   ID: {trip_request.req_id}")
        print(f"   From: {trip_request.pickup_location}")
        print(f"   To: {trip_request.destination}")
        print(f"   Rider ID: {trip_request.rider_id}")
        
        # Find a driver
        driver = session.query(Driver).filter(
            Driver.is_available == True
        ).first()
        
        if not driver:
            print("❌ No available drivers found.")
            return
            
        print(f"👨‍⚕️ Driver: {driver.name} (ID: {driver.driver_id})")
        
        # Create driver bid notification
        bid_amount = 450  # Driver's bid amount
        print(f"💰 Driver bid: ৳{bid_amount}")
        
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
            
            print(f"✅ Real-time driver bid notification created!")
            print(f"📧 Notification ID: {driver_bid_notification.notification_id}")
            print(f"🎯 Recipient: {driver_bid_notification.recipient_id} (rider)")
            print(f"👨‍⚕️ Sender: {driver_bid_notification.sender_id} (driver)")
            print(f"💰 Bid Amount: ৳{driver_bid_notification.bid_amount}")
            
            print("\n🎉 REAL-TIME BIDDING SYSTEM TEST COMPLETE!")
            print("=" * 50)
            print("📱 What should happen now:")
            print("1. 🔔 Rider dashboard should show notification popup")
            print("2. 📋 Notification shows driver name and bid amount")
            print("3. ❌ Cancel button - removes notification permanently")
            print("4. ✅ View Bid button - opens bidding interface")
            print("5. 🔄 All updates happen in real-time")
            
            print("\n💡 Test the flow:")
            print("• Go to rider dashboard")
            print("• You should see the notification popup")
            print("• Try clicking 'Cancel' - notification should disappear")
            print("• Try clicking 'View Bid' - should open bidding interface")
            
        except Exception as e:
            print(f"❌ Error creating driver bid: {e}")
            session.rollback()

if __name__ == "__main__":
    test_realtime_bidding()
