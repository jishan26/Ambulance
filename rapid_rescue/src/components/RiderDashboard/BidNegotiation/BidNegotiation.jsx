import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Car,
  User,
  Phone,
  Star,
  DollarSign,
  Navigation,
  Check,
  X,
  MessageCircle,
  Send,
  AlertCircle,
} from "lucide-react";
import { setOngoingTripDetails } from "../../../store/slices/ongoing-trip-details-slice";
import { clearTripReq } from "../../../store/slices/trip-request-slice";
import { changeCheckoutStatus } from "../../../store/slices/checkout-status-slice";
import {
  getNotifications,
  updateNotificationStatus,
  apiFetch,
} from "../../../controllers/apiClient";
import WebSocketController from "../../../controllers/websocket/ConnectionManger";

const BidNegotiation = () => {
  const dispatch = useDispatch();
  const driverResponses = useSelector((state) => state.driverResponse);
  const tripRequests = useSelector((state) => state.tripRequests);
  const user = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);
  const [counterOffer, setCounterOffer] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showCounterOffer, setShowCounterOffer] = useState(false);

  // Get the latest trip request for display
  const latestRequest =
    tripRequests && tripRequests.length > 0 ? tripRequests[0] : null;

  // Use the most recent notification's location data if available, otherwise fallback to latest request
  const getDisplayLocation = () => {
    if (notifications && notifications.length > 0) {
      // Use the first notification's location data as it should be the most recent
      const firstNotification = notifications[0];
      return {
        pickup:
          firstNotification.pickup_location ||
          latestRequest?.pickup_location ||
          "Location not available",
        destination:
          firstNotification.destination ||
          latestRequest?.destination ||
          "Badda General Hospital",
      };
    }
    // Fallback to latest request if no notifications
    return {
      pickup: latestRequest?.pickup_location || "Location not available",
      destination: latestRequest?.destination || "Badda General Hospital",
    };
  };

  const displayLocation = getDisplayLocation();
  const pickup_location = displayLocation.pickup;
  const destination = displayLocation.destination;

  // Fetch driver bid notifications
  const fetchDriverBids = async () => {
    if (!latestRequest || !user.id || user.role !== "rider") {
      return;
    }

    try {
      const result = await getNotifications();

      if (result.success && result.data.notifications) {
        const driverBidNotifications = result.data.notifications.filter(
          (notif) =>
            (notif.notification_type === "driver_bid_sent" ||
              notif.notification_type === "driver_bid" ||
              notif.notification_type === "bid" ||
              notif.type === "driver_bid") &&
            (notif.status === "unread" ||
              notif.status === "pending" ||
              notif.status === "new" ||
              !notif.status)
        );
        setNotifications(driverBidNotifications);
      }
    } catch (error) {
      console.error("Error fetching driver bids:", error);
    }
  };

  // Fetch driver bids on component mount
  useEffect(() => {
    fetchDriverBids();
    const interval = setInterval(() => {
      fetchDriverBids();
    }, 5000);
    return () => clearInterval(interval);
  }, [latestRequest, user.id, user.role]);

  // Listen for bid notification selection event and real-time updates
  useEffect(() => {
    const handleBidNotificationSelected = (event) => {
      const bidData = event.detail;

      // Create a notification from the event data
      const notificationFromEvent = {
        notification_id: bidData.notificationId || `event_${Date.now()}`,
        notification_type: "driver_bid_sent",
        status: "unread",
        driver_name: bidData.driverName,
        driver_mobile: bidData.driverMobile,
        driver_id: bidData.driverId,
        bid_amount: bidData.bidAmount,
        pickup_location: bidData.pickupLocation,
        destination: bidData.destination,
        req_id: bidData.reqId,
        timestamp: bidData.timestamp,
      };

      // Add this notification to the current notifications
      setNotifications((prev) => {
        // Check if notification already exists
        const exists = prev.some(
          (notif) =>
            notif.notification_id === notificationFromEvent.notification_id
        );
        if (!exists) {
          return [notificationFromEvent, ...prev];
        }
        return prev;
      });
    };

    const handleDriverResponse = (event) => {
      // Refresh notifications to show updated status
      fetchDriverBids();
    };

    const handleCounterOfferResponse = (event) => {
      // Refresh notifications to show updated status
      fetchDriverBids();
    };

    window.addEventListener(
      "bidNotificationSelected",
      handleBidNotificationSelected
    );
    window.addEventListener("driverBidAccepted", handleDriverResponse);
    window.addEventListener("driverBidRejected", handleDriverResponse);
    window.addEventListener("counterOfferAccepted", handleCounterOfferResponse);
    window.addEventListener("counterOfferRejected", handleCounterOfferResponse);

    // Also check localStorage for any stored bid data
    const storedBidData = localStorage.getItem("selectedBidNotification");
    if (storedBidData) {
      const bidData = JSON.parse(storedBidData);

      // Create a notification from the stored bid data
      const notificationFromStoredData = {
        notification_id: bidData.notificationId || `stored_${Date.now()}`,
        notification_type: "driver_bid_sent",
        status: "unread",
        driver_name: bidData.driverName,
        driver_mobile: bidData.driverMobile,
        driver_id: bidData.driverId,
        bid_amount: bidData.bidAmount,
        pickup_location: bidData.pickupLocation,
        destination: bidData.destination,
        req_id: bidData.reqId,
        timestamp: bidData.timestamp,
      };

      // Add this notification to the current notifications
      setNotifications((prev) => {
        // Check if notification already exists
        const exists = prev.some(
          (notif) =>
            notif.notification_id === notificationFromStoredData.notification_id
        );
        if (!exists) {
          return [notificationFromStoredData, ...prev];
        }
        return prev;
      });

      // Clear the stored data after reading it
      localStorage.removeItem("selectedBidNotification");
    }

    return () => {
      window.removeEventListener(
        "bidNotificationSelected",
        handleBidNotificationSelected
      );
      window.removeEventListener("driverBidAccepted", handleDriverResponse);
      window.removeEventListener("driverBidRejected", handleDriverResponse);
      window.removeEventListener(
        "counterOfferAccepted",
        handleCounterOfferResponse
      );
      window.removeEventListener(
        "counterOfferRejected",
        handleCounterOfferResponse
      );
    };
  }, []);

  // Handle accepting a driver bid
  const handleAcceptBid = async (notification) => {
    try {
      // Update notification status
      if (notification.notification_id) {
        await updateNotificationStatus(
          notification.notification_id,
          "accepted"
        );
      }

      // Create trip details
      const tripDetails = {
        trip_id: `trip_${Date.now()}`,
        rider_id: user.id,
        driver_id: notification.driver_id || notification.req_id,
        driver_name: notification.driver_name,
        driver_mobile: notification.driver_mobile,
        pickup_location:
          notification.pickup_location || latestRequest?.pickup_location,
        destination: notification.destination || latestRequest?.destination,
        fare: Number(notification.bid_amount) || 0,
        status: "confirmed",
        timestamp: new Date().toISOString(),
      };

      // Update Redux state
      dispatch(setOngoingTripDetails(tripDetails));
      dispatch(clearTripReq());
      dispatch(changeCheckoutStatus());

      // Remove notification
      setNotifications((prev) =>
        prev.filter(
          (notif) => notif.notification_id !== notification.notification_id
        )
      );

      // Navigate to ongoing trip
      window.location.href = "/ongoing_trip";

      // Notify map to load actual Dirde coordinates for this rider/driver pair
      try {
        const driverId = notification.driver_id; // must be the driver_id, not req_id
        window.dispatchEvent(
          new CustomEvent("bid-accepted", {
            detail: {
              type: "bid-accepted",
              data: {
                rider_id: user.id,
                driver_id: driverId,
              },
            },
          })
        );
      } catch (e) {
        console.warn("Could not dispatch bid-accepted event:", e);
      }

      // Also notify the driver via WebSocket so they get confirm/cancel
      try {
        await WebSocketController.sendMessage({
          type: "bid-accepted-for-confirmation",
          data: {
            rider_id: user.id,
            rider_name: user.name || "Rider",
            driver_id: notification.driver_id,
            req_id: notification.req_id,
            amount: notification.bid_amount,
            pickup_location:
              notification.pickup_location || latestRequest?.pickup_location,
            destination: notification.destination || latestRequest?.destination,
          },
        });
        await WebSocketController.sendMessage({
          type: "rider-accepted-notice",
          data: {
            rider_id: user.id,
            rider_name: user.name || "Rider",
            driver_id: notification.driver_id,
            req_id: notification.req_id,
            amount: notification.bid_amount,
            pickup_location:
              notification.pickup_location || latestRequest?.pickup_location,
            destination: notification.destination || latestRequest?.destination,
          },
        });
        await WebSocketController.sendMessage({
          type: "bid-confirmation-request",
          data: {
            rider_id: user.id,
            rider_name: user.name || "Rider",
            driver_id: notification.driver_id,
            req_id: notification.req_id,
            amount: notification.bid_amount,
            pickup_location:
              notification.pickup_location || latestRequest?.pickup_location,
            destination: notification.destination || latestRequest?.destination,
          },
        });
      } catch (_) {}
    } catch (error) {
      console.error("Error accepting bid:", error);
    }
  };

  // Handle rejecting a driver bid
  const handleRejectBid = async (notification) => {
    try {
      if (notification.notification_id) {
        await updateNotificationStatus(
          notification.notification_id,
          "rejected"
        );
      }

      // Remove notification
      setNotifications((prev) =>
        prev.filter(
          (notif) => notif.notification_id !== notification.notification_id
        )
      );
    } catch (error) {
      console.error("Error rejecting bid:", error);
    }
  };

  // Handle sending counter offer
  const handleSendCounterOffer = async (notification) => {
    if (!counterOffer || counterOffer <= 0) {
      alert("Please enter a valid counter offer amount");
      return;
    }

    try {
      console.log("🚀 Sending counter offer via WebSocket...");

      // Send counter offer via WebSocket
      await WebSocketController.sendMessage({
        type: "rider-counter-offer",
        data: {
          rider_id: user.id,
          driver_id: notification.driver_id || notification.req_id,
          req_id: notification.req_id,
          counter_offer: parseFloat(counterOffer),
          timestamp: new Date().toISOString(),
        },
      });

      // Create database notification for driver
      const driverNotification = {
        recipient_id: notification.driver_id || notification.req_id,
        recipient_type: "driver",
        sender_id: user.id,
        sender_type: "rider",
        notification_type: "counter_offer",
        title: "Rider Counter Offer",
        message: `Rider has sent a counter offer of ৳${counterOffer}`,
        pickup_location:
          notification.pickup_location ||
          latestRequest?.pickup_location ||
          "Pickup Location",
        destination:
          notification.destination ||
          latestRequest?.destination ||
          "Destination",
        req_id: notification.req_id,
        bid_amount: parseFloat(counterOffer),
        rider_name: user.name,
        rider_mobile: user.mobile,
      };

      // Send notification to database
      await apiFetch("/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(driverNotification),
      });

      console.log(
        "✅ WebSocket message and database notification sent successfully"
      );
      // Show success message
      alert(`Counter offer of ৳${counterOffer} sent to driver successfully!`);

      setShowCounterOffer(false);
      setCounterOffer("");
      setSelectedDriver(null);
    } catch (error) {
      console.error("❌ Error sending counter offer:", error);
      alert(`Error sending counter offer: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Driver Bids Received
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Review and respond to driver bids for your trip request
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-gray-100">
              <div className="text-sm text-gray-500 font-medium mb-2">
                Trip Request
              </div>
              <div className="flex items-center gap-2 text-gray-900">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-sm max-w-xs truncate">
                  {pickup_location}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-900 mt-2">
                <Navigation className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-sm max-w-xs truncate">
                  {destination}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Bids Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {notifications.length > 0 ? (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Available Bids
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Choose the best offer for your emergency transport
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg">
                  {notifications.length} New Bids
                </div>
              </div>

              <div className="grid gap-6">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.notification_id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-8 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 group"
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      {/* Driver Info Section */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Car className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {notification.driver_name || "Driver"}
                              </h3>
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 text-yellow-400 fill-current"
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {notification.driver_mobile || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Trip Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                                  Pickup
                                </p>
                                <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                  {notification.pickup_location ||
                                    pickup_location}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                <Navigation className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
                                  Destination
                                </p>
                                <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                  {notification.destination || destination}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bid Amount and Actions Section */}
                      <div className="flex flex-col lg:items-end gap-6">
                        {/* Bid Amount */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                          <div className="text-center">
                            <p className="text-sm font-medium text-green-100 mb-1">
                              Bid Amount
                            </p>
                            <p className="text-3xl font-bold">
                              ৳{notification.bid_amount || 0}
                            </p>
                            <p className="text-xs text-green-100 mt-1">
                              Emergency Transport
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                          <button
                            onClick={() => handleAcceptBid(notification)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            <Check className="w-5 h-5" />
                            <span>Accept Bid</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDriver(notification);
                              setShowCounterOffer(true);
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span>Counter Offer</span>
                          </button>
                          <button
                            onClick={() => handleRejectBid(notification)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            <X className="w-5 h-5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Driver Bids Yet
              </h3>
              <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                We're waiting for drivers to respond to your emergency transport
                request. This usually takes just a few minutes.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Searching for available drivers...</span>
              </div>
            </div>
          )}
        </div>

        {/* Counter Offer Modal */}
        {showCounterOffer && selectedDriver && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-100"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Send Counter Offer
                </h3>
                <p className="text-gray-600">
                  Negotiate a better price with the driver
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6 border border-green-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Driver's Bid:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    ৳{selectedDriver.bid_amount || 0}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Your Counter Offer (৳)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={counterOffer}
                    onChange={(e) => setCounterOffer(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSendCounterOffer(selectedDriver)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Send Counter Offer
                </button>
                <button
                  onClick={() => {
                    setShowCounterOffer(false);
                    setSelectedDriver(null);
                    setCounterOffer("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidNegotiation;
