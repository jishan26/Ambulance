import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Car,
  User,
  Phone,
  Star,
  DollarSign,
  Navigation,
} from "lucide-react";
import { setOngoingTripDetails } from "../../../store/slices/ongoing-trip-details-slice";
import { clearTripReq } from "../../../store/slices/trip-request-slice";
import { changeCheckoutStatus } from "../../../store/slices/checkout-status-slice";
import {
  getNotifications,
  getAvailableDriversCount,
} from "../../../controllers/apiClient";
import WebSocketController from "../../../controllers/websocket/ConnectionManger";

const AvailableDrivers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const driverResponses = useSelector((state) => state.driverResponse);
  const tripRequests = useSelector((state) => state.tripRequests);
  const user = useSelector((state) => state.user);

  // State for decline tracking
  const [isDeclined, setIsDeclined] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [onlineDriversCount, setOnlineDriversCount] = useState(0);
  const [declinedDriversCount, setDeclinedDriversCount] = useState(0);
  const [requestStartTime, setRequestStartTime] = useState(null);

  // Get the latest trip request for display
  const latestRequest =
    tripRequests && tripRequests.length > 0 ? tripRequests[0] : null;
  const destination = latestRequest
    ? latestRequest.destination
    : "Dhaka Medical College Hospital";
  const pickup_location = latestRequest
    ? latestRequest.pickup_location
    : "Dhanmondi, Dhaka";

  // WebSocket message handler for real-time decline notifications
  useEffect(() => {
    const handleWebSocketMessage = (message) => {
      console.log("🔌 AvailableDrivers - WebSocket message received:", message);
      console.log(
        "🔌 AvailableDrivers - Current latestRequest:",
        latestRequest
      );
      console.log("🔌 AvailableDrivers - Current user.id:", user.id);

      if (message.type === "driver_declined_request") {
        const { req_id, driver_id, rider_id, reason } = message.data;
        console.log(
          "🚫 AvailableDrivers - WebSocket driver decline received:",
          { req_id, driver_id, rider_id, reason }
        );
        console.log(
          "🚫 AvailableDrivers - Comparing req_id:",
          req_id,
          "with latestRequest.req_id:",
          latestRequest?.req_id
        );
        console.log(
          "🚫 AvailableDrivers - Comparing rider_id:",
          rider_id,
          "with user.id:",
          user.id
        );

        // Check if this is for the current rider and trip request
        if (
          latestRequest &&
          latestRequest.req_id === req_id &&
          user.id === rider_id
        ) {
          console.log(
            "🚫 AvailableDrivers - WebSocket decline for our trip request, notification will be handled by Notification component"
          );

          // The notification will be handled by the existing Notification component
          // No need to show custom popup here
          console.log(
            "✅ AvailableDrivers - Driver decline will be shown in notification panel"
          );
        } else {
          console.log(
            "⚠️ AvailableDrivers - Decline not for our request or rider"
          );
        }
      } else if (message.type === "online_drivers_count") {
        const { count, req_id } = message.data;
        console.log(
          "🔌 AvailableDrivers - WebSocket online drivers count received:",
          { count, req_id }
        );

        // Check if this is for our current trip request
        if (latestRequest && latestRequest.req_id === req_id) {
          console.log(
            "🔌 AvailableDrivers - Setting online drivers count from WebSocket:",
            count
          );
          setOnlineDriversCount(count);
        } else {
          console.log("⚠️ AvailableDrivers - Count not for our request");
        }
      }
    };

    // Set up WebSocket message handler
    console.log("🔌 AvailableDrivers - Setting up WebSocket message handler");
    console.log(
      "🔌 AvailableDrivers - WebSocketController available:",
      !!window.WebSocketController
    );
    console.log(
      "🔌 AvailableDrivers - WebSocket connected:",
      WebSocketController?.isConnected()
    );

    if (window.WebSocketController) {
      // Store the original onMessage handler
      const originalOnMessage = window.WebSocketController.options?.onMessage;
      console.log(
        "🔌 AvailableDrivers - Original onMessage handler:",
        !!originalOnMessage
      );

      // Create a new handler that calls both original and our handler
      window.WebSocketController.options = {
        ...window.WebSocketController.options,
        onMessage: (message) => {
          console.log(
            "🔌 AvailableDrivers - WebSocket onMessage called with:",
            message
          );
          // Call original handler if it exists
          if (originalOnMessage) {
            try {
              originalOnMessage(message);
            } catch (error) {
              console.error(
                "❌ AvailableDrivers - Error in original onMessage handler:",
                error
              );
            }
          }
          // Call our handler
          try {
            handleWebSocketMessage(message);
          } catch (error) {
            console.error(
              "❌ AvailableDrivers - Error in our onMessage handler:",
              error
            );
          }
        },
      };
      console.log(
        "✅ AvailableDrivers - WebSocket message handler set up successfully"
      );
    } else {
      console.warn("⚠️ AvailableDrivers - WebSocketController not available");
    }

    return () => {
      // Cleanup if needed
    };
  }, [latestRequest, user.id, onlineDriversCount, dispatch]);

  // Set request start time when component mounts
  useEffect(() => {
    if (latestRequest && !requestStartTime) {
      setRequestStartTime(Date.now());
      console.log(
        "🕐 AvailableDrivers - Request start time set:",
        new Date().toISOString()
      );

      // Request initial online drivers count via WebSocket
      if (window.WebSocketController && WebSocketController.isConnected()) {
        console.log(
          "🔌 AvailableDrivers - Requesting initial online drivers count via WebSocket"
        );
        WebSocketController.sendMessage({
          type: "get_online_drivers_count",
          data: {
            req_id: latestRequest.req_id,
            rider_id: user.id,
          },
        });
      }
    }
  }, [latestRequest, requestStartTime, user.id]);

  // Check for timeout (5 minutes)
  useEffect(() => {
    if (!latestRequest || !requestStartTime) return;

    const timeout = setTimeout(() => {
      console.log(
        "⏰ AvailableDrivers - Request timeout, no drivers responded in 5 minutes"
      );
      setDeclineReason("request_timeout");
      setIsDeclined(true);
      dispatch(clearTripReq());

      window.dispatchEvent(
        new CustomEvent("flipToRideSearchForm", {
          detail: {
            reason: "request_timeout",
            reqId: latestRequest.req_id,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }, 300000); // 5 minutes

    return () => clearTimeout(timeout);
  }, [latestRequest, requestStartTime, dispatch]);

  const handleDriverSelect = (driver) => {
    console.log("🚑 Rider selected driver:", driver);

    // Create ongoing trip details
    const tripDetails = {
      trip_id: Date.now(),
      rider_id: user.id,
      driver_id: driver.driver_id,
      driver_name: driver.driver_name,
      driver_mobile: driver.driver_mobile,
      pickup_location: pickup_location,
      destination: destination,
      fare: Number(driver.driver_offer) || 250,
      status: "confirmed",
      timestamp: new Date().toISOString(),
    };

    // Store trip details in Redux
    dispatch(setOngoingTripDetails(tripDetails));

    // Clear trip request
    dispatch(clearTripReq());

    // Navigate to ongoing trip
    navigate("/ongoing_trip");
  };

  // Show decline message if trip was declined
  if (isDeclined) {
    const getDeclineMessage = () => {
      switch (declineReason) {
        case "all_online_drivers_declined":
          return {
            title: "All Online Drivers Declined",
            message: `All ${onlineDriversCount} online drivers have declined your trip request. You can create a new request.`,
            icon: "🚫",
          };
        case "request_timeout":
          return {
            title: "Request Timeout",
            message:
              "No drivers responded to your request within 5 minutes. You can create a new request.",
            icon: "⏰",
          };
        default:
          return {
            title: "Request Declined",
            message:
              "Your trip request has been declined. You can create a new request.",
            icon: "❌",
          };
      }
    };

    const declineInfo = getDeclineMessage();

    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{declineInfo.icon}</span>
              </div>
              <h2 className="text-2xl font-bold text-red-800 mb-4">
                {declineInfo.title}
              </h2>
              <p className="text-gray-600 mb-6">{declineInfo.message}</p>
              <button
                onClick={() => {
                  setIsDeclined(false);
                  setDeclineReason("");
                  // The parent component will handle flipping back to RideSearchForm
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Create New Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Header */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Navigation className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Emergency Transport
                  </h1>
                  <p className="text-gray-600">Available EMT Services</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  {driverResponses?.length || 0} Available
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details Card */}
        <div className="mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MapPin className="text-blue-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Pickup Location
                    </p>
                    <p className="font-semibold text-gray-900">
                      {pickup_location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Navigation className="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Destination
                    </p>
                    <p className="font-semibold text-gray-900">{destination}</p>
                  </div>
                </div>
              </div>

              {/* Response Status */}
              {onlineDriversCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-orange-800">
                      Response Status
                    </span>
                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      {declinedDriversCount}/{onlineDriversCount} declined
                    </span>
                  </div>
                  <div className="w-full h-2 bg-orange-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ease-out"
                      style={{
                        width: `${
                          onlineDriversCount > 0
                            ? (declinedDriversCount / onlineDriversCount) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  {declinedDriversCount >= onlineDriversCount &&
                    onlineDriversCount > 0 && (
                      <p className="text-xs text-red-600 mt-2 font-medium flex items-center">
                        ⚠️ All drivers declined - redirecting...
                      </p>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drivers Grid */}
        <div className="space-y-4">
          {driverResponses && driverResponses.length > 0 ? (
            <>
              {/* Test Controls */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Debug Controls
                  </h4>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setDeclineReason("all_online_drivers_declined");
                      setIsDeclined(true);
                      dispatch(clearTripReq());
                      window.dispatchEvent(
                        new CustomEvent("flipToRideSearchForm", {
                          detail: {
                            reason: "all_online_drivers_declined",
                            reqId: latestRequest?.req_id,
                            timestamp: new Date().toISOString(),
                          },
                        })
                      );
                    }}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Test Decline
                  </button>
                  <button
                    onClick={() => {
                      if (WebSocketController.isConnected()) {
                        WebSocketController.sendMessage({
                          type: "driver_declined_request",
                          data: {
                            req_id: latestRequest?.req_id,
                            driver_id: 999,
                            rider_id: user.id,
                            timestamp: new Date().toISOString(),
                            reason: "driver_declined",
                          },
                        });
                      }
                    }}
                    className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Test WebSocket
                  </button>
                </div>
              </div>

              {/* Driver Cards */}
              {driverResponses
                .sort((a, b) => b.driver_id - a.driver_id)
                .map((driver, index) => (
                  <div
                    key={driver.driver_id}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => handleDriverSelect(driver)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Car className="text-white w-7 h-7" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {driver.driver_name}
                          </h3>
                          <p className="text-gray-600">
                            {driver.vehicle || "Emergency Ambulance"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">
                          ৳{driver.driver_offer || 250}
                        </div>
                        <p className="text-sm text-gray-500">Estimated Fare</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2 bg-blue-50 rounded-xl p-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">
                            {driver.eta || "5-10"}
                          </p>
                          <p className="text-xs text-blue-600">minutes</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-yellow-50 rounded-xl p-3">
                        <Star className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-900">
                            {driver.rating || "4.5"}
                          </p>
                          <p className="text-xs text-yellow-600">rating</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-green-50 rounded-xl p-3">
                        <Phone className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-semibold text-green-900">
                            {driver.driver_mobile}
                          </p>
                          <p className="text-xs text-green-600">contact</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                        {driver.specialty || "Emergency Medical"}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          Tap to Select
                        </p>
                        <p className="text-xs text-gray-500">This driver</p>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Searching for EMT Services
              </h3>
              <p className="text-gray-600 mb-6">
                We're actively looking for available emergency medical transport
                in your area...
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailableDrivers;
