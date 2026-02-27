// LocationService.js
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLocationUpdateState } from "../../store/slices/location-update-state-slice";
import store from "../../store";
import { setUser } from "../../store/slices/user-slice";

/**
 * Gets the current coordinates
 * @returns {Promise<{latitude: number, longitude: number}>} Coordinates
 */
const getCoordinates = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("📍 Browser geolocation success:", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          coords: position.coords,
        });
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn(`⚠️ Geolocation error: ${error.message}`);
        // No fallback coordinates - let the error propagate
        reject(new Error(`Geolocation failed: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 0, // Force fresh location - no cache
      }
    );
  });
};

/**
 * Prepares the location update message based on store state
 * @param {string} id - Driver ID
 * @param {Object} coords - Coordinates object with latitude and longitude
 * @returns {Object} Formatted message object
 */
const prepareLocationMessage = (id, coords) => {
  const isAdded = store.getState().locationUpdateState.isAdded;
  return {
    type: isAdded ? "update-location" : "add-location",
    data: {
      driver_id: id,
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Handles the location update callback
 * @param {Function} onLocationUpdate - Callback function to handle location updates
 * @param {string} id - Driver ID
 * @param {Object} coords - Coordinates object
 * @param {Function} dispatch - Redux dispatch function
 */
const handleLocationCallback = (onLocationUpdate, id, coords, dispatch) => {
  if (!onLocationUpdate || typeof onLocationUpdate !== "function") {
    return;
  }

  const message = prepareLocationMessage(id, coords);
  const isAdded = store.getState().locationUpdateState.isAdded;

  if (isAdded) {
    onLocationUpdate(message);
    return;
  }

  // Wait for the connection to be established first with retry logic
  const retryLocationUpdate = async (retryCount = 0, maxRetries = 3) => {
    try {
      // Check if user is a driver (location updates should only be sent for drivers)
      const user = store.getState().user;
      if (user.role !== "driver") {
        console.log(
          `ℹ️ User is ${user.role}, not a driver. Skipping WebSocket location update but keeping coordinates.`
        );
        // Don't return here - we still want to set coordinates for riders
        // Just skip the WebSocket part
      }

      // Check if onLocationUpdate function exists and is callable
      if (!onLocationUpdate || typeof onLocationUpdate !== "function") {
        console.log(
          "ℹ️ No location update callback provided, will send directly via WebSocket"
        );
      }

      // Check WebSocket connection status before sending
      const { default: WebSocketController } = await import(
        "../../controllers/websocket/ConnectionManger"
      );

      // Debug: Log connection state
      const connectionState = WebSocketController.getConnectionState();
      console.log(
        `🔍 WebSocket connection state: ${connectionState.state} (${connectionState.stateCode})`
      );

      // Wait a bit for WebSocket to be ready (reduced from 10 to 5 attempts)
      let connectionReady = false;
      for (let i = 0; i < 5; i++) {
        const isConnected = WebSocketController.isConnected();
        const connectionState = WebSocketController.getConnectionState();
        console.log(
          `🔍 Connection check ${i + 1}/5: connected=${isConnected}, state=${
            connectionState.state
          }`
        );

        if (isConnected) {
          connectionReady = true;
          console.log(`✅ WebSocket ready after ${i + 1} attempts`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Increased delay to 1 second
      }

      if (!connectionReady) {
        console.log("🔄 WebSocket not connected, attempting to reconnect...");

        // Try to reconnect if not connected
        if (!WebSocketController.isConnected()) {
          console.log("🔄 Attempting to reconnect WebSocket...");
          try {
            // Get user info from Redux store
            const user = store.getState().user;
            if (user.id && user.role && user.token) {
              // Import and use the proper ConnectToserver function
              const { ConnectToserver } = await import(
                "../../controllers/websocket/handler"
              );
              await ConnectToserver(user.id, user.role, user.token);
              console.log("✅ WebSocket reconnection attempted");
            } else {
              console.warn(
                "⚠️ Missing user credentials for WebSocket reconnection"
              );
            }
          } catch (reconnectError) {
            console.error("❌ Failed to reconnect WebSocket:", reconnectError);
          }
        }

        if (retryCount < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.min(2000 * Math.pow(2, retryCount), 8000);
          console.log(`🔄 Retrying in ${delay}ms...`);
          setTimeout(
            () => retryLocationUpdate(retryCount + 1, maxRetries),
            delay
          );
        } else {
          console.warn(
            "⚠️ WebSocket connection not available after all retries - storing location locally"
          );
          // Store location locally for later retry
          try {
            const pendingUpdates = JSON.parse(
              localStorage.getItem("pendingLocationUpdates") || "[]"
            );
            pendingUpdates.push({
              message,
              timestamp: Date.now(),
            });
            // Keep only last 10 updates to prevent storage overflow
            if (pendingUpdates.length > 10) {
              pendingUpdates.splice(0, pendingUpdates.length - 10);
            }
            localStorage.setItem(
              "pendingLocationUpdates",
              JSON.stringify(pendingUpdates)
            );
            console.log(
              `📍 Location stored locally (${pendingUpdates.length} pending updates)`
            );
          } catch (storageError) {
            console.error("❌ Failed to store location locally:", storageError);
          }
          return;
        }
        return;
      }

      // Try to send the message via WebSocket (only for drivers)
      let ok = false;
      let errorDetails = null;

      // Only send WebSocket updates for drivers
      if (user.role !== "driver") {
        console.log(
          `ℹ️ User is ${user.role}, not a driver. Skipping WebSocket location update.`
        );
        return;
      }

      try {
        if (onLocationUpdate && typeof onLocationUpdate === "function") {
          // Use the provided callback
          console.log("🔄 Using callback for location update...");
          ok = await onLocationUpdate(message);
          console.log("✅ Location update sent via callback, result:", ok);
        } else {
          // Send directly via WebSocket
          console.log("🚀 Attempting to send location update via WebSocket...");
          console.log("📤 Message to send:", JSON.stringify(message));

          // Check WebSocket state before sending
          const isConnected = WebSocketController.isConnected();
          console.log("🔍 WebSocket connected:", isConnected);

          if (!isConnected) {
            console.warn(
              "⚠️ WebSocket not connected, cannot send location update"
            );
            ok = false;
            errorDetails = "WebSocket not connected";
          } else {
            ok = await WebSocketController.sendMessage(message);
            console.log(
              "✅ Location update sent directly via WebSocket, result:",
              ok
            );
          }
        }
      } catch (error) {
        console.error("❌ Failed to send location update:", error);
        ok = false;
        errorDetails = error.message;
      }

      if (ok === true) {
        dispatch(setLocationUpdateState());
        console.log("✅ Location update sent successfully");
      } else if (retryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, retryCount), 4000);
        console.log(
          `🔄 Retrying location update (${
            retryCount + 1
          }/${maxRetries}) in ${delay}ms...`
        );
        if (errorDetails) {
          console.log(`🔍 Previous error: ${errorDetails}`);
        }
        setTimeout(
          () => retryLocationUpdate(retryCount + 1, maxRetries),
          delay
        );
      } else {
        console.warn(
          "⚠️ Failed to send location update after all retries - skipping this update"
        );
        if (errorDetails) {
          console.warn(`🔍 Final error: ${errorDetails}`);
        }
        // Don't fail completely, just skip this location update
      }
    } catch (error) {
      console.error("❌ Location update error:", error);
      if (retryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, retryCount), 4000);
        console.log(
          `🔄 Retrying location update (${
            retryCount + 1
          }/${maxRetries}) in ${delay}ms...`
        );
        console.log(`🔍 Error details: ${error.message}`);
        setTimeout(
          () => retryLocationUpdate(retryCount + 1, maxRetries),
          delay
        );
      } else {
        console.warn(
          "⚠️ Failed to send location update after all retries - skipping this update"
        );
        console.warn(`🔍 Final error details: ${error.message}`);
        // Don't fail completely, just skip this location update
      }
    }
  };

  // Start the retry process after a delay to allow WebSocket to initialize
  setTimeout(() => retryLocationUpdate(), 2000);
};

/**
 * React hook for location tracking with flexible configuration
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.trackPeriodically - Whether to track periodically (for drivers) or just once (for riders)
 * @param {boolean} options.isActive - Whether tracking should be active (useful for toggling driver availability)
 * @param {number} options.interval - Interval in milliseconds for periodic tracking (default: 30000ms = 30s)
 * @param {function} options.onLocationUpdate - Callback function to handle new coordinates (e.g., send to DB)
 * @returns {Object} Location data and control functions
 */
const useLocation = ({
  trackPeriodically = false,
  isActive = true,
  interval = 30000,
  id,
  onLocationUpdate = null,
} = {}) => {
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Get current location and handle the result
  const updateLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const coords = await getCoordinates();
      console.log(`📍 Location updated for user ${id}:`, coords);
      setCoordinates(coords);
      dispatch(
        setUser({ latitude: coords.latitude, longitude: coords.longitude })
      );
      setLoading(false);

      // Handle location update callback if provided
      handleLocationCallback(onLocationUpdate, id, coords, dispatch);

      return coords;
    } catch (err) {
      console.error(`❌ Location error for user ${id}:`, err.message);
      setError(err.message);
      setLoading(false);

      // No fallback coordinates - let the error propagate
      return null;
    }
  };

  // Setup and teardown effect for tracking
  useEffect(() => {
    console.log(`🔄 Setting up location tracking for user ${id}:`, {
      isActive,
      trackPeriodically,
      interval,
    });

    // For one-time fetching (rider) or immediate fetching when driver becomes available
    if (isActive) {
      updateLocation();
    }

    // Only set up interval for periodic tracking (driver mode) when active
    let intervalId = null;
    if (trackPeriodically && isActive) {
      console.log(
        `⏰ Setting up periodic tracking every ${interval}ms for user ${id}`
      );
      intervalId = setInterval(updateLocation, interval);
    }

    // Clean up the interval when component unmounts or tracking becomes inactive
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, trackPeriodically, interval]);

  // Function to retry pending location updates
  const retryPendingLocationUpdates = async () => {
    try {
      const pendingUpdate = localStorage.getItem("pendingLocationUpdate");
      if (pendingUpdate) {
        const { message, timestamp } = JSON.parse(pendingUpdate);
        console.log(
          "🔄 Retrying pending location update from:",
          new Date(timestamp)
        );

        // Check if WebSocket is now available
        const { default: WebSocketController } = await import(
          "../../controllers/websocket/ConnectionManger"
        );
        if (
          WebSocketController.isConnected() &&
          WebSocketController.isReadyToSend()
        ) {
          const success = await WebSocketController.sendMessage(message);
          if (success) {
            localStorage.removeItem("pendingLocationUpdate");
            console.log("✅ Pending location update sent successfully");
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to retry pending location update:", error);
    }
  };

  return {
    coordinates,
    error,
    loading,
    updateLocation, // Exposed so it can be manually triggered if needed
    retryPendingLocationUpdates,
    // Display current location coordinates
    currentLocationDisplay: coordinates
      ? `Current Location: ${coordinates.latitude.toFixed(
          6
        )}, ${coordinates.longitude.toFixed(6)}`
      : "Location not available",
  };
};

export { getCoordinates, useLocation };
