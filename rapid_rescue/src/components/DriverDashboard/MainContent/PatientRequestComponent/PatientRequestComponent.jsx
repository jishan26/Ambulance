import { FaToggleOff, FaAmbulance, FaUserMd } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import IncomingTrips from "../../../IncomingTrips/IncomingTrips";
import TripCheckout from "../../../TripCheckout/TripCheckout";
import PropTypes from "prop-types";
import { removeTripReq } from "../../../../store/slices/trip-request-slice";
import { addDriverResponse } from "../../../../store/slices/driver-response-slice";
import WebSocketController from "../../../../controllers/websocket/ConnectionManger";
import {
  getTripRequests,
  declineTripRequest,
  createNotification,
} from "../../../../controllers/apiClient";

const PatientRequestComponent = ({
  isAvailable = false,
  isCheckedOut = false,
  toggleAvailability = () => {},
  totalIncomingRequests = 0,
  onStartBidding = () => {},
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const tripRequests = useSelector((state) => state.tripRequests);

  // State for database trip requests (pending status only)
  const [pendingTripRequests, setPendingTripRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isWaitingForRequests, setIsWaitingForRequests] = useState(false);

  // State for rider counter offer
  const [riderCounterOffer, setRiderCounterOffer] = useState(null);
  const [showRiderAmount, setShowRiderAmount] = useState(false);

  // Listen for rider cancellation events
  useEffect(() => {
    const handleRiderCancelledBid = (event) => {
      const { notificationId, timestamp, riderId } = event.detail;
      console.log("🎯 Rider cancelled bid:", {
        notificationId,
        timestamp,
        riderId,
      });

      // Set waiting state when rider cancels
      setIsWaitingForRequests(true);
      console.log(
        "⏳ Driver waiting for new requests after rider cancellation"
      );

      // Redirect to driver dashboard
      navigate("/driver_dashboard");
      console.log("🔄 Redirecting to driver dashboard");

      // Auto-hide waiting state after 5 seconds
      setTimeout(() => {
        setIsWaitingForRequests(false);
        console.log("✅ Waiting state cleared");
      }, 5000);
    };

    // Listen for custom event from rider cancellation
    window.addEventListener("riderCancelledBid", handleRiderCancelledBid);

    return () => {
      window.removeEventListener("riderCancelledBid", handleRiderCancelledBid);
    };
  }, []);

  // Listen for rider counter offer acceptance
  useEffect(() => {
    const handleRiderCounterOfferAccepted = (event) => {
      const {
        riderAmount,
        riderId,
        reqId,
        pickupLocation,
        destination,
        tripDetails,
      } = event.detail;
      console.log("🎯 Rider counter offer accepted:", {
        riderAmount,
        riderId,
        reqId,
        pickupLocation,
        destination,
      });

      // Stop loading indicator
      setIsLoadingRequests(false);
      setIsWaitingForRequests(false);

      // Set rider counter offer data
      setRiderCounterOffer({
        amount: riderAmount,
        riderId: riderId,
        reqId: reqId,
        pickupLocation: pickupLocation,
        destination: destination,
        tripDetails: tripDetails,
      });

      // Show rider amount
      setShowRiderAmount(true);

      console.log("✅ Loading stopped, rider amount displayed:", riderAmount);
    };

    // Listen for custom event from rider counter offer acceptance
    window.addEventListener(
      "riderCounterOfferAccepted",
      handleRiderCounterOfferAccepted
    );

    return () => {
      window.removeEventListener(
        "riderCounterOfferAccepted",
        handleRiderCounterOfferAccepted
      );
    };
  }, []);

  // Fetch pending trip requests from database
  const fetchPendingTripRequests = async () => {
    if (!user.id || user.role !== "driver") return;

    setIsLoadingRequests(true);
    try {
      console.log("🔄 Fetching pending trip requests from database...");
      const result = await getTripRequests();

      if (result.success && result.data && result.data.requests) {
        // Backend already filters for pending status for drivers
        const pendingRequests = result.data.requests.filter(
          (req) => req.status === "pending"
        );
        setPendingTripRequests(pendingRequests);
        console.log(
          `✅ Found ${pendingRequests.length} pending trip requests:`,
          pendingRequests
        );
      } else {
        console.log("❌ Failed to fetch trip requests:", result.error);
        setPendingTripRequests([]);
      }
    } catch (error) {
      console.error("❌ Error fetching trip requests:", error);
      setPendingTripRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Fetch trip requests when component mounts and when driver goes online
  useEffect(() => {
    if (isAvailable && user.role === "driver") {
      fetchPendingTripRequests();

      // Set up interval to refresh every 10 seconds
      const interval = setInterval(fetchPendingTripRequests, 10000);

      return () => clearInterval(interval);
    } else {
      // Clear pending requests when offline
      setPendingTripRequests([]);
    }
  }, [isAvailable, user.id, user.role]);

  // Also fetch when user changes
  useEffect(() => {
    if (user.id && user.role === "driver" && isAvailable) {
      fetchPendingTripRequests();
    }
  }, [user.id, user.role]);

  const handleMakeBid = (request) => {
    // Start bidding process - go to TripCheckout for driver
    onStartBidding(request);
  };

  const handleDeclineRequest = async (request) => {
    try {
      console.log("🚫 Driver declining request:", request.req_id);

      // Call the API to permanently decline the request
      const result = await declineTripRequest(request.req_id);

      if (result.success) {
        console.log("✅ Request permanently declined:", result.data);

        // Send notification to rider about driver decline
        console.log("🚫 PatientRequestComponent - Creating decline notification for rider:", {
          reqId: request.req_id,
          driverId: user.id,
          riderId: request.rider_id
        });
        
        try {
          // Create notification in database
          const notificationData = {
            recipient_id: request.rider_id,
            sender_id: user.id,
            notification_type: "driver_declined_request",
            title: "Driver Declined Your Request",
            message: `A driver has declined your trip request. You can get back to rider form to find other drivers.`,
            pickup_location: request.pickup_location,
            destination: request.destination,
            fare: request.fare,
            req_id: request.req_id,
            driver_id: user.id,
            rider_id: request.rider_id,
            driver_name: user.name || `Driver ${user.id}`,
            driver_mobile: user.mobile || "N/A",
            timestamp: new Date().toISOString(),
            status: "unread"
          };
          
          console.log("🚫 PatientRequestComponent - Notification data:", notificationData);
          
          // Create notification directly via API
          try {
            const notificationResult = await createNotification(notificationData);
            
            if (notificationResult.success) {
              console.log("✅ Notification created successfully");
            } else {
              console.error("❌ Failed to create notification:", notificationResult.error);
            }
          } catch (error) {
            console.error("❌ Error creating notification:", error);
          }
        } catch (error) {
          console.error("❌ PatientRequestComponent - Error sending decline notification:", error);
        }

        // Remove from Redux state
        dispatch(removeTripReq(request.req_id));

        // Remove from local state immediately
        setPendingTripRequests((prev) =>
          prev.filter((req) => req.req_id !== request.req_id)
        );

        // Show success message
        alert(`Request permanently declined! It will never appear again.`);

        // Refresh from database to ensure consistency
        setTimeout(() => {
          if (isAvailable) {
            fetchPendingTripRequests();
          }
        }, 1000);
      } else {
        console.error("❌ Failed to decline request:", result.error);
        alert(
          `Failed to decline request: ${
            result.error.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("❌ Error declining request:", error);
      alert(`Error declining request: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">
                Patient Requests
              </h3>
              <p className="text-sm text-slate-500">
                Emergency dispatch center
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isAvailable ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            ></div>
            <span
              className={`text-sm font-medium ${
                isAvailable ? "text-green-600" : "text-red-600"
              }`}
            >
              {isAvailable ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* <IncomingTrips /> */}

      <div className="p-6 h-[400px] flex flex-col">
        {!isAvailable && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-slate-800 mb-3">
              You're Offline
            </h4>
            <p className="text-slate-500 mb-6 max-w-sm leading-relaxed">
              Toggle your availability to start receiving emergency transport
              requests from patients in need.
            </p>
            <button
              onClick={toggleAvailability}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 hover:scale-105"
            >
              Go Online
            </button>
          </div>
        )}

        {isAvailable &&
          !isLoadingRequests &&
          pendingTripRequests.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-2xl font-bold text-slate-800 mb-3">
                Standing By
              </h4>
              <p className="text-slate-500 mb-6 max-w-sm leading-relaxed">
                Your ambulance is ready to respond. We'll alert you as soon as a
                patient needs emergency transport.
              </p>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  Monitoring requests (refreshing every 10s)
                </span>
              </div>
            </div>
          )}

        {isAvailable &&
          (pendingTripRequests.length > 0 || isLoadingRequests) && (
            <div className="flex-1">
              {isCheckedOut ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-slate-800 mb-2">
                      Trip in Progress
                    </h4>
                    <p className="text-slate-500">
                      Currently serving a patient
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-800">
                      Incoming Requests
                    </h4>
                    <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      {pendingTripRequests.length} active
                    </div>
                  </div>
                  <div className="space-y-3">
                    {/* Show rider counter offer if accepted */}
                    {showRiderAmount && riderCounterOffer && (
                      <div className="p-4 border-2 border-green-200 bg-green-50 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-green-800">
                            ✅ Rider Counter Offer Accepted
                          </h5>
                          <span className="text-xs text-green-600">
                            {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm text-green-700 mb-3 space-y-1">
                          <p>
                            <strong>Rider Amount:</strong> ৳
                            {riderCounterOffer.amount}
                          </p>
                          <p>
                            <strong>From:</strong>{" "}
                            {riderCounterOffer.pickupLocation}
                          </p>
                          <p>
                            <strong>To:</strong> {riderCounterOffer.destination}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleMakeBid({
                                req_id: riderCounterOffer.reqId,
                                pickup_location:
                                  riderCounterOffer.pickupLocation,
                                destination: riderCounterOffer.destination,
                                fare: riderCounterOffer.amount,
                              })
                            }
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Bid Further
                          </button>
                          <button
                            onClick={() => {
                              setShowRiderAmount(false);
                              setRiderCounterOffer(null);
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}

                    {isLoadingRequests ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading requests...</p>
                      </div>
                    ) : pendingTripRequests &&
                      pendingTripRequests.length > 0 ? (
                      pendingTripRequests.map((request, index) => (
                        <div
                          key={request.req_id}
                          className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-800">
                              Emergency Request #{index + 1}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(request.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 mb-3 space-y-1">
                            <p>
                              <strong>From:</strong> {request.pickup_location}
                            </p>
                            <p>
                              <strong>To:</strong> {request.destination}
                            </p>
                            <p>
                              <strong>Budget:</strong> ৳{request.fare}
                            </p>
                            <p>
                              <strong>Status:</strong>{" "}
                              <span className="text-orange-600 font-medium">
                                {request.status}
                              </span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMakeBid(request)}
                              className="flex-1 py-2 px-3 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                            >
                              Make Bid
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(request)}
                              className="flex-1 py-2 px-3 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                              title="Permanently decline this request - it will never appear again"
                            >
                              Decline Permanently
                            </button>
                          </div>
                        </div>
                      ))
                    ) : isWaitingForRequests ? (
                      <div className="text-center py-8 text-blue-600">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                        <p className="font-medium">
                          Waiting for new requests...
                        </p>
                        <p className="text-xs mt-2 text-blue-500">
                          Patient cancelled the previous request
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p>No pending requests</p>
                        <p className="text-xs mt-2">
                          All requests have been accepted or declined
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

PatientRequestComponent.propTypes = {
  isAvailable: PropTypes.bool.isRequired,
  isCheckedOut: PropTypes.bool.isRequired,
  toggleAvailability: PropTypes.func.isRequired,
  totalIncomingRequests: PropTypes.number.isRequired,
  onStartBidding: PropTypes.func.isRequired,
};

export default PatientRequestComponent;
