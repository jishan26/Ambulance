import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
  Check,
  X,
  Clock,
  AlertCircle,
  MapPin,
  User,
  Phone,
  ChevronRight,
  Bell,
  DollarSign,
  Plus,
  Minus,
} from "lucide-react";
import { setOngoingTripDetails } from "../../store/slices/ongoing-trip-details-slice";
import { clearTripReq } from "../../store/slices/trip-request-slice";
import { changeCheckoutStatus } from "../../store/slices/checkout-status-slice";
import WebSocketController from "../../controllers/websocket/ConnectionManger";
import {
  getNotifications,
  updateNotificationStatus,
  declineTripRequest,
} from "../../controllers/apiClient";

const DriverNotification = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const bidding = useSelector((state) => state.bidding);
  const [notifications, setNotifications] = useState([]);
  const [bidAmount, setBidAmount] = useState(250);
  const [showBidInput, setShowBidInput] = useState(null);
  const [acceptingNotification, setAcceptingNotification] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    totalNotifications: 0,
    driverId: null,
    allNotifications: [],
  });

  // Real-time WebSocket listeners
  useEffect(() => {
    const handleRiderCounterOffer = (event) => {
      console.log(
        "🔄 DriverNotification - Rider counter offer received via WebSocket:",
        event.detail
      );
      // Refresh notifications to show the new counter offer
      fetchNotifications();
    };

    const handleDriverBidAccepted = (event) => {
      console.log("🔄 DriverNotification - Driver bid accepted:", event.detail);
      // Refresh notifications to remove the accepted bid
      fetchNotifications();
    };

    // Listen for WebSocket events
    window.addEventListener(
      "riderCounterOfferReceived",
      handleRiderCounterOffer
    );
    window.addEventListener("driverBidAccepted", handleDriverBidAccepted);

    return () => {
      window.removeEventListener(
        "riderCounterOfferReceived",
        handleRiderCounterOffer
      );
      window.removeEventListener("driverBidAccepted", handleDriverBidAccepted);
    };
  }, []);

  // Fetch notifications function
  const fetchNotifications = async () => {
    console.log(
      "🔄 DriverNotification - Fetching notifications for driver:",
      user.id,
      "Role:",
      user.role
    );

    if (user.id && user.role === "driver") {
      try {
        console.log("🔄 Fetching driver notifications...");
        const result = await getNotifications();
        console.log("📊 DriverNotification - API response:", result);
        console.log(
          "📊 DriverNotification - Full API result:",
          JSON.stringify(result, null, 2)
        );

        if (result.success && result.data.notifications) {
          console.log(
            "📊 DriverNotification - All notifications:",
            result.data.notifications
          );

          // Store debug info
          setDebugInfo({
            totalNotifications: result.data.notifications.length,
            driverId: user.id,
            allNotifications: result.data.notifications,
          });

          // First, let's show ALL notifications for debugging
          console.log(
            "🔍 ALL NOTIFICATIONS FOR DEBUGGING:",
            result.data.notifications
          );

          console.log("🔍 DriverNotification - Starting filter process...");
          console.log("🔍 DriverNotification - User ID:", user.id);
          console.log("🔍 DriverNotification - User role:", user.role);
          console.log(
            "🔍 DriverNotification - Total notifications from API:",
            result.data.notifications.length
          );

          const dbNotifications = result.data.notifications.filter((notif) => {
            // Only show notifications where this driver is the recipient
            const isForThisDriver = notif.recipient_id === user.id;

            console.log(
              `🔍 DriverNotification Filter - Notification ${notif.notification_id}:`,
              {
                id: notif.notification_id,
                type: notif.notification_type,
                recipient: notif.recipient_id,
                sender: notif.sender_id,
                status: notif.status,
                currentDriver: user.id,
                isForThisDriver,
                passes: isForThisDriver,
                title: notif.title,
                message: notif.message,
              }
            );

            // For now, show ALL notifications for this driver regardless of type
            return isForThisDriver;
          });

          console.log(
            "🔍 DriverNotification - Filtered notifications count:",
            dbNotifications.length
          );
          console.log(
            "🔍 DriverNotification - Filtered notifications:",
            dbNotifications
          );

          // Force show notifications if we have any for this driver
          if (dbNotifications.length > 0) {
            console.log("✅ Found notifications for driver, processing...");
          } else {
            console.log(
              "⚠️ No notifications found for driver, checking all notifications..."
            );
            console.log(
              "🔍 All notifications from API:",
              result.data.notifications
            );
            console.log("🔍 Current driver ID:", user.id);
            console.log("🔍 Current driver role:", user.role);

            // Show all notifications for debugging
            result.data.notifications.forEach((notif, index) => {
              console.log(`🔍 Notification ${index}:`, {
                id: notif.notification_id,
                recipient_id: notif.recipient_id,
                sender_id: notif.sender_id,
                type: notif.notification_type,
                title: notif.title,
                message: notif.message,
                status: notif.status,
                isForCurrentDriver: notif.recipient_id === user.id,
              });
            });
          }

          const processedNotifications = dbNotifications.map((notif) => {
            console.log("🔍 DriverNotification - Processing notification:", {
              id: notif.notification_id,
              type: notif.notification_type,
              title: notif.title,
              message: notif.message,
              recipient: notif.recipient_id,
              recipient_type: notif.recipient_type,
            });

            return {
              id: `db-${notif.notification_id}`,
              type:
                notif.notification_type === "rider_counter_offer" ||
                notif.notification_type === "counter_offer"
                  ? "rider_bid"
                  : "bid",
              title: notif.title,
              message: notif.message,
              location: notif.pickup_location || "Pickup Location",
              requestedBy:
                notif.rider_name ||
                notif.driver_name ||
                `User ${notif.sender_id}`,
              timestamp: new Date(notif.timestamp).toLocaleTimeString(),
              priority: "high",
              status: notif.status || "pending",
              bidData: {
                rider_id: notif.sender_id,
                req_id: notif.req_id,
                pickup_location: notif.pickup_location,
                destination: notif.destination,
              },
              bidAmount: notif.bid_amount,
              notificationId: notif.notification_id,
              notificationType: notif.notification_type,
            };
          });
          console.log("📋 Processed notifications:", processedNotifications);

          // If no processed notifications but we have raw notifications, show them
          if (
            processedNotifications.length === 0 &&
            dbNotifications.length > 0
          ) {
            console.log(
              "⚠️ No processed notifications but raw notifications exist - showing raw notifications"
            );
            // Create simple notifications from raw data
            const simpleNotifications = dbNotifications.map((notif) => ({
              id: `simple-${notif.notification_id}`,
              type: "rider_bid",
              title: notif.title || "Counter Offer",
              message: notif.message || `Bid amount: ৳${notif.bid_amount}`,
              location: notif.pickup_location || "Pickup Location",
              requestedBy: notif.rider_name || `User ${notif.sender_id}`,
              timestamp: new Date(notif.timestamp).toLocaleTimeString(),
              priority: "high",
              status: notif.status || "pending",
              bidData: {
                rider_id: notif.sender_id,
                req_id: notif.req_id,
                pickup_location: notif.pickup_location,
                destination: notif.destination,
              },
              bidAmount: notif.bid_amount,
              notificationId: notif.notification_id,
              notificationType: notif.notification_type,
            }));
            setNotifications(simpleNotifications);
            console.log(
              "📋 Created simple notifications:",
              simpleNotifications
            );
          } else {
            setNotifications(processedNotifications);
          }

          // If still no notifications, create a test notification to verify display works
          if (
            processedNotifications.length === 0 &&
            dbNotifications.length === 0
          ) {
            console.log(
              "🧪 No notifications found - creating test notification to verify display"
            );
            const testNotification = {
              id: "test-notification",
              type: "rider_bid",
              title: "Test Notification",
              message:
                "This is a test notification to verify the display is working",
              location: "Test Location",
              requestedBy: "Test User",
              timestamp: new Date().toLocaleTimeString(),
              priority: "high",
              status: "pending",
              bidData: {
                rider_id: 999,
                req_id: 999,
                pickup_location: "Test Pickup",
                destination: "Test Destination",
              },
              bidAmount: 500,
              notificationId: "test-123",
              notificationType: "test",
            };
            setNotifications([testNotification]);
            console.log("📋 Created test notification:", testNotification);
          }
        } else {
          console.log("❌ No notifications found or API failed");
        }
      } catch (error) {
        console.error("❌ Error fetching notifications:", error);
      }
    }
  };

  // Fetch notifications from database
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      // Refresh notifications every 5 seconds
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, user.id, user.role]);

  // Listen for new driver bid notifications
  useEffect(() => {
    const handleDriverBidNotificationCreated = (event) => {
      const { notificationId, bidAmount, destination, timestamp } =
        event.detail;
      console.log("🎯 New driver bid notification created:", {
        notificationId,
        bidAmount,
        destination,
        timestamp,
      });

      // Always refresh notifications regardless of isOpen state
      fetchNotifications();
      console.log("✅ Driver notifications refreshed (event received)");
    };

    // Listen for custom event from DriverResponse
    window.addEventListener(
      "driverBidNotificationCreated",
      handleDriverBidNotificationCreated
    );

    return () => {
      window.removeEventListener(
        "driverBidNotificationCreated",
        handleDriverBidNotificationCreated
      );
    };
  }, [isOpen]);

  const handleAccept = async (notification) => {
    if (notification.type === "rider_bid") {
      try {
        const bidData = notification.bidData;

        // Set loading state
        setAcceptingNotification(notification.id);

        console.log("✅ Driver accepting counter-offer:", {
          notificationId: notification.notificationId,
          bidAmount: notification.bidAmount,
          riderId: bidData.rider_id,
          driverId: user.id,
        });

        // Create ongoing trip details
        const tripDetails = {
          trip_id: Date.now(),
          rider_id: bidData.rider_id,
          driver_id: user.id,
          driver_name: user.name,
          driver_mobile: user.mobile,
          pickup_location: bidData.pickup_location,
          destination: bidData.destination,
          fare: Number(notification.bidAmount) || 0,
          status: "confirmed",
          timestamp: new Date().toISOString(),
        };

        // Send acceptance via WebSocket
        await WebSocketController.sendMessage({
          type: "counter-offer-accepted",
          data: {
            rider_id: bidData.rider_id,
            driver_id: user.id,
            req_id: bidData.req_id,
            amount: notification.bidAmount,
            tripDetails: tripDetails,
            notificationId: notification.notificationId,
          },
        });

        // Update notification status in database
        if (notification.notificationId) {
          await updateNotificationStatus(
            notification.notificationId,
            "accepted"
          );
        }

        // Update local state
        dispatch(setOngoingTripDetails(tripDetails));
        dispatch(clearTripReq());
        dispatch(changeCheckoutStatus());

        // Remove notification
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notification.id)
        );

        // Dispatch event to notify rider side
        window.dispatchEvent(
          new CustomEvent("counterOfferAccepted", {
            detail: {
              amount: notification.bidAmount,
              driverId: user.id,
              riderId: bidData.rider_id,
              notificationId: notification.notificationId,
              tripDetails: tripDetails,
            },
          })
        );

        console.log("✅ Counter-offer accepted, notifying rider");

        // Clear loading state
        setAcceptingNotification(null);

        // Navigate to ongoing trip
        window.location.href = "/ongoing_trip";
      } catch (error) {
        console.error("❌ Error accepting counter-offer:", error);
        setAcceptingNotification(null);
      }
    }
  };

  const handleMakeBid = (notification) => {
    // Driver accepts rider's bid - notify driver response component
    if (notification.bidAmount) {
      console.log("🔄 Driver accepting rider bid:", notification.bidAmount);

      // Store driver's acceptance
      localStorage.setItem(
        "driverAcceptedBid",
        notification.bidAmount.toString()
      );
      localStorage.setItem("driverResponseTimestamp", new Date().toISOString());
      localStorage.setItem("driverId", user.id);

      // Dispatch event to notify driver response component
      window.dispatchEvent(
        new CustomEvent("driverBidResponse", {
          detail: {
            amount: notification.bidAmount,
            timestamp: new Date().toISOString(),
            driverId: user.id,
            riderId: notification.bidData?.rider_id,
            notificationId: notification.id,
          },
        })
      );

      // Show success message
      console.log(
        "✅ Driver accepted rider bid, notifying driver response component"
      );
    }
  };

  const handleSendBid = async (notification) => {
    if (notification.type === "rider_bid") {
      const bidData = notification.bidData;

      // Send counter bid via WebSocket
      await WebSocketController.sendMessage({
        type: "driver-counter-offer",
        data: {
          rider_id: bidData.rider_id,
          driver_id: user.id,
          req_id: bidData.req_id,
          amount: bidAmount,
          original_amount: notification.bidAmount,
        },
      });

      // Update notification with new bid
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notification.id
            ? {
                ...notif,
                bidAmount: bidAmount,
                message: `Counter offer: ৳${bidAmount}`,
              }
            : notif
        )
      );

      setShowBidInput(null);
    }
  };

  const handleDecline = async (notification) => {
    const notificationId = notification.notificationId || notification.id;
    console.log("🚫 Driver declining notification:", notificationId);

    try {
      // Decline the trip request
      if (notification.bidData?.req_id) {
        const declineResult = await declineTripRequest(
          notification.bidData.req_id
        );
        if (declineResult.success) {
          console.log(
            "✅ Trip request declined successfully:",
            notification.bidData.req_id
          );

          // Send WebSocket message for real-time decline notification
          console.log(
            "🚫 DriverNotification - Sending WebSocket decline message:",
            {
              reqId: notification.bidData.req_id,
              driverId: user.id,
              notificationId: notificationId,
            }
          );

          if (WebSocketController.isConnected()) {
            await WebSocketController.sendMessage({
              type: "driver_declined_request",
              data: {
                req_id: notification.bidData.req_id,
                driver_id: user.id,
                rider_id: notification.bidData.rider_id,
                notification_id: notificationId,
                timestamp: new Date().toISOString(),
                reason: "driver_declined",
              },
            });
            console.log(
              "✅ DriverNotification - WebSocket decline message sent"
            );
          } else {
            console.warn(
              "⚠️ DriverNotification - WebSocket not connected, falling back to custom event"
            );
            // Fallback to custom event if WebSocket is not available
            window.dispatchEvent(
              new CustomEvent("driverDeclinedRequest", {
                detail: {
                  reqId: notification.bidData.req_id,
                  driverId: user.id,
                  notificationId: notificationId,
                  timestamp: new Date().toISOString(),
                },
              })
            );
          }
        } else {
          console.error(
            "❌ Failed to decline trip request:",
            declineResult.error
          );
        }
      }

      // Update notification status in database if it has a real notification ID
      if (
        notification.notificationId &&
        notification.notificationId !== "test-123" &&
        notification.notificationId !== "local-test-123"
      ) {
        await updateNotificationStatus(notification.notificationId, "declined");
        console.log("✅ Notification status updated to declined in database");
      }

      // Remove from local state
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notification.id)
      );

      console.log("✅ Driver declined notification, event dispatched");
    } catch (error) {
      console.error("❌ Error declining notification:", error);
      // Still remove from local state even if database update fails
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notification.id)
      );
    }
  };

  const handleCancel = async (notification) => {
    const notificationId = notification.notificationId || notification.id;
    console.log("🚫 Driver cancelling notification:", notificationId);

    try {
      // Update notification status in database if it has a real notification ID
      if (
        notification.notificationId &&
        notification.notificationId !== "test-123" &&
        notification.notificationId !== "local-test-123"
      ) {
        await updateNotificationStatus(
          notification.notificationId,
          "cancelled"
        );
        console.log("✅ Notification status updated to cancelled in database");
      }

      // Remove from local state
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notification.id)
      );

      // Dispatch event to notify that driver cancelled the notification
      window.dispatchEvent(
        new CustomEvent("driverBidCancelled", {
          detail: {
            notificationId: notification.notificationId || notification.id,
            driverId: user.id,
            timestamp: new Date().toISOString(),
          },
        })
      );

      console.log("✅ Driver cancelled notification, event dispatched");
    } catch (error) {
      console.error("❌ Error cancelling notification:", error);
      // Still remove from local state even if database update fails
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notification.id)
      );
    }
  };

  const handleBidAmountChange = (amount) => {
    setBidAmount((prev) => Math.max(0, prev + amount));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "border-red-500 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      case "low":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "critical":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "high":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case "medium":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "low":
        return <Bell className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type) => {
    if (type === "rider_bid") {
      return <DollarSign className="w-3 h-3 text-green-600" />;
    } else {
      return <MapPin className="w-3 h-3 text-blue-600" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black bg-opacity-25"
          />

          {/* Notification Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-4 top-24 z-50 w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Driver Notifications ({notifications.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      console.log("🔄 Manual refresh triggered");
                      fetchNotifications();
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition-colors"
                    title="Refresh notifications"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {/* Show raw notifications if no processed notifications */}
                {notifications.length === 0 &&
                  debugInfo.allNotifications.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Raw Notifications Found:
                      </h3>
                      {debugInfo.allNotifications
                        .filter((notif) => notif.recipient_id === user.id)
                        .map((notif, index) => (
                          <div
                            key={index}
                            className="bg-gray-100 p-3 rounded-lg mb-2"
                          >
                            <p className="text-sm font-medium">
                              ID: {notif.notification_id}
                            </p>
                            <p className="text-xs text-gray-600">
                              Type: {notif.notification_type}
                            </p>
                            <p className="text-xs text-gray-600">
                              Title: {notif.title}
                            </p>
                            <p className="text-xs text-gray-600">
                              Message: {notif.message}
                            </p>
                            <p className="text-xs text-gray-600">
                              Status: {notif.status}
                            </p>
                            <p className="text-xs text-gray-600">
                              Amount: {notif.bid_amount}
                            </p>

                            {/* Add action buttons for raw notifications */}
                            <div className="mt-2 flex space-x-2">
                              <button
                                onClick={() => {
                                  console.log(
                                    "🧪 Testing accept for raw notification:",
                                    notif
                                  );
                                  // Create a mock notification object for testing
                                  const mockNotification = {
                                    id: `raw-${notif.notification_id}`,
                                    type: "rider_bid",
                                    bidData: {
                                      rider_id: notif.sender_id,
                                      req_id: notif.req_id,
                                      pickup_location: notif.pickup_location,
                                      destination: notif.destination,
                                    },
                                    bidAmount: notif.bid_amount,
                                    notificationId: notif.notification_id,
                                  };
                                  handleAccept(mockNotification);
                                }}
                                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  console.log(
                                    "🧪 Testing cancel for raw notification:",
                                    notif
                                  );
                                  // Create a mock notification object for cancel handling
                                  const mockNotification = {
                                    id: `raw-${notif.notification_id}`,
                                    notificationId: notif.notification_id,
                                    type: "rider_bid",
                                    bidData: {
                                      rider_id: notif.sender_id,
                                      req_id: notif.req_id,
                                      pickup_location: notif.pickup_location,
                                      destination: notif.destination,
                                    },
                                    bidAmount: notif.bid_amount,
                                  };
                                  handleCancel(mockNotification);
                                }}
                                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                <AnimatePresence>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -300 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        notification.status !== "pending" ? "opacity-75" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Priority Indicator */}
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${getPriorityColor(
                            notification.priority
                          )}`}
                        >
                          {getPriorityIcon(notification.priority)}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {getTypeIcon(notification.type)}
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {notification.title}
                            </h3>
                          </div>

                          <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                            {notification.message}
                          </p>

                          {/* Show accepted amount if notification is accepted */}
                          {notification.status === "accepted" && (
                            <div className="mb-2 p-2 bg-green-100 border border-green-200 rounded-lg">
                              <p className="text-xs text-green-800 font-medium">
                                ✅ Accepted Amount: ৳{notification.bidAmount}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-col gap-1 text-xs text-gray-600 mb-3">
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate">
                                {notification.location}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {notification.requestedBy}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {notification.timestamp}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {notification.status === "pending" &&
                            notification.type === "rider_bid" && (
                              <div className="space-y-3">
                                {/* Bid Input Section */}
                                {showBidInput === notification.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="bg-green-50 p-3 rounded-lg border border-green-200"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-green-800">
                                        Your Counter Offer
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() =>
                                            handleBidAmountChange(-50)
                                          }
                                          className="p-1 bg-white rounded-full hover:bg-green-100"
                                        >
                                          <Minus className="w-3 h-3 text-green-600" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleBidAmountChange(50)
                                          }
                                          className="p-1 bg-white rounded-full hover:bg-green-100"
                                        >
                                          <Plus className="w-3 h-3 text-green-600" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="relative">
                                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                      </div>
                                      <input
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) =>
                                          setBidAmount(
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="w-full pl-10 pr-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                        placeholder="Enter amount"
                                      />
                                    </div>
                                  </motion.div>
                                )}

                                {/* Main Action Buttons */}
                                <div className="flex space-x-2">
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleAccept(notification)}
                                    disabled={
                                      acceptingNotification === notification.id
                                    }
                                    className={`flex-1 px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1 text-xs font-medium transition-colors ${
                                      acceptingNotification === notification.id
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700"
                                    }`}
                                  >
                                    {acceptingNotification ===
                                    notification.id ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Accepting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>Accept</span>
                                      </>
                                    )}
                                  </motion.button>

                                  {showBidInput === notification.id ? (
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() =>
                                        handleSendBid(notification)
                                      }
                                      className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-1 text-xs font-medium transition-colors"
                                    >
                                      <DollarSign className="w-3 h-3" />
                                      <span>Send Bid</span>
                                    </motion.button>
                                  ) : (
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() =>
                                        handleMakeBid(notification)
                                      }
                                      className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-1 text-xs font-medium transition-colors"
                                    >
                                      <DollarSign className="w-3 h-3" />
                                      <span>Make Bid</span>
                                    </motion.button>
                                  )}

                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleDecline(notification)}
                                    className="flex-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-1 text-xs font-medium transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Decline</span>
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleCancel(notification)}
                                    className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-1 text-xs font-medium transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Cancel</span>
                                  </motion.button>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {notifications.length === 0 && (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      No notifications
                    </h3>
                    <p className="text-xs text-gray-500">
                      You're all caught up!
                    </p>

                    {/* Show raw notification data for debugging */}
                    {debugInfo.allNotifications.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
                        <p className="text-xs text-blue-700 font-medium mb-2">
                          Raw Notifications:
                        </p>
                        {debugInfo.allNotifications.map((notif, index) => (
                          <div
                            key={index}
                            className="text-xs text-blue-600 mb-1"
                          >
                            ID: {notif.notification_id}, Type:{" "}
                            {notif.notification_type}, Recipient:{" "}
                            {notif.recipient_id}, Sender: {notif.sender_id},
                            Status: {notif.status}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Debug Information */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                      <p className="text-xs text-yellow-700 font-medium mb-2">
                        Debug Info:
                      </p>
                      <p className="text-xs text-yellow-700">
                        Driver ID: {debugInfo.driverId || user.id}
                      </p>
                      <p className="text-xs text-yellow-700">
                        Role: {user.role}
                      </p>
                      <p className="text-xs text-yellow-700">
                        Total notifications in DB:{" "}
                        {debugInfo.totalNotifications}
                      </p>
                      <p className="text-xs text-yellow-700">
                        Filtered notifications: {notifications.length}
                      </p>
                      <p className="text-xs text-yellow-700">
                        All notifications:{" "}
                        {JSON.stringify(
                          debugInfo.allNotifications?.slice(0, 2) || [],
                          null,
                          2
                        )}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => {
                            console.log(
                              "🔄 Manual refresh triggered from debug"
                            );
                            fetchNotifications();
                          }}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          Refresh
                        </button>
                        <button
                          onClick={async () => {
                            console.log(
                              "🧪 Creating test notification for driver"
                            );
                            try {
                              const testNotification = {
                                recipient_id: user.id,
                                recipient_type: "driver",
                                sender_id: 999, // Test rider ID
                                sender_type: "rider",
                                notification_type: "rider_counter_offer",
                                title: "Test Counter Offer",
                                message: "Test counter offer: ৳500",
                                req_id: 123,
                                bid_amount: 500,
                                pickup_location: "Test Pickup",
                                destination: "Test Destination",
                                driver_name: "Test Driver",
                                driver_mobile: "123-456-7890",
                                rider_name: "Test Rider",
                                rider_mobile: "987-654-3210",
                              };

                              const response = await fetch(
                                "http://127.0.0.1:8000/notifications",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${user.token}`,
                                  },
                                  body: JSON.stringify(testNotification),
                                }
                              );

                              if (response.ok) {
                                console.log("✅ Test notification created");
                                fetchNotifications();
                              } else {
                                console.error(
                                  "❌ Failed to create test notification"
                                );
                              }
                            } catch (error) {
                              console.error(
                                "❌ Error creating test notification:",
                                error
                              );
                            }
                          }}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Create Test
                        </button>

                        <button
                          onClick={() => {
                            console.log("🔍 Force Show Test - Current state:");
                            console.log("🔍 User ID:", user.id);
                            console.log("🔍 User role:", user.role);
                            console.log(
                              "🔍 Notifications state:",
                              notifications
                            );
                            console.log("🔍 Debug info:", debugInfo);

                            // Force create a local test notification
                            const localTestNotification = {
                              id: "local-test",
                              type: "rider_bid",
                              title: "Local Test Notification",
                              message: "This is a local test notification",
                              location: "Test Location",
                              requestedBy: "Test User",
                              timestamp: new Date().toLocaleTimeString(),
                              priority: "high",
                              status: "pending",
                              bidData: {
                                rider_id: 999,
                                req_id: 999,
                                pickup_location: "Test Pickup",
                                destination: "Test Destination",
                              },
                              bidAmount: 500,
                              notificationId: "local-test-123",
                              notificationType: "test",
                            };

                            setNotifications([localTestNotification]);
                            console.log(
                              "🔍 Set local test notification:",
                              localTestNotification
                            );
                          }}
                          className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                        >
                          Force Show Test
                        </button>

                        <button
                          onClick={async () => {
                            console.log(
                              "🧪 Creating test notification for current driver:",
                              user.id
                            );

                            // Create a test notification for the current driver
                            const testNotification = {
                              recipient_id: user.id, // Current driver
                              recipient_type: "driver",
                              sender_id: 2, // Test rider ID
                              sender_type: "rider",
                              notification_type: "rider_counter_offer",
                              title: "Test Counter Offer",
                              message:
                                "This is a test counter offer notification",
                              req_id: 999,
                              bid_amount: 750,
                              original_amount: 500,
                              pickup_location: "Test Pickup Location",
                              destination: "Test Destination",
                              driver_name: user.name || "money",
                              driver_mobile: user.mobile || "1234567890",
                              rider_name: "Test Rider",
                              rider_mobile: "9876543210",
                            };

                            console.log(
                              "📤 Creating test notification:",
                              testNotification
                            );

                            try {
                              const response = await fetch(
                                "http://127.0.0.1:8000/notifications",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${user.token}`,
                                  },
                                  body: JSON.stringify(testNotification),
                                }
                              );

                              if (response.ok) {
                                const responseData = await response.json();
                                console.log(
                                  "✅ Test notification created:",
                                  responseData
                                );
                                alert(
                                  "✅ Test notification created! Refreshing notifications..."
                                );
                                fetchNotifications(); // Refresh notifications
                              } else {
                                const errorData = await response
                                  .json()
                                  .catch(() => ({}));
                                console.error(
                                  "❌ Failed to create test notification:",
                                  {
                                    status: response.status,
                                    statusText: response.statusText,
                                    error: errorData,
                                  }
                                );
                                alert(
                                  "❌ Failed to create test notification. Check console for details."
                                );
                              }
                            } catch (error) {
                              console.error(
                                "❌ Error creating test notification:",
                                error
                              );
                              alert(
                                "❌ Error creating test notification. Check console for details."
                              );
                            }
                          }}
                          className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                        >
                          Create Test for Current Driver
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DriverNotification;
