import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Minus,
  Plus,
  Send,
  Navigation,
  Car,
  User,
  Phone,
  Star,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageCircle,
  X,
} from "lucide-react";
import AlignDriverInfo from "../AlignDriverInfo/AlignDriverInfo";
import LoadingIndicator from "./LoadingIndicator";
import { setOngoingTripDetails } from "../../store/slices/ongoing-trip-details-slice";
import { clearTripReq } from "../../store/slices/trip-request-slice";
import { changeCheckoutStatus } from "../../store/slices/checkout-status-slice";
import {
  getTripRequests,
  getNotifications,
  apiFetch,
} from "../../controllers/apiClient";
import { addDriverBid } from "../../store/slices/bidding-slice";
import WebSocketController from "../../controllers/websocket/ConnectionManger";
const DriverResponse = () => {
  const [currentFare, setCurrentFare] = useState(250); // Default fare
  const [isFetchingFare, setIsFetchingFare] = useState(false);
  const [fareSource, setFareSource] = useState("default");
  const [isUserEditing, setIsUserEditing] = useState(false); // Track if user is actively editing
  const [disableAllUpdates, setDisableAllUpdates] = useState(false); // Completely disable all updates
  const [acceptedCounterOffer, setAcceptedCounterOffer] = useState(null); // Track accepted counter offer
  const [incomingCounterOffer, setIncomingCounterOffer] = useState(null); // Track incoming counter offer
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const driverResponses = useSelector((state) => state.driverResponse);
  const tripRequests = useSelector((state) => state.tripRequests);
  const user = useSelector((state) => state.user);

  // Get the latest trip request for display
  const latestRequest =
    tripRequests && tripRequests.length > 0 ? tripRequests[0] : null;
  const destination = latestRequest
    ? latestRequest.destination
    : "Dhaka Medical College Hospital";

  // Listen for rider counter offer acceptance to stop loading
  useEffect(() => {
    const handleRiderCounterOfferAccepted = (event) => {
      console.log("🔄 DriverResponse - Rider counter offer accepted:", event.detail);
      setIsFetchingFare(false);
      setDisableAllUpdates(false);
      setAcceptedCounterOffer(event.detail);
      console.log("✅ Loading indicator stopped and updates re-enabled");
    };

    const handleRiderCounterOfferReceived = (event) => {
      console.log("🔄 DriverResponse - Rider counter offer received:", event.detail);
      setIncomingCounterOffer(event.detail);
    };

    window.addEventListener("riderCounterOfferAccepted", handleRiderCounterOfferAccepted);
    window.addEventListener("riderCounterOfferReceived", handleRiderCounterOfferReceived);

    return () => {
      window.removeEventListener("riderCounterOfferAccepted", handleRiderCounterOfferAccepted);
      window.removeEventListener("riderCounterOfferReceived", handleRiderCounterOfferReceived);
    };
  }, []);
  const pickup_location = latestRequest
    ? latestRequest.pickup_location
    : "Dhanmondi, Dhaka";

  const handleFareInput = (e) => {
    setIsUserEditing(true); // User is actively editing
    setDisableAllUpdates(true); // Disable all external updates while typing
    const value = parseInt(e.target.value) || 0;
    if (value >= 0) {
      setCurrentFare(value);
    }
  };

  const handleFareFocus = () => {
    setIsUserEditing(true);
    setDisableAllUpdates(true);
    console.log("🎯 User started editing fare input - ALL UPDATES DISABLED");
  };

  const handleFareBlur = () => {
    // Keep editing state for a bit longer after blur
    setTimeout(() => {
      setIsUserEditing(false);
      setDisableAllUpdates(false);
      console.log("🎯 User finished editing fare input - ALL UPDATES ENABLED");
    }, 5000); // Increased to 5 seconds to give user more time
  };

  const handleFareChange = (amount) => {
    setIsUserEditing(true); // User is actively editing
    setCurrentFare((prev) => Math.max(0, prev + amount));
  };

  // Reset editing state when user stops editing (after 3 seconds)
  useEffect(() => {
    if (isUserEditing) {
      const timer = setTimeout(() => {
        setIsUserEditing(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isUserEditing]);

  const [isSendingBid, setIsSendingBid] = useState(false);

  const handleSendFare = async () => {
    console.log("🚑 Driver sending bid:", currentFare);

    if (!latestRequest) {
      console.error("❌ No trip request available");
      alert("No trip request available. Please refresh the page.");
      return;
    }

    // Check WebSocket connection
    const connectionState = WebSocketController.getConnectionState();
    console.log("🔌 WebSocket connection state:", connectionState);

    if (!WebSocketController.isConnected()) {
      console.error("❌ WebSocket not connected");
      alert("WebSocket connection lost. Please refresh the page.");
      return;
    }

    setIsSendingBid(true);

    try {
      const bidData = {
        rider_id: latestRequest.rider_id,
        driver_id: user.id,
        req_id: latestRequest.req_id,
        amount: currentFare,
        driver_name: user.name,
        driver_mobile: user.mobile,
        pickup_location: latestRequest.pickup_location,
        destination: latestRequest.destination,
        rating: 4.5,
        vehicle: "Ambulance",
        eta: "5-10 mins",
        specialty: "Emergency Medical",
      };

      console.log("📤 Sending bid data:", bidData);

      // Send bid to driver notification system
      const messageToSend = {
        type: "driver-bid-notification",
        data: bidData,
      };

      console.log(
        "📨 Message to send:",
        JSON.stringify(messageToSend, null, 2)
      );

      const sendResult = await WebSocketController.sendMessage(messageToSend, {
        logFunction: (msg, type) =>
          console.log(`[${type.toUpperCase()}] ${msg}`),
      });

      console.log("📤 Send result:", sendResult);

      if (sendResult) {
        console.log("✅ Bid sent successfully to driver notification system");

        // Create notification in database for RIDER's notification panel
        console.log("📊 Latest request data:", {
          req_id: latestRequest.req_id,
          rider_id: latestRequest.rider_id,
          rider_name: latestRequest.rider_name,
          destination: latestRequest.destination,
          currentFare: currentFare,
        });

        console.log("👤 Current user (should be driver):", {
          id: user.id,
          name: user.name,
          role: user.role,
          mobile: user.mobile,
        });

        try {
          const notificationResponse = await apiFetch("/notifications", {
            method: "POST",
            body: JSON.stringify({
              recipient_id: latestRequest.rider_id, // RIDER receives the notification
              recipient_type: "rider", // This is for the rider
              notification_type: "driver_bid_sent",
              title: "Driver Sent You a Bid",
              message: `Driver ${user.name} sent you a bid of ৳${currentFare} for your trip to ${latestRequest.destination}`,
              req_id: latestRequest.req_id,
              bid_amount: currentFare, // This should not be null
              pickup_location: latestRequest.pickup_location,
              destination: latestRequest.destination,
              driver_name: user.name,
              driver_mobile: user.mobile,
              rider_name: latestRequest.rider_name || "Patient", // Add rider name
              status: "unread",
            }),
          });

          if (notificationResponse.ok) {
            const notificationData = await notificationResponse.json();
            console.log(
              "✅ Driver bid notification created in database:",
              notificationData
            );

            // Dispatch event to refresh driver notifications
            window.dispatchEvent(
              new CustomEvent("driverBidNotificationCreated", {
                detail: {
                  notificationId: notificationData.notification_id,
                  bidAmount: currentFare,
                  destination: latestRequest.destination,
                  timestamp: new Date().toISOString(),
                },
              })
            );
            console.log("📤 Event dispatched: driverBidNotificationCreated");
          } else {
            const errorData = await notificationResponse.json();
            console.error(
              "❌ Failed to create notification in database:",
              errorData
            );
          }
        } catch (error) {
          console.error("❌ Error creating notification:", error);
        }

        // Store driver's bid in localStorage for driver notification
        localStorage.setItem("driverBidAmount", currentFare.toString());
        localStorage.setItem("driverBidTimestamp", new Date().toISOString());
        localStorage.setItem("driverBidId", user.id);

        // Dispatch event to notify driver notification system
        window.dispatchEvent(
          new CustomEvent("driverBidSent", {
            detail: {
              amount: currentFare,
              driverId: user.id,
              driverName: user.name,
              timestamp: new Date().toISOString(),
            },
          })
        );

        alert(
          "Bid sent to driver notification system! Waiting for response..."
        );
      } else {
        console.error("❌ Failed to send bid - WebSocket returned false");
        alert("Failed to send bid. Please check WebSocket connection.");
      }
    } catch (error) {
      console.error("❌ Failed to send bid:", error);
      alert(`Failed to send bid: ${error.message}`);
    } finally {
      setIsSendingBid(false);
    }
  };

  const handleAcceptDriver = (driver) => {
    // Create ongoing trip details
    const tripDetails = {
      trip_id: Date.now(),
      rider_id: user.id,
      driver_id: driver.driver_id,
      driver_name: driver.driver_name,
      driver_mobile: driver.driver_mobile,
      pickup_location: pickup_location,
      destination: destination,
      fare: currentFare,
      status: "confirmed",
      timestamp: new Date().toISOString(),
    };

    // Set ongoing trip details
    dispatch(setOngoingTripDetails(tripDetails));

    // Clear trip requests
    dispatch(clearTripReq());

    // Change checkout status
    dispatch(changeCheckoutStatus());

    // Navigate to ongoing trip
    navigate("/ongoing_trip");
  };

  // Fetch fare from driver bid notifications
  const fetchDriverBidNotifications = async () => {
    try {
      setIsFetchingFare(true);
      console.log("🔄 Fetching driver bid notifications...");

      // Get notifications from database
      const res = await getNotifications();
      console.log("📋 Notifications response:", res);

      if (res.success && res.data && res.data.notifications) {
        const notifications = res.data.notifications;
        console.log("📋 Found notifications:", notifications.length);

        // Filter for driver bid notifications
        const driverBidNotifications = notifications.filter(
          (notif) =>
            notif.notification_type === "bid" && notif.status === "pending"
        );

        console.log(
          "📋 Driver bid notifications:",
          driverBidNotifications.length
        );

        if (driverBidNotifications.length > 0) {
          // Sort by timestamp to get the most recent bid
          const sortedBids = driverBidNotifications.sort((a, b) => {
            const timestampA = new Date(a.created_at || 0).getTime();
            const timestampB = new Date(b.created_at || 0).getTime();
            return timestampB - timestampA; // Most recent first
          });

          const latestBid = sortedBids[0];
          console.log("📊 Latest driver bid:", latestBid);
          console.log("⏰ Bid timestamp:", latestBid.created_at);
          console.log("💰 Bid amount:", latestBid.amount);
          console.log("👤 Driver ID:", latestBid.driver_id);
          console.log("👤 Rider ID:", latestBid.rider_id);

          // Update fare from the latest driver bid (only if user is not editing and updates are not disabled)
          if (
            latestBid.amount &&
            latestBid.amount > 0 &&
            !isUserEditing &&
            !disableAllUpdates
          ) {
            console.log(
              "✅ Setting fare to driver bid:",
              latestBid.amount,
              "from timestamp:",
              latestBid.created_at
            );
            setCurrentFare(latestBid.amount);
            setFareSource("notification");
          } else if (isUserEditing || disableAllUpdates) {
            console.log(
              "⏸️ Skipping fare update - user is actively editing or updates disabled"
            );
          } else {
            console.log("❌ No valid bid amount found");
          }
        } else {
          console.log("❌ No driver bid notifications found");
        }
      } else {
        console.log("❌ Failed to fetch notifications");
      }
    } catch (error) {
      console.error("❌ Error fetching driver bid notifications:", error);
    } finally {
      setIsFetchingFare(false);
    }
  };

  // Listen for rider response to driver bid via notification
  useEffect(() => {
    const handleRiderBidResponseFromNotification = (event) => {
      const { amount, timestamp, driverId, riderId, notificationId } =
        event.detail;
      console.log("🎯 Rider responded to driver bid via notification:", {
        amount,
        timestamp,
        driverId,
        riderId,
        notificationId,
      });

      if (amount && amount > 0 && !isUserEditing && !disableAllUpdates) {
        console.log(
          "✅ Rider accepted driver bid from notification, updating fare to:",
          amount
        );
        setCurrentFare(amount);
        setFareSource("driver_notification");
        setIsSendingBid(false); // Stop loading
      } else if (isUserEditing || disableAllUpdates) {
        console.log(
          "⏸️ Skipping fare update - user is actively editing or updates disabled"
        );
      }
    };

    // Listen for custom event from rider responding to driver bid via notification
    window.addEventListener(
      "driverBidResponse",
      handleRiderBidResponseFromNotification
    );

    // Also listen for rider bid response
    const handleRiderBidResponse = (event) => {
      const { amount, timestamp, riderId, driverId, notificationId } =
        event.detail;
      console.log("🎯 Rider responded to driver bid:", {
        amount,
        timestamp,
        riderId,
        driverId,
        notificationId,
      });

      if (amount && amount > 0 && !isUserEditing && !disableAllUpdates) {
        console.log("✅ Rider accepted driver bid, updating fare to:", amount);
        setCurrentFare(amount);
        setFareSource("rider_response");
        setIsSendingBid(false); // Stop loading
      } else if (isUserEditing || disableAllUpdates) {
        console.log(
          "⏸️ Skipping fare update - user is actively editing or updates disabled"
        );
      }
    };

    window.addEventListener("riderBidResponse", handleRiderBidResponse);

    // Check localStorage for existing fare
    const storedFare = localStorage.getItem("driverResponseFare");
    const storedTimestamp = localStorage.getItem("driverResponseTimestamp");

    if (storedFare && storedTimestamp && !isUserEditing && !disableAllUpdates) {
      console.log("🔄 Using stored fare from localStorage:", storedFare);
      setCurrentFare(parseInt(storedFare));
      setFareSource("notification");
    }

    // Removed localStorage polling to prevent automatic updates

    return () => {
      window.removeEventListener(
        "driverBidResponse",
        handleRiderBidResponseFromNotification
      );
      window.removeEventListener("riderBidResponse", handleRiderBidResponse);
    };
  }, []);

  // Fetch driver bid notifications for real-time fare updates
  useEffect(() => {
    // First try Redux store (only if user is not editing and updates are not disabled)
    if (
      tripRequests &&
      tripRequests.length > 0 &&
      tripRequests[0].fare &&
      !isUserEditing &&
      !disableAllUpdates
    ) {
      console.log("🔄 Using fare from Redux:", tripRequests[0].fare);
      setCurrentFare(tripRequests[0].fare);
    } else if (isUserEditing || disableAllUpdates) {
      console.log(
        "⏸️ Skipping Redux fare update - user is actively editing or updates disabled"
      );
    }

    // Then fetch driver bid notifications (only if user is not editing and updates are not disabled)
    if (!isUserEditing && !disableAllUpdates) {
      fetchDriverBidNotifications();
    }

    // Fetch driver bids every 5 seconds for real-time updates (only if user is not editing and updates are not disabled)
    const interval = setInterval(() => {
      if (!isUserEditing && !disableAllUpdates) {
        fetchDriverBidNotifications();
      } else {
        console.log(
          "⏸️ Skipping scheduled fetch - user is actively editing or updates disabled"
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isUserEditing, disableAllUpdates]); // Removed tripRequests from dependencies to prevent unwanted re-renders

  // Note: This component is accessible to both drivers and riders
  // It shows available EMT services/drivers for trip requests

  return (
    <div className="min-h-screen  p-2 sm:p-4">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200/50">
        <div className="flex flex-col xl:flex-row min-h-[70vh]">
          {/* Drivers List Section */}
          <div className="flex flex-col w-full xl:w-3/5">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 via-red-700 to-blue-600 text-white p-4 sm:p-6">
              <div className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-2xl border border-white/20">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Navigation className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="text-red-100 text-xs sm:text-sm font-medium">
                      Your Destination
                    </p>
                    <p className="text-white font-bold text-base sm:text-lg">
                      {destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-blue-100 text-xs sm:text-sm">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  <span>From: {pickup_location}</span>
                </div>
              </div>
            </div>

            {/* Drivers List */}
            <div className="flex-1 bg-gray-50 overflow-y-auto">
              {driverResponses && driverResponses.length > 0 ? (
                <div className="p-3 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                      Available EMT Services
                    </h3>
                    <div className="bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      {driverResponses.length} Available
                    </div>
                  </div>

                  {driverResponses
                    .sort((a, b) => b.driver_id - a.driver_id)
                    .map((driver) => (
                      <div
                        key={driver.driver_id}
                        className="transform hover:-translate-y-1 transition-all duration-200"
                      >
                        <AlignDriverInfo
                          driver_name={driver.driver_name}
                          driver_mobile={driver.driver_mobile}
                          req_id={driver.req_id}
                          fare={driver.amount}
                          driver_id={driver.driver_id}
                          specialty={driver.specialty}
                          rating={driver.rating}
                          vehicle={driver.vehicle}
                          eta={driver.eta}
                          pickup_location={pickup_location}
                          destination={destination}
                          onAccept={() => handleAcceptDriver(driver)}
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <LoadingIndicator text="Searching for nearby emergency medical services..." />
              )}
            </div>
          </div>

          {/* Fare Section - Fixed width and padding issues */}
          <div className="w-full xl:w-2/5 bg-gradient-to-b from-red-50 via-white to-blue-50 border-t xl:border-t-0 xl:border-l border-gray-200 flex flex-col">
            <div className="p-3 sm:p-4 lg:p-6 pb-4 flex-1">
              {/* Fare Display */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-500 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                        Driver Bid Amount
                      </p>
                      <div className="flex items-center text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
                        <span className="font-medium">
                          {fareSource === "driver_notification"
                            ? "From Driver Notification"
                            : fareSource === "rider_response"
                            ? "Rider Accepted Driver Bid"
                            : fareSource === "notification"
                            ? "From Driver Bid Notification"
                            : "Live from Database"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                        {isFetchingFare ? (
                          <span className="text-gray-400 flex items-center">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Loading...
                          </span>
                        ) : (
                          `৳${currentFare}`
                        )}
                      </span>
                      <span className="ml-2 text-red-500 text-xs sm:text-sm font-bold bg-red-100 px-2 py-1 rounded-lg">
                        BDT
                      </span>
                      {isFetchingFare && (
                        <div className="ml-2 flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1"></div>
                          <span className="text-xs text-blue-600 font-medium">
                            Fetching from DB...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-100 px-3 sm:px-4 py-2 rounded-2xl shadow-sm border border-blue-200">
                    <div className="flex items-center text-blue-700">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span className="text-xs sm:text-sm font-bold">
                        ~4.5 km
                      </span>
                    </div>
                  </div>
                </div>

                
                {/* Incoming Counter Offer Display */}
                {incomingCounterOffer && (
                  <div className="mb-4 sm:mb-6">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
                          <p className="text-blue-800 font-semibold text-sm">
                            New Counter Offer from Rider
                          </p>
                        </div>
                        <button
                          onClick={() => setIncomingCounterOffer(null)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-blue-700">
                          ৳{incomingCounterOffer.counter_offer || incomingCounterOffer.amount || '0'}
                        </span>
                        <span className="ml-2 text-blue-600 text-sm font-medium">
                          (Rider's Counter Offer)
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Rider has sent a counter offer for this trip
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            // Accept the counter offer
                            window.dispatchEvent(new CustomEvent("riderCounterOfferAccepted", {
                              detail: {
                                riderAmount: incomingCounterOffer.counter_offer || incomingCounterOffer.amount,
                                riderId: incomingCounterOffer.rider_id,
                                reqId: incomingCounterOffer.req_id
                              }
                            }));
                            setIncomingCounterOffer(null);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setIncomingCounterOffer(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accepted Counter Offer Display */}
                {acceptedCounterOffer && (
                  <div className="mb-4 sm:mb-6">
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          <p className="text-green-800 font-semibold text-sm">
                            Counter Offer Accepted
                          </p>
                        </div>
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-green-700">
                          ৳{acceptedCounterOffer.riderAmount}
                        </span>
                        <span className="ml-2 text-green-600 text-sm font-medium">
                          (Rider's Offer)
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Trip confirmed with rider's counter offer amount
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom Fare Input */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Set Your Budget
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center">
                      <div className="bg-red-100 text-red-700 px-3 sm:px-4 py-3 rounded-l-2xl border-r border-red-200 font-bold text-sm sm:text-base">
                        ৳
                      </div>
                    </div>
                    <input
                      key={`fare-input-${isUserEditing}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={currentFare}
                      onChange={handleFareInput}
                      onFocus={handleFareFocus}
                      onBlur={handleFareBlur}
                      className="w-full pl-12 sm:pl-16 pr-4 py-3 border-2 border-gray-200 rounded-2xl bg-white focus:border-red-400 focus:ring-0 transition-all duration-300 text-lg sm:text-xl font-bold text-gray-900"
                      placeholder="Enter amount"
                      disabled={isFetchingFare}
                    />
                  </div>
                </div>

                {/* Adjustment Buttons */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <button
                    onClick={() => handleFareChange(-50)}
                    disabled={currentFare <= 50}
                    className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-red-200 text-gray-700 py-2 sm:py-3 px-2 sm:px-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>৳50</span>
                  </button>

                  <button
                    onClick={() => handleFareChange(50)}
                    className="bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 text-red-700 py-2 sm:py-3 px-2 sm:px-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 text-sm sm:text-base"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>৳50</span>
                  </button>
                </div>

                {/* Debug Panel */}
                <div className="mb-4 sm:mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-xs font-semibold text-yellow-700 mb-2">
                    Debug: Driver Bid Notifications
                  </p>
                  <button
                    onClick={fetchDriverBidNotifications}
                    className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600 mr-2"
                  >
                    Fetch Driver Bids
                  </button>
                  <button
                    onClick={() => {
                      console.log("🔍 Redux tripRequests:", tripRequests);
                      console.log("🔍 User token:", user?.token);
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded-lg text-xs font-medium hover:bg-gray-600"
                  >
                    Debug
                  </button>
                  <div className="mt-2 text-xs text-yellow-600">
                    <p>Current: ৳{currentFare}</p>
                    <p>Loading: {isFetchingFare ? "Yes" : "No"}</p>
                    <p>Redux: {tripRequests?.length || 0} requests</p>
                    <p>User: {user?.name || "Not logged in"}</p>
                    <p>Pickup: {latestRequest?.pickup_location || "N/A"}</p>
                    <p>Destination: {latestRequest?.destination || "N/A"}</p>
                    <p>
                      Timestamp:{" "}
                      {latestRequest?.timestamp
                        ? new Date(latestRequest.timestamp).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Quick Amount Selection */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Quick Select
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {[200, 250, 300, 350, 400, 450].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCurrentFare(amount)}
                        className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 border-2 ${
                          currentFare === amount
                            ? "bg-red-500 text-white border-red-500 shadow-lg transform scale-105"
                            : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50"
                        }`}
                      >
                        ৳{amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <div className="p-3 sm:p-4 lg:p-6 pt-0 border-t border-gray-100">
              <button
                onClick={handleSendFare}
                disabled={!latestRequest || isSendingBid}
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-2xl font-bold text-sm sm:text-lg flex items-center justify-center space-x-3 transition-all duration-300 ${
                  !latestRequest || isSendingBid
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                }`}
              >
                {isSendingBid ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Sending Bid...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Send Bid to driver</span>
                  </>
                )}
              </button>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center text-blue-700 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="font-medium">
                    Emergency medical services will be notified of your budget
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DriverResponse };
