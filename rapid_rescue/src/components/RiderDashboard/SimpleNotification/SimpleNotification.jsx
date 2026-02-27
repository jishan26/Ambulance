import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Car, DollarSign, Clock, MapPin } from "lucide-react";

const SimpleNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  // Simulate driver bid notification (for testing)
  useEffect(() => {
    // Create a test notification
    const testNotification = {
      notification_id: 999,
      driver_name: "money",
      bid_amount: 450,
      destination: "Badda General Hospital",
      pickup_location: "unnamed road, Satarkul, Dhaka - 1212, Bangladesh",
      timestamp: new Date().toISOString()
    };

    setNotifications([testNotification]);
    setIsVisible(true);

    console.log("🔔 SimpleNotification: Test notification created");
  }, []);

  // Handle cancel notification
  const handleCancelNotification = (notificationId) => {
    console.log("🚫 Cancelling notification:", notificationId);
    
    // Remove from local state
    setNotifications(prev => 
      prev.filter(notif => notif.notification_id !== notificationId)
    );
    
    // Hide notification
    setIsVisible(false);
    
    console.log("✅ Notification cancelled successfully");
  };

  // Handle accept notification
  const handleAcceptNotification = (notification) => {
    console.log("✅ Accepting notification:", notification);
    
    // Remove from local state
    setNotifications(prev => 
      prev.filter(notif => notif.notification_id !== notification.notification_id)
    );
    
    // Hide notification
    setIsVisible(false);
    
    // Dispatch event to show bidding interface
    window.dispatchEvent(new CustomEvent("driverBidAccepted", {
      detail: { notification }
    }));
    
    console.log("✅ Notification accepted, moving to bidding interface");
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
                  onClick={() => handleCancelNotification(notification.notification_id)}
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
                    onClick={() => handleCancelNotification(notification.notification_id)}
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

export default SimpleNotification;
