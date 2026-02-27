import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Navigation,
  Phone,
  Star,
  User,
  Car,
  AlertCircle,
} from "lucide-react";
import { setOngoingTripDetails } from "../../store/slices/ongoing-trip-details-slice";
import { clearTripReq } from "../../store/slices/trip-request-slice";
import { changeCheckoutStatus } from "../../store/slices/checkout-status-slice";
import { addDriverResponse } from "../../store/slices/driver-response-slice";
import { removeTripReq } from "../../store/slices/trip-request-slice";
import WebSocketController from "../../controllers/websocket/ConnectionManger";

const TripCheckout = ({
  isDriverView = false,
  currentRequest = null,
  onCancel = null,
}) => {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [finalFare, setFinalFare] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [riderCounterOffer, setRiderCounterOffer] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const driverResponses = useSelector((state) => state.driverResponse);
  const tripRequests = useSelector((state) => state.tripRequests);
  const user = useSelector((state) => state.user);

  // Keep loading state active - will be handled by external responses
  // The loading will continue until rider responds via notification system

  // Listen for rider counter offer acceptance to stop loading
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
      console.log(
        "🎯 TripCheckout - Rider counter offer accepted, stopping loading:",
        {
          riderAmount,
          riderId,
          reqId,
          pickupLocation,
          destination,
        }
      );

      // Stop the loading indicator
      setIsProcessing(false);

      // Store the rider's counter offer amount
      setRiderCounterOffer({
        amount: riderAmount,
        riderId: riderId,
        reqId: reqId,
        pickupLocation: pickupLocation,
        destination: destination,
      });

      console.log(
        "✅ TripCheckout - Loading indicator stopped and rider counter offer stored:",
        riderAmount
      );
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

  // Listen for rider cancellation to reset driver state
  useEffect(() => {
    const handleRiderCancelledBid = (event) => {
      const { notificationId, riderId, driverId } = event.detail;
      console.log("🚫 TripCheckout received riderCancelledBid event:", {
        notificationId,
        riderId,
        driverId,
      });
      console.log("🚫 TripCheckout current driver ID:", user.id);
      console.log(
        "🚫 TripCheckout driver ID match:",
        driverId && driverId.toString() === user.id?.toString()
      );

      // The cancellation notification component will handle showing the notification
      // This handler is kept for logging purposes but doesn't directly reset the driver
      console.log(
        "ℹ️ TripCheckout - Rider cancellation event received - cancellation notification will be shown"
      );
    };

    // Listen for rider cancellation events
    window.addEventListener("riderCancelledBid", handleRiderCancelledBid);

    return () => {
      window.removeEventListener("riderCancelledBid", handleRiderCancelledBid);
    };
  }, [user.id, onCancel, dispatch]);

  // Listen for rider accepting driver bid to navigate to ongoing trip
  useEffect(() => {
    const handleBidAccepted = (event) => {
      const { tripDetails } = event.detail;
      console.log(
        "🎯 TripCheckout - Driver bid accepted by rider, navigating to ongoing trip:",
        tripDetails
      );

      // Update local state for driver
      dispatch(setOngoingTripDetails(tripDetails));
      dispatch(clearTripReq());
      dispatch(changeCheckoutStatus());

      // Navigate to ongoing trip
      window.location.href = "/ongoing_trip";
    };

    // Listen for WebSocket message when rider accepts driver bid
    window.addEventListener("bidAccepted", handleBidAccepted);

    return () => {
      window.removeEventListener("bidAccepted", handleBidAccepted);
    };
  }, [dispatch]);

  // Get the latest trip request for display
  const latestRequest = isDriverView
    ? currentRequest
    : tripRequests && tripRequests.length > 0
    ? tripRequests[0]
    : null;
  const pickup_location = latestRequest
    ? latestRequest.pickup_location
    : "Dhanmondi, Dhaka";
  const destination = latestRequest
    ? latestRequest.destination
    : "Dhaka Medical College Hospital";

  // Initialize fare for driver view
  React.useEffect(() => {
    if (isDriverView && currentRequest) {
      setFinalFare(currentRequest.fare + 50); // Driver's initial bid
    }
  }, [isDriverView, currentRequest]);

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
    setFinalFare(driver.amount);
  };

  const handleDriverAcceptBid = async () => {
    if (!currentRequest) return;

    console.log("🚑 Current request data:", currentRequest);
    console.log("🚑 User data:", user);
    console.log("🚑 Current request rider_id:", currentRequest.rider_id);
    console.log("🚑 Current user id:", user.id);
    console.log("🚑 Rider ID match:", currentRequest.rider_id === user.id);

    setIsProcessing(true);

    try {
      // Create driver response
      const driverResponse = {
        req_id: currentRequest.req_id,
        rider_id: currentRequest.rider_id,
        driver_id: user.id,
        driver_name: user.name,
        driver_mobile: user.mobile,
        amount: finalFare,
        rating: 4.8,
        vehicle: "Emergency Medical Transport",
        eta: "8 min",
        specialty: "Emergency Response",
        status: "accepted",
        timestamp: new Date().toISOString(),
      };

      // Add to driver responses
      dispatch(addDriverResponse(driverResponse));

      // Remove from trip requests
      dispatch(removeTripReq(currentRequest.req_id));

      // Send via WebSocket to notify rider (using new notification system)
      if (WebSocketController.isConnected()) {
        const bidData = {
          rider_id: currentRequest.rider_id,
          driver_id: user.id,
          req_id: currentRequest.req_id,
          amount: finalFare,
          driver_name: user.name,
          driver_mobile: user.mobile,
          pickup_location: pickup_location,
          destination: destination,
          rating: 4.8,
          vehicle: "Emergency Medical Transport",
          eta: "8 min",
          specialty: "Emergency Response",
        };

        const message = {
          type: "driver-bid-offer",
          data: bidData,
        };

        console.log(
          "🚑 Sending bid offer to rider via notification system:",
          message
        );
        console.log("🚑 Rider ID:", bidData.rider_id);
        console.log("🚑 Driver ID:", bidData.driver_id);
        console.log("🚑 Bid Amount: ৳", bidData.amount);

        const success = await WebSocketController.sendMessage(message);
        console.log("🚑 Bid offer sent successfully:", success);

        if (success) {
          console.log(
            "✅ Bid will be saved to notification database and sent to rider"
          );
        } else {
          console.error("❌ Failed to send bid offer");
        }
      } else {
        console.error("❌ WebSocket not connected, cannot send bid to rider");
      }

      // Keep loading state - don't return to dashboard automatically
      // The loading will continue until rider accepts/rejects the bid
      console.log("✅ Bid sent successfully! Waiting for rider response...");
      console.log(
        "ℹ️ Loading state will continue until rider accepts or rejects the bid"
      );
    } catch (error) {
      console.error("Error accepting bid:", error);
      setIsProcessing(false);
    }
  };

  const handleConfirmTrip = async () => {
    if (!selectedDriver) return;

    setIsProcessing(true);

    try {
      // Create ongoing trip details
      const tripDetails = {
        trip_id: Date.now(),
        rider_id: user.id,
        driver_id: selectedDriver.driver_id,
        driver_name: selectedDriver.driver_name,
        driver_mobile: selectedDriver.driver_mobile,
        pickup_location: pickup_location,
        destination: destination,
        fare: Number(finalFare) || 0,
        status: "confirmed",
        timestamp: new Date().toISOString(),
      };

      // Set ongoing trip details
      dispatch(setOngoingTripDetails(tripDetails));

      // Clear trip requests
      dispatch(clearTripReq());

      // Change checkout status
      dispatch(changeCheckoutStatus());

      // Simulate processing time
      setTimeout(() => {
        setIsProcessing(false);
        // Navigate to ongoing trip
        navigate("/ongoing_trip");
      }, 2000);
    } catch (error) {
      console.error("Error confirming trip:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              {isDriverView ? "Make Your Bid" : "Trip Checkout"}
            </h1>
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">
                {isDriverView ? "Bid Ready" : "Driver Selected"}
              </span>
            </div>
          </div>

          {/* Route Information */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start mb-4">
              <div className="bg-green-100 p-2 rounded-full text-green-600 mr-3">
                <FaMapMarkerAlt size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600 font-medium">
                  PICKUP LOCATION
                </p>
                <p className="text-md font-medium text-gray-800">
                  {pickup_location}
                </p>
              </div>
            </div>

            <div className="border-l-2 border-blue-200 h-4 ml-5 mb-4"></div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 mr-3">
                <FaMapMarkerAlt size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600 font-medium">DESTINATION</p>
                <p className="text-md font-medium text-gray-800">
                  {destination}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isDriverView ? (
          /* Driver View - Make Bid */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Make Your Bid
            </h2>

            {/* Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white bg-opacity-95 rounded-2xl flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Waiting for Rider Response
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Your bid has been sent to the rider. Please wait for their
                    response...
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      💡 The rider can accept, counter-offer, or decline your
                      bid
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Request Details */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Request Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Rider Budget:</strong> ৳
                    {riderCounterOffer
                      ? riderCounterOffer.amount
                      : currentRequest?.fare}
                    {riderCounterOffer && (
                      <span className="ml-2 text-green-600 font-medium">
                        (Counter Offer Accepted)
                      </span>
                    )}
                  </p>
                  <p>
                    <strong>From:</strong> {pickup_location}
                  </p>
                  <p>
                    <strong>To:</strong> {destination}
                  </p>
                </div>
              </div>

              {/* Your Bid */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3">Your Bid</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bid Amount (৳)
                    </label>
                    <input
                      type="number"
                      value={finalFare}
                      onChange={(e) =>
                        setFinalFare(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      min={currentRequest?.fare || 0}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setFinalFare((currentRequest?.fare || 0) + 25)
                      }
                      className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      +25
                    </button>
                    <button
                      onClick={() =>
                        setFinalFare((currentRequest?.fare || 0) + 50)
                      }
                      className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      +50
                    </button>
                    <button
                      onClick={() =>
                        setFinalFare((currentRequest?.fare || 0) + 100)
                      }
                      className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      +100
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleDriverAcceptBid}
                  disabled={isProcessing}
                  className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                    isProcessing
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Waiting for Response...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Send Bid to Rider
                    </div>
                  )}
                </button>

                <button
                  onClick={onCancel}
                  className="px-6 py-4 border-2 border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Rider View - Select Driver */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Select Your Driver
              </h2>

              {driverResponses && driverResponses.length > 0 ? (
                <div className="space-y-4">
                  {driverResponses.map((driver) => (
                    <div
                      key={driver.driver_id}
                      onClick={() => handleDriverSelect(driver)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedDriver &&
                        selectedDriver.driver_id === driver.driver_id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {driver.driver_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              ID: {driver.driver_id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-yellow-500 mb-1">
                            <Star className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">
                              {driver.rating}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{driver.eta}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Car className="w-4 h-4 mr-2" />
                          <span>{driver.vehicle}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{driver.driver_mobile}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Specialty:
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            {driver.specialty}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No drivers available</p>
                </div>
              )}
            </div>

            {/* Fare Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Fare Summary
              </h2>

              {selectedDriver ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Base Fare</span>
                      <span className="font-semibold">
                        ৳{selectedDriver.amount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Emergency Service</span>
                      <span className="font-semibold">৳50</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Distance</span>
                      <span className="font-semibold">~4.5 km</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-800">
                          Total
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          ৳{finalFare + 50}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center text-blue-700 mb-2">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="font-medium">Estimated Arrival</span>
                    </div>
                    <p className="text-blue-600 font-semibold">
                      {selectedDriver.eta}
                    </p>
                  </div>

                  <button
                    onClick={handleConfirmTrip}
                    disabled={!selectedDriver || isProcessing}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                      !selectedDriver || isProcessing
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Confirming Trip...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirm Trip
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Navigation className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a driver to see fare details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripCheckout;
