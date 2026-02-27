import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Car, DollarSign, Clock } from "lucide-react";
import { getNotifications, updateNotificationStatus } from "../../../controllers/apiClient";
import { useSelector } from "react-redux";

const SimpleBidNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const user = useSelector((state) => state.user);

  // Fetch driver bid notifications
  useEffect(() => {
    const fetchDriverBidNotifications = async () => {
      if (!user.id || user.role !== "rider") return;

      try {
        const result = await getNotifications();
        
        if (result.success && result.data && result.data.notifications) {
          const driverBidNotifications = result.data.notifications.filter(
            (notif) => {
              const isRelevantType = notif.notification_type === "driver_bid_sent";
              const isRelevantStatus = 
                notif.status === "unread" ||
                notif.status === "pending" ||
                notif.status === "new" ||
                !notif.status;
              
              console.log(`🔍 SimpleBidNotification - Filter:`, {
                id: notif.notification_id,
                type: notif.notification_type,
                status: notif.status,
                isRelevantType,
                isRelevantStatus,
              });
              
              return isRelevantType && isRelevantStatus;
            }
          );
          
          if (driverBidNotifications.length > 0) {
            setNotifications(driverBidNotifications);
            setIsVisible(true);
            console.log("🔔 Simple bid notifications:", driverBidNotifications);
          } else {
            setIsVisible(false);
          }
        }
      } catch (error) {
        console.error("Error fetching driver bid notifications:", error);
      }
    };

    fetchDriverBidNotifications();
    
    // Poll for new notifications every 3 seconds
    const interval = setInterval(fetchDriverBidNotifications, 3000);
    return () => clearInterval(interval);
  }, [user.id, user.role]);

  // Handle cancel notification
  const handleCancelNotification = async (notificationId) => {
    try {
      console.log("🚫 Cancelling notification:", notificationId);
      
      // Find the notification to get driver info
      const notification = notifications.find(notif => notif.notification_id === notificationId);
      
      // Update notification status to cancelled
      const response = await updateNotificationStatus(notificationId, "cancelled");
      
      if (response.success) {
        console.log("✅ Notification cancelled successfully");
        
        // Create a cancellation notification for the driver
        if (notification?.sender_id) {
          console.log("🚫 Creating cancellation notification for driver:", notification.sender_id);
          
          const cancellationNotification = {
            recipient_id: notification.sender_id, // Driver ID (who receives the cancellation)
            recipient_type: "driver",
            sender_id: user.id, // Rider ID (who is cancelling)
            sender_type: "rider",
            notification_type: "rider_cancelled",
            title: "Rider Cancelled Request",
            message: "Rider has cancelled the bid request",
            req_id: notification.req_id || 0,
            bid_amount: notification.bid_amount || 0,
            status: "unread"
          };
          
          try {
            const cancelResponse = await fetch("http://127.0.0.1:8000/notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
              },
              body: JSON.stringify(cancellationNotification),
            });
            
            if (cancelResponse.ok) {
              console.log("✅ Cancellation notification created for driver");
            } else {
              console.error("❌ Failed to create cancellation notification");
            }
          } catch (error) {
            console.error("❌ Error creating cancellation notification:", error);
          }
        }
        
        // Remove from local state
        setNotifications(prev => 
          prev.filter(notif => notif.notification_id !== notificationId)
        );
        
        // Hide popup if no more notifications
        if (notifications.length <= 1) {
          setIsVisible(false);
        }
        
        // Dispatch event to notify driver side that rider cancelled
        const eventDetail = { 
          notificationId,
          timestamp: new Date().toISOString(),
          riderId: user.id,
          driverId: notification?.sender_id  // Driver is the sender in rider notifications
        };
        
        console.log("🚫 Dispatching riderCancelledBid event:", eventDetail);
        console.log("🚫 Notification object:", notification);
        
        window.dispatchEvent(new CustomEvent("riderCancelledBid", {
          detail: eventDetail
        }));
        
        console.log("✅ Rider cancelled bid, notifying driver side");
      }
    } catch (error) {
      console.error("Error cancelling notification:", error);
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.notification_id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm"
          >
            {/* Simple Message Header */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Driver Bid</h3>
                    <p className="text-blue-100 text-sm">
                      {notification.driver_name} sent you a bid
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelNotification(notification.notification_id)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simple Message Content */}
            <div className="p-4">
              <div className="space-y-3">
                {/* Driver Message */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-800 text-sm">
                    <strong>{notification.driver_name}</strong> sent you a bid of{" "}
                    <span className="text-green-600 font-bold">
                      ৳{notification.bid_amount}
                    </span>{" "}
                    for your trip to <strong>{notification.destination}</strong>
                  </p>
                </div>

                {/* Trip Details */}
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3" />
                    <span>From: {notification.pickup_location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-3 h-3" />
                    <span>Bid Amount: ৳{notification.bid_amount}</span>
                  </div>
                </div>

                {/* Cancel Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleCancelNotification(notification.notification_id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 rounded-b-xl">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Just now</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SimpleBidNotification;
