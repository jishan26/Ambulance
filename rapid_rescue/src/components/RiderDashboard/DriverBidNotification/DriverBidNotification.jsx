import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { X, Car, DollarSign, Clock, MapPin } from "lucide-react";
import {
  getNotifications,
  updateNotificationStatus,
} from "../../../controllers/apiClient";

const DriverBidNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // Fetch driver bid notifications
  useEffect(() => {
    const fetchDriverBidNotifications = async () => {
      console.log("🔍 Fetching notifications for user:", user.id, "role:", user.role);
      
      if (!user.id || user.role !== "rider") {
        console.log("🔍 Not fetching - user conditions not met");
        return;
      }

      try {
        setIsLoading(true);
        console.log("🔍 Calling getNotifications API...");
        const result = await getNotifications();
        console.log("🔍 API result:", result);

        if (result.success && result.data && result.data.notifications) {
          console.log("🔍 All notifications:", result.data.notifications);
          
          const driverBidNotifications = result.data.notifications.filter(
            (notif) =>
              notif.notification_type === "driver_bid_sent" &&
              notif.status === "unread"
          );

          console.log("🔔 Driver bid notifications found:", driverBidNotifications.length);
          console.log("🔔 Driver bid notifications:", driverBidNotifications);
          setNotifications(driverBidNotifications);
        } else {
          console.log("🔍 No notifications found or API failed");
          setNotifications([]);
        }
      } catch (error) {
        console.error("❌ Error fetching driver bid notifications:", error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
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

      // Update notification status to cancelled
      const response = await updateNotificationStatus(
        notificationId,
        "cancelled"
      );

      if (response.success) {
        console.log("✅ Notification cancelled successfully");

        // Remove from local state
        setNotifications((prev) =>
          prev.filter((notif) => notif.notification_id !== notificationId)
        );

        // Dispatch event to refresh other components
        window.dispatchEvent(
          new CustomEvent("driverBidCancelled", {
            detail: { notificationId },
          })
        );
      }
    } catch (error) {
      console.error("Error cancelling notification:", error);
    }
  };

  // Handle accept notification (move to bidding interface)
  const handleAcceptNotification = async (notification) => {
    try {
      console.log("✅ Accepting notification:", notification.notification_id);

      // Update notification status to accepted
      const response = await updateNotificationStatus(
        notification.notification_id,
        "accepted"
      );

      if (response.success) {
        console.log("✅ Notification accepted, moving to bidding interface");

        // Remove from local state
        setNotifications((prev) =>
          prev.filter(
            (notif) => notif.notification_id !== notification.notification_id
          )
        );

        // Dispatch event to show bidding interface
        window.dispatchEvent(
          new CustomEvent("driverBidAccepted", {
            detail: { notification },
          })
        );
      }
    } catch (error) {
      console.error("Error accepting notification:", error);
    }
  };

  console.log("🔍 DriverBidNotification render - notifications:", notifications.length);
  console.log("🔍 DriverBidNotification render - isLoading:", isLoading);
  console.log("🔍 DriverBidNotification render - user:", user);

  // Always show a test notification for debugging
  if (notifications.length === 0 && !isLoading) {
    console.log("🔍 Showing test notification for debugging");
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-sm">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Test Notification</h3>
                  <p className="text-blue-100 text-sm">Debug mode - No real notifications found</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-gray-600 text-sm">Check console for debugging info</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading notifications...</span>
          </div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    console.log("🔍 No notifications to display");
    return null;
  }

  console.log("🔍 Rendering", notifications.length, "notifications");

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
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Driver Bid Received</h3>
                    <p className="text-blue-100 text-sm">
                      New bid from {notification.driver_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleCancelNotification(notification.notification_id)
                  }
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="space-y-3">
                {/* Driver Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Car className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {notification.driver_name}
                    </p>
                    <p className="text-sm text-gray-600">EMT Service</p>
                  </div>
                </div>

                {/* Bid Amount */}
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">
                      ৳{notification.bid_amount}
                    </span>
                    <span className="text-green-600 text-sm">bid amount</span>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">
                        To: {notification.destination}
                      </p>
                      <p className="text-xs text-gray-500">
                        From: {notification.pickup_location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() =>
                      handleCancelNotification(notification.notification_id)
                    }
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={() => handleAcceptNotification(notification)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Car className="w-4 h-4" />
                    <span>View Bid</span>
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

export default DriverBidNotification;
