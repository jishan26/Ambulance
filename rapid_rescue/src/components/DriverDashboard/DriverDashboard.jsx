import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  ConnectToserver,
  DisconnectFromServer,
  SendMessage,
} from "../../controllers/websocket/handler";
import { setUser } from "../../store/slices/user-slice";
import {
  setDriverOnline,
  setDriverOffline,
  updateDriverAvailability,
} from "../../controllers/apiClient";
import StatusBar from "../DriverDashboard/StatusBar/StatusBar";
import MainContent from "../DriverDashboard/MainContent/MainContent";
import OngoingTrip from "../OngoingTrip/OngoingTrip";
import TripCheckout from "../TripCheckout/TripCheckout";
import CurrentLocationDisplay from "../CurrentLocationDisplay/CurrentLocationDisplay";
import AvailableDriversCount from "../AvailableDriversCount";
import WebSocketStatus from "../WebSocketStatus/WebSocketStatus";
import StatisticsBanner from "../StatisticsBanner/StatisticsBanner";

const DriverDashboard = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [currentBidRequest, setCurrentBidRequest] = useState(null);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const nearbyDrivers = useSelector((state) => state.nearbyDrivers);
  const tripRequests = useSelector((state) => state.tripRequests);
  const ongoingTrip = useSelector((state) => state.ongoingTripDetails);

  // Calculate total incoming requests
  const totalIncomingRequests = tripRequests ? tripRequests.length : 0;

  const toggleAvailability = async () => {
    const newAvailability = !isAvailable;
    setIsAvailable(newAvailability);

    // Update availability in database
    const result = await updateDriverAvailability(newAvailability);
    if (!result.success && !result.isNotImplemented) {
      // Revert the state if API call failed
      setIsAvailable(!newAvailability);
    }
  };

  // Manual location request function
  const requestLocation = () => {
    if (!navigator.geolocation) {
      // Set a default location for Dhaka, Bangladesh if geolocation is not supported
      dispatch(
        setUser({
          latitude: 23.794667,
          longitude: 90.435826,
        })
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Validate location coordinates (check if they're reasonable for Bangladesh)
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        // Bangladesh approximate bounds: 20.7-26.6 N, 88.0-92.7 E
        const isInBangladesh =
          lat >= 20.7 && lat <= 26.6 && lng >= 88.0 && lng <= 92.7;

        if (isInBangladesh) {
          dispatch(
            setUser({
              latitude: lat,
              longitude: lng,
            })
          );
        } else {
          // Ask user to confirm if this is correct
          const confirmLocation = window.confirm(
            `Your location shows: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n` +
              `Accuracy: ±${Math.round(accuracy)}m\n\n` +
              `This appears to be outside Bangladesh. Is this correct?\n\n` +
              `Click OK to use this location, or Cancel to use Dhaka coordinates.`
          );

          if (confirmLocation) {
            dispatch(
              setUser({
                latitude: lat,
                longitude: lng,
              })
            );
          } else {
            dispatch(
              setUser({
                latitude: 23.794667,
                longitude: 90.435826,
              })
            );
          }
        }
      },
      (error) => {
        // Set fallback location to Dhaka, Bangladesh if no previous location
        if (
          !user.latitude ||
          !user.longitude ||
          user.latitude === 0 ||
          user.longitude === 0
        ) {
          dispatch(
            setUser({
              latitude: 23.794667,
              longitude: 90.435826,
            })
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // Increased timeout to 30 seconds for better accuracy
        maximumAge: 0, // Force fresh location - no cache
      }
    );
  };

  // Handle driver starting to bid
  const handleStartBidding = (request) => {
    setCurrentBidRequest(request);
    setIsBidding(true);
  };

  // Handle driver canceling bid
  const handleCancelBidding = () => {
    setCurrentBidRequest(null);
    setIsBidding(false);
  };

  // Connect to WebSocket once on mount and set driver as online
  useEffect(() => {
    let isConnected = false;

    const initializeDriver = async () => {
      if (user.id && user.role === "driver" && user.token) {
        try {
          await ConnectToserver(user.id, user.role, user.token);
          isConnected = true;

          // Set driver as available in database
          setDriverOnline();

          // Automatically request driver's current location
          requestLocation();
        } catch (error) {
          isConnected = false;
        }
      }
    };

    initializeDriver();

    // Cleanup on unmount - set driver as offline
    return () => {
      if (user.id && user.role === "driver") {
        setDriverOffline();
      }
      DisconnectFromServer();
    };
  }, [user.id, user.role, user.token]);

  // Periodically send driver location to server (every 3 seconds)
  // Only start after WebSocket connection is established
  useEffect(() => {
    if (!user.id || !user.latitude || !user.longitude) return;

    // Wait a bit for WebSocket connection to be established
    const startLocationUpdates = () => {
      const interval = setInterval(async () => {
        // Check if WebSocket is connected before sending
        const { default: WebSocketController } = await import(
          "../../controllers/websocket/ConnectionManger"
        );

        if (!WebSocketController.isConnected()) {
          return;
        }

        await SendMessage({
          type: "driver-location",
          data: {
            id: user.id,
            latitude: user.latitude,
            longitude: user.longitude,
            available: isAvailable,
          },
        });
      }, 3000);

      return interval;
    };

    // Start location updates after a delay to allow WebSocket connection
    let intervalId = null;
    const timeoutId = setTimeout(() => {
      intervalId = startLocationUpdates();
    }, 2000); // Wait 2 seconds for WebSocket to connect

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user.id, user.latitude, user.longitude, isAvailable]);

  // Log driver counts when nearbyDrivers change
  useEffect(() => {
    const driverCount = Array.isArray(nearbyDrivers.drivers)
      ? nearbyDrivers.drivers.length
      : Object.keys(nearbyDrivers.drivers || {}).length;
  }, [nearbyDrivers.drivers]);

  // Listen for rider cancellation events to reset driver status to offline
  useEffect(() => {
    const handleRiderCancelledBid = (event) => {
      const { notificationId, riderId, driverId } = event.detail;
      // The cancellation notification component will handle showing the notification
    };

    const handleDriverBidCancelled = (event) => {
      const { notificationId } = event.detail;

      // Reset driver status to offline when bid is cancelled
      if (isAvailable) {
        setIsAvailable(false);
        // Update availability in database
        updateDriverAvailability(false);
      }
    };

    const handleDriverCancelledCancellation = (event) => {
      const { cancellationId, driverId } = event.detail;

      // Only handle if this is for the current driver
      if (driverId && driverId.toString() === user.id?.toString()) {
        // Reset driver status to offline
        if (isAvailable) {
          setIsAvailable(false);
          // Update availability in database
          updateDriverAvailability(false);
        }

        // Reset bidding state if driver is currently bidding
        if (isBidding) {
          setCurrentBidRequest(null);
          setIsBidding(false);
        }
      }
    };

    // Listen for rider cancellation events
    window.addEventListener("riderCancelledBid", handleRiderCancelledBid);
    window.addEventListener("driverBidCancelled", handleDriverBidCancelled);
    window.addEventListener(
      "driverCancelledCancellation",
      handleDriverCancelledCancellation
    );

    return () => {
      window.removeEventListener("riderCancelledBid", handleRiderCancelledBid);
      window.removeEventListener(
        "driverBidCancelled",
        handleDriverBidCancelled
      );
      window.removeEventListener(
        "driverCancelledCancellation",
        handleDriverCancelledCancellation
      );
    };
  }, [isAvailable, isBidding, user.id]);

  return (
    <div className="mt-20 min-h-screen bg-gray-100 flex flex-col">
      {/* Statistics Banner */}

      {/* Available Drivers Count */}
      <div className="px-4 py-2">
        <AvailableDriversCount />
      </div>

      {/* Location Status and Manual Refresh */}

      {/* Header - Availability Toggle */}
      <StatusBar
        isAvailable={isAvailable}
        setIsAvailable={setIsAvailable}
        toggleAvailability={toggleAvailability}
      />

      {/* Main Content */}
      {ongoingTrip && ongoingTrip.trip_id ? (
        <div className="md:mt-16 w-full z-0">
          <OngoingTrip />
        </div>
      ) : isBidding ? (
        <div className="md:mt-16 w-full z-0">
          <TripCheckout
            isDriverView={true}
            currentRequest={currentBidRequest}
            onCancel={handleCancelBidding}
          />
        </div>
      ) : (
        <MainContent
          isAvailable={isAvailable}
          totalIncomingRequests={totalIncomingRequests}
          isCheckedOut={isCheckedOut}
          toggleAvailability={toggleAvailability}
          onStartBidding={handleStartBidding}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
