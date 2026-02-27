#!/usr/bin/env python3
"""
Simulate real driver bidding flow by creating a driver response to an existing trip request.
This demonstrates the complete real-time bidding system.
"""

from sqlmodel import Session, select
from db import engine
from models import Notification, TripRequest, Driver
from datetime import datetime
import requests
import json

def simulate_real_driver_bidding():
    """Simulate a real driver responding to a trip request with a bid."""
    
    with Session(engine) as session:
        # Find an active trip request
        trip_request = session.query(TripRequest).filter(
            TripRequest.status == "pending"
        ).first()
        
        if not trip_request:
            print("❌ No pending trip requests found. Please create a trip request first.")
            return
        
        print(f"🚑 Found trip request ID: {trip_request.req_id}")
        print(f"📍 From: {trip_request.pickup_location}")
        print(f"🎯 To: {trip_request.destination}")
        print(f"👤 Rider ID: {trip_request.rider_id}")
        
        # Find a driver to respond
        driver = session.query(Driver).filter(
            Driver.is_available == True
        ).first()
        
        if not driver:
            print("❌ No active drivers found.")
            return
            
        print(f"👨‍⚕️ Driver: {driver.name} (ID: {driver.driver_id})")
        
        # Simulate driver bid
        bid_amount = 350  # Driver's bid amount
        print(f"💰 Driver bid: ৳{bid_amount}")
        
        # Create driver bid notification (this is what happens in real flow)
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
            rider_name="Patient",  # Default rider name
            status="unread",
            timestamp=datetime.now()
        )
        
        try:
            session.add(driver_bid_notification)
            session.commit()
            session.refresh(driver_bid_notification)
            
            print(f"✅ Real driver bid notification created!")
            print(f"📧 Notification ID: {driver_bid_notification.notification_id}")
            print(f"🎯 Recipient: {driver_bid_notification.recipient_id} (rider)")
            print(f"👨‍⚕️ Sender: {driver_bid_notification.sender_id} (driver)")
            print(f"💰 Bid Amount: ৳{driver_bid_notification.bid_amount}")
            
            print("\n🎉 REAL BIDDING SYSTEM IS NOW ACTIVE!")
            print("💡 Go to the rider dashboard to see the bidding interface.")
            print("🔔 The rider should now see the driver's bid with Accept/Reject/Counter options.")
            
        except Exception as e:
            print(f"❌ Error creating driver bid: {e}")
            session.rollback()

if __name__ == "__main__":
    simulate_real_driver_bidding()
