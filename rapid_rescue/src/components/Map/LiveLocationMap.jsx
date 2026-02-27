import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "../Geolocation/Geolocation";
import { SendMessage } from "../../controllers/websocket/handler";

const LiveLocationMap = ({
  zoom = 13,
  height = "690px",
  markerColor = "#4CAF50",
  markerBorderColor = "#2E7D32",
  title = "Your Location",
  trackPeriodically = true,
  updateInterval = 5000, // 5 seconds
  showAccuracy = true,
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const driverMarkersRef = useRef({});
  const hospitalMarkerRef = useRef(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [mapId] = useState(
    `live-location-map-${Math.random().toString(36).substr(2, 9)}`
  );
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  const user = useSelector((state) => state.user);
  const nearbyDrivers = useSelector((state) => state.nearbyDrivers.drivers);
  const selectedHospital = useSelector((state) => state.selectedHospital);
  const dispatch = useDispatch();

  // Custom marker icon
  const createCustomIcon = (color, borderColor, isDriver = false) => {
    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          width: ${isDriver ? "24px" : "20px"};
          height: ${isDriver ? "24px" : "20px"};
          background-color: ${color};
          border: 3px solid ${borderColor};
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          position: relative;
          ${isDriver ? "animation: pulse 2s infinite;" : ""}
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${isDriver ? "10px" : "8px"};
            height: ${isDriver ? "10px" : "8px"};
            background-color: white;
            border-radius: 50%;
          "></div>
          ${
            isDriver
              ? '<div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: bold; color: #333; background: white; padding: 2px 4px; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">A</div>'
              : ""
          }
        </div>
      `,
      iconSize: isDriver ? [24, 24] : [20, 20],
      iconAnchor: isDriver ? [12, 12] : [10, 10],
    });
  };

  // Hospital marker icon (red balloon)
  const createHospitalIcon = () => {
    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          width: 30px;
          height: 30px;
          background-color: #DC2626;
          border: 3px solid #B91C1C;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
          position: relative;
          animation: hospitalPulse 2s infinite;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: bold;
            color: #DC2626;
          ">🏥</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current && !isMapInitialized) {
      // Small delay to ensure DOM is ready
      const initMap = () => {
        // Double-check that map doesn't exist
        if (mapRef.current || isMapInitialized) {
          console.log("Map already exists, skipping initialization");
          return;
        }
        // Default to a central location if no user location
        const defaultLat = user.latitude;
        const defaultLng = user.longitude;

        console.log("🗺️ Map initialization debug:");
        console.log("  - User object:", user);
        console.log("  - User latitude:", user.latitude);
        console.log("  - User longitude:", user.longitude);
        console.log("  - Using coordinates:", defaultLat, defaultLng);
        console.log("  - Map ID:", mapId);

        // Check if map container exists
        const mapContainer = document.getElementById(mapId);
        if (!mapContainer) {
          console.error("Map container not found! ID:", mapId);
          return;
        }

        // Check if container already has a map
        if (mapContainer._leaflet_id) {
          console.log("Map container already initialized, cleaning up first");
          // Try to find and remove existing map instance
          try {
            const existingMap = L.Map.get(mapContainer._leaflet_id);
            if (existingMap) {
              existingMap.remove();
            }
          } catch (error) {
            console.warn("Error removing existing map:", error.message);
          }
          // Clear the container
          mapContainer.innerHTML = "";
          mapContainer._leaflet_id = null;
        }

        try {
          mapRef.current = L.map(mapId).setView([defaultLat, defaultLng], zoom);

          // Add tile layer
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(mapRef.current);
        } catch (error) {
          console.error("Error initializing map:", error);
          return;
        }

        // Mark map as initialized and add a small delay to ensure map is fully ready
        setTimeout(() => {
          setIsMapInitialized(true);
          console.log("Map initialization completed and ready for operations");
        }, 100);

        // Add custom CSS for tooltips and markers
        const style = document.createElement("style");
        style.innerHTML = `
        .map-tooltip {
          background: rgba(255,255,255,0.95);
          border: 2px solid #333;
          border-radius: 8px;
          padding: 8px 12px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 12px;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        @keyframes hospitalPulse {
          0% { transform: rotate(-45deg) scale(1); }
          50% { transform: rotate(-45deg) scale(1.1); }
          100% { transform: rotate(-45deg) scale(1); }
        }
        .accuracy-circle {
          fill: rgba(76, 175, 80, 0.1);
          stroke: rgba(76, 175, 80, 0.3);
          stroke-width: 2;
        }
        .location-info {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255,255,255,0.9);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        .tracking-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #4CAF50;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `;
        document.head.appendChild(style);
      };

      // Add small delay to ensure DOM is ready
      setTimeout(initMap, 100);
    }
  }, []);

  // Location tracking hook - only send location updates for drivers, not riders
  const { coordinates, error, loading, updateLocation } = useLocation({
    trackPeriodically,
    isActive: true,
    interval: updateInterval,
    id: user.id,
    onLocationUpdate:
      user.role === "driver"
        ? async (message) => {
            // Only send location updates for drivers
            try {
              console.log("🚀 Sending driver location update:", message);
              const success = await SendMessage(message);
              console.log("📤 SendMessage result:", success);
              if (success) {
                console.log("✅ Driver location update sent successfully");
                return true;
              } else {
                console.warn("⚠️ SendMessage returned false");
                return false;
              }
            } catch (err) {
              console.error("❌ Failed to send driver location update:", err);
              return false;
            }
          }
        : null, // No location updates for riders
  });

  // Function to update driver markers
  const updateDriverMarkers = () => {
    // Add comprehensive safety checks
    if (!mapRef.current || !isMapInitialized) {
      console.log("Map not ready for driver marker updates");
      return;
    }

    // Check if map is still valid
    try {
      // More robust validation - check if map instance exists and has proper structure
      if (
        !mapRef.current ||
        !mapRef.current._container ||
        !mapRef.current.getContainer
      ) {
        console.log("Map instance not valid, skipping marker updates");
        return;
      }

      // Check if the map container is still in the DOM
      const container = mapRef.current.getContainer();
      if (!container || !document.body.contains(container)) {
        console.log("Map container not in DOM, skipping marker updates");
        return;
      }
    } catch (error) {
      console.log(
        "Map validation failed, skipping marker updates:",
        error.message
      );
      return;
    }

    // Create a snapshot of the drivers object to prevent concurrent modification issues
    const drivers = { ...nearbyDrivers.drivers };
    console.log("Updating driver markers with drivers:", drivers);
    const currentDriverIds = Object.keys(driverMarkersRef.current);
    const newDriverIds = Object.keys(drivers);
    console.log("Current driver IDs:", currentDriverIds);
    console.log("New driver IDs:", newDriverIds);

    // Remove markers for drivers that are no longer nearby
    currentDriverIds.forEach((driverId) => {
      if (!newDriverIds.includes(driverId)) {
        if (driverMarkersRef.current[driverId]) {
          try {
            // Check if marker is still valid before removing
            if (
              driverMarkersRef.current[driverId]._map &&
              driverMarkersRef.current[driverId]._map._container
            ) {
              driverMarkersRef.current[driverId].remove();
            }
            delete driverMarkersRef.current[driverId];
          } catch (error) {
            console.warn("Error removing driver marker:", error.message);
            delete driverMarkersRef.current[driverId];
          }
        }
      }
    });

    // Add or update markers for current drivers
    newDriverIds.forEach((driverId) => {
      const driver = drivers[driverId];
      if (!driver) return;

      const { latitude, longitude, name, status } = driver;

      if (driverMarkersRef.current[driverId]) {
        // Update existing marker position
        try {
          if (
            driverMarkersRef.current[driverId]._map &&
            driverMarkersRef.current[driverId]._map._container
          ) {
            driverMarkersRef.current[driverId].setLatLng([latitude, longitude]);
            driverMarkersRef.current[driverId].setTooltipContent(
              `<div class="map-tooltip">
                <div><strong>${name}</strong></div>
                <div>Status: ${status}</div>
                <div>Lat: ${latitude.toFixed(6)}</div>
                <div>Lng: ${longitude.toFixed(6)}</div>
                <div>Updated: ${new Date(
                  driver.timestamp
                ).toLocaleTimeString()}</div>
              </div>`
            );
          }
        } catch (error) {
          console.warn("Error updating driver marker:", error.message);
          // Remove invalid marker and recreate
          delete driverMarkersRef.current[driverId];
        }
      }

      // Create new marker if it doesn't exist or was removed due to error
      if (!driverMarkersRef.current[driverId]) {
        try {
          const driverIcon = createCustomIcon("#FF6B35", "#E55A2B", true);
          driverMarkersRef.current[driverId] = L.marker([latitude, longitude], {
            icon: driverIcon,
          })
            .addTo(mapRef.current)
            .bindTooltip(
              `<div class="map-tooltip">
                <div><strong>${name}</strong></div>
                <div>Status: ${status}</div>
                <div>Lat: ${latitude.toFixed(6)}</div>
                <div>Lng: ${longitude.toFixed(6)}</div>
                <div>Updated: ${new Date(
                  driver.timestamp
                ).toLocaleTimeString()}</div>
              </div>`,
              {
                permanent: false,
                direction: "top",
                className: "map-tooltip",
              }
            );
        } catch (error) {
          console.warn("Error creating driver marker:", error.message);
        }
      }
    });
  };

  // Function to update hospital marker
  const updateHospitalMarker = () => {
    console.log("🏥 updateHospitalMarker called");
    console.log("🏥 Map ready:", !!(mapRef.current && isMapInitialized));
    console.log("🏥 Selected hospital state:", selectedHospital);

    if (!mapRef.current || !isMapInitialized) {
      console.log("❌ Map not ready for hospital marker updates");
      return;
    }

    // Remove existing hospital marker
    if (hospitalMarkerRef.current) {
      console.log("🗑️ Removing existing hospital marker");
      try {
        if (
          hospitalMarkerRef.current._map &&
          hospitalMarkerRef.current._map._container
        ) {
          hospitalMarkerRef.current.remove();
        }
      } catch (error) {
        console.warn("Error removing hospital marker:", error.message);
      }
      hospitalMarkerRef.current = null;
    }

    // Add new hospital marker if hospital is selected
    if (selectedHospital.hospital && selectedHospital.isSelected) {
      console.log("🏥 Adding hospital marker:", selectedHospital.hospital);
      const { latitude, longitude, name, fullAddress } =
        selectedHospital.hospital;

      // Validate coordinates
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        console.error("❌ Invalid hospital coordinates:", {
          latitude,
          longitude,
        });
        return;
      }

      try {
        const hospitalIcon = createHospitalIcon();
        console.log("🏥 Created hospital icon:", hospitalIcon);

        hospitalMarkerRef.current = L.marker([latitude, longitude], {
          icon: hospitalIcon,
        })
          .addTo(mapRef.current)
          .bindTooltip(
            `<div class="map-tooltip">
              <div><strong>🏥 ${name}</strong></div>
              <div>${fullAddress}</div>
              <div>Lat: ${latitude.toFixed(6)}</div>
              <div>Lng: ${longitude.toFixed(6)}</div>
            </div>`,
            {
              permanent: false,
              direction: "top",
              className: "map-tooltip",
            }
          );

        console.log("✅ Hospital marker added successfully:", {
          name,
          latitude,
          longitude,
          marker: hospitalMarkerRef.current,
        });
      } catch (error) {
        console.error("❌ Error creating hospital marker:", error);
      }
    } else {
      console.log("ℹ️ No hospital selected or hospital data missing");
    }
  };

  // Update map when coordinates change
  useEffect(() => {
    console.log("🔄 LiveLocationMap coordinates effect triggered:", {
      hasCoordinates: !!coordinates,
      coordinates,
      mapReady: !!(
        mapRef.current &&
        isMapInitialized &&
        mapRef.current._loaded
      ),
      userRole: user.role,
      userId: user.id,
      userLatitude: user.latitude,
      userLongitude: user.longitude,
    });

    // Use coordinates from useLocation hook, or fallback to user state coordinates
    const effectiveCoordinates =
      coordinates ||
      (user.latitude && user.longitude
        ? {
            latitude: user.latitude,
            longitude: user.longitude,
          }
        : null);

    if (
      effectiveCoordinates &&
      mapRef.current &&
      isMapInitialized &&
      mapRef.current._loaded
    ) {
      // Check if map is still valid
      try {
        // More robust validation - check if map instance exists and has proper structure
        if (
          !mapRef.current ||
          !mapRef.current._container ||
          !mapRef.current.getContainer
        ) {
          console.log("Map instance not valid, skipping coordinate update");
          return;
        }

        // Check if the map container is still in the DOM
        const container = mapRef.current.getContainer();
        if (!container || !document.body.contains(container)) {
          console.log("Map container not in DOM, skipping coordinate update");
          return;
        }
      } catch (error) {
        console.log(
          "Map validation failed, skipping coordinate update:",
          error.message
        );
        return;
      }

      const {
        latitude,
        longitude,
        accuracy: coordAccuracy,
      } = effectiveCoordinates;

      // Update accuracy
      if (coordAccuracy !== undefined) {
        setAccuracy(coordAccuracy);
      }

      // Remove existing marker safely
      if (markerRef.current) {
        try {
          if (markerRef.current._map && markerRef.current._map._container) {
            markerRef.current.remove();
          }
        } catch (error) {
          console.warn("Error removing user marker:", error.message);
        }
      }

      // Remove existing accuracy circle safely
      if (accuracyCircleRef.current) {
        try {
          if (
            accuracyCircleRef.current._map &&
            accuracyCircleRef.current._map._container
          ) {
            accuracyCircleRef.current.remove();
          }
        } catch (error) {
          console.warn("Error removing accuracy circle:", error.message);
        }
      }

      // Create new marker
      try {
        markerRef.current = L.marker([latitude, longitude], {
          icon: createCustomIcon(markerColor, markerBorderColor),
        })
          .addTo(mapRef.current)
          .bindTooltip(
            `<div class="map-tooltip">
              <div><strong>${title}</strong></div>
              <div>Lat: ${latitude.toFixed(6)}</div>
              <div>Lng: ${longitude.toFixed(6)}</div>
              ${
                coordAccuracy
                  ? `<div>Accuracy: ±${Math.round(coordAccuracy)}m</div>`
                  : ""
              }
              <div>Updated: ${new Date().toLocaleTimeString()}</div>
            </div>`,
            {
              permanent: false,
              direction: "top",
              className: "map-tooltip",
            }
          );
      } catch (error) {
        console.warn("Error creating user marker:", error.message);
        markerRef.current = null;
      }

      // Add accuracy circle if accuracy is available and showAccuracy is true
      if (showAccuracy && coordAccuracy && coordAccuracy > 0) {
        try {
          accuracyCircleRef.current = L.circle([latitude, longitude], {
            radius: coordAccuracy,
            className: "accuracy-circle",
          }).addTo(mapRef.current);
        } catch (error) {
          console.warn("Error creating accuracy circle:", error.message);
          accuracyCircleRef.current = null;
        }
      }

      // Update map view to follow the marker
      try {
        mapRef.current.setView([latitude, longitude], zoom);
      } catch (error) {
        console.warn("Error updating map view:", error.message);
      }

      // Update last update time
      setLastUpdate(new Date());
      setIsTracking(true);
    }
  }, [coordinates, markerColor, markerBorderColor, title, zoom, showAccuracy]);

  // Update driver markers when nearby drivers change
  useEffect(() => {
    console.log("Nearby drivers changed:", nearbyDrivers.drivers);
    if (mapRef.current && nearbyDrivers.drivers) {
      updateDriverMarkers();
    }
  }, [nearbyDrivers.drivers]);

  // Update hospital marker when selected hospital changes
  useEffect(() => {
    console.log("🏥 Hospital useEffect triggered");
    console.log("🏥 Selected hospital changed:", selectedHospital);
    console.log("🏥 Map ready:", !!(mapRef.current && isMapInitialized));
    console.log("🏥 Hospital data:", selectedHospital.hospital);
    console.log("🏥 Is selected:", selectedHospital.isSelected);

    if (mapRef.current && isMapInitialized) {
      console.log("🏥 Calling updateHospitalMarker");
      updateHospitalMarker();
    } else {
      console.log("❌ Map not ready, skipping hospital marker update");
    }
  }, [selectedHospital, isMapInitialized]);

  // Manual location update function
  const handleManualUpdate = async () => {
    await updateLocation();
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      try {
        // Clean up markers first
        if (markerRef.current) {
          try {
            if (markerRef.current._map && markerRef.current._map._container) {
              markerRef.current.remove();
            }
          } catch (error) {
            console.warn(
              "Error removing user marker during cleanup:",
              error.message
            );
          }
          markerRef.current = null;
        }

        if (accuracyCircleRef.current) {
          try {
            if (
              accuracyCircleRef.current._map &&
              accuracyCircleRef.current._map._container
            ) {
              accuracyCircleRef.current.remove();
            }
          } catch (error) {
            console.warn(
              "Error removing accuracy circle during cleanup:",
              error.message
            );
          }
          accuracyCircleRef.current = null;
        }

        // Clean up driver markers
        Object.values(driverMarkersRef.current).forEach((marker) => {
          if (marker) {
            try {
              if (marker._map && marker._map._container) {
                marker.remove();
              }
            } catch (error) {
              console.warn(
                "Error removing driver marker during cleanup:",
                error.message
              );
            }
          }
        });
        driverMarkersRef.current = {};

        // Clean up hospital marker
        if (hospitalMarkerRef.current) {
          try {
            if (
              hospitalMarkerRef.current._map &&
              hospitalMarkerRef.current._map._container
            ) {
              hospitalMarkerRef.current.remove();
            }
          } catch (error) {
            console.warn(
              "Error removing hospital marker during cleanup:",
              error.message
            );
          }
          hospitalMarkerRef.current = null;
        }

        // Clean up map
        if (mapRef.current) {
          try {
            // Check if map is still valid before removing
            if (
              mapRef.current._container &&
              mapRef.current._container._leaflet_id
            ) {
              mapRef.current.remove();
            }
          } catch (error) {
            console.warn("Error removing map during cleanup:", error.message);
          }
          mapRef.current = null;
        }

        // Also clean up the container
        const mapContainer = document.getElementById(mapId);
        if (mapContainer) {
          // Only clear the container if we're actually cleaning up
          mapContainer.innerHTML = "";
          // Don't clear _leaflet_id here as it might interfere with reinitialization
        }

        // Reset initialization flag
        setIsMapInitialized(false);
      } catch (error) {
        console.warn("Error during map cleanup:", error.message);
      }
    };
  }, [mapId]);

  return (
    <div style={{ position: "relative" }}>
      {/* Location Info Panel */}
      <div className="location-info">
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}
        >
          <span className="tracking-indicator"></span>
          <span style={{ fontWeight: "bold" }}>
            {isTracking ? "Live Tracking" : "Location Off"}
          </span>
        </div>
        {coordinates && (
          <>
            <div>Lat: {coordinates.latitude.toFixed(6)}</div>
            <div>Lng: {coordinates.longitude.toFixed(6)}</div>
            {accuracy && <div>Accuracy: ±{Math.round(accuracy)}m</div>}
            {nearbyDrivers.drivers &&
              Object.keys(nearbyDrivers.drivers).length > 0 && (
                <div style={{ color: "#FF6B35", fontWeight: "bold" }}>
                  🚑 {Object.keys(nearbyDrivers.drivers).length} driver(s)
                  nearby
                </div>
              )}
            {lastUpdate && (
              <div style={{ fontSize: "10px", color: "#666" }}>
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
        {error && (
          <div style={{ color: "#f44336", fontSize: "10px" }}>
            Error: {error}
          </div>
        )}
        {loading && (
          <div style={{ color: "#2196F3", fontSize: "10px" }}>
            Getting location...
          </div>
        )}
        <button
          onClick={handleManualUpdate}
          style={{
            marginTop: "4px",
            padding: "2px 6px",
            fontSize: "10px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          Update Now
        </button>
      </div>

      {/* Map Container */}
      <div
        id={mapId}
        style={{
          height: height,
          width: "100%",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
};

LiveLocationMap.propTypes = {
  zoom: PropTypes.number,
  height: PropTypes.string,
  markerColor: PropTypes.string,
  markerBorderColor: PropTypes.string,
  title: PropTypes.string,
  trackPeriodically: PropTypes.bool,
  updateInterval: PropTypes.number,
  showAccuracy: PropTypes.bool,
};

export default LiveLocationMap;
