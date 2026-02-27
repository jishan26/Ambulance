import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import WebSocketController from "../../controllers/websocket/ConnectionManger";
import { apiFetch } from "../../controllers/apiClient";
import { setUser } from "../../store/slices/user-slice";
import { setOngoingTripDetails } from "../../store/slices/ongoing-trip-details-slice";

// Fix Leaflet default icons
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerRetina from "leaflet/dist/images/marker-icon-2x.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Add custom CSS for markers
const customMarkerCSS = `
  .custom-div-icon {
    background: transparent !important;
    border: none !important;
  }
  .custom-div-icon div {
    pointer-events: none;
  }
`;

// Inject CSS
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = customMarkerCSS;
  document.head.appendChild(style);
}

const RouteMap = ({ zoom = 13, height = "1000px" }) => {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const hasFittedBoundsRef = useRef(false);
  const lastDriverUpdateAtRef = useRef(0);
  const lastDriverUpdateSourceRef = useRef("none");
  const [tripData, setTripData] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const ongoingTrip = useSelector((state) => state.ongoingTripDetails);
  const user = useSelector((state) => state.user);
  const selectedHospitalFromForm = useSelector(
    (state) => state.selectedHospital?.hospital
  );
  const dispatch = useDispatch();

  // Request location permission and get current location
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setUserLocation(coords);
      setLocationPermission("granted");

      console.log("✅ Location permission granted:", coords);

      // Update user location in Redux
      dispatch(
        setUser({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
      );

      return coords;
    } catch (error) {
      console.error("❌ Location permission denied:", error);
      setLocationPermission("denied");
      return null;
    }
  };

  // Create custom icons
  const createCustomIcon = (color, iconType, emoji = "") => {
    return L.divIcon({
      className: "custom-div-icon",
      html: `
         <div style="
           background-color: ${color};
           width: 40px;
           height: 40px;
           border-radius: 50%;
           border: 4px solid white;
           display: flex;
           align-items: center;
           justify-content: center;
           box-shadow: 0 4px 8px rgba(0,0,0,0.5);
           z-index: 1000;
           position: relative;
         ">
           <div style="
             color: white;
             font-weight: bold;
             font-size: 16px;
             text-align: center;
             line-height: 1;
           ">
             ${emoji}<br/>
             <span style="font-size: 12px;">${iconType}</span>
           </div>
         </div>
       `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  };

  // Create a drop-pin (teardrop) icon, used for the selected destination hospital
  const createDropPinIcon = (color = "#DC2626", emoji = "🏥") => {
    const svg = `
      <svg width="40" height="56" viewBox="0 0 36 56" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
          </filter>
        </defs>
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${color}" filter="url(#shadow)"/>
        <circle cx="18" cy="18" r="8" fill="white"/>
      </svg>
    `;
    return L.divIcon({
      className: "custom-div-icon",
      html: `
        <div style="position: relative; width: 40px; height: 56px; display:flex; align-items:center; justify-content:center;">
          ${svg}
          <div style="position:absolute; top:10px; left:0; right:0; text-align:center; font-size:16px;">
            ${emoji}
          </div>
        </div>
      `,
      iconSize: [40, 56],
      iconAnchor: [20, 46],
      popupAnchor: [0, -46],
    });
  };

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return; // prevent reinitialization

    // Default coordinates (Dhaka, Bangladesh)
    const defaultCoords = [23.8103, 90.4125];

    mapRef.current = L.map("route-map").setView(defaultCoords, zoom);

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [zoom]);

  // Request location permission on component mount
  useEffect(() => {
    requestLocationPermission();

    // If a confirmation happened just before navigation, preload the same rider/driver
    try {
      const raw = localStorage.getItem("pendingConfirmedTrip");
      if (raw) {
        const td = JSON.parse(raw);
        if (td?.rider_id && td?.driver_id) {
          (async () => {
            try {
              const res = await fetch(
                `http://localhost:8000/dirde/${td.rider_id}/${td.driver_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );
              if (res.ok) {
                const dirde = await res.json();
                if (dirde?.dirde_id) {
                  setTripData({
                    trip_id: dirde.dirde_id,
                    rider_id: dirde.rider_id,
                    driver_id: dirde.driver_id,
                    rider_latitude: Number(
                      dirde.rider_latitude ?? dirde.rider_coordinates?.latitude
                    ),
                    rider_longitude: Number(
                      dirde.rider_longitude ??
                        dirde.rider_coordinates?.longitude
                    ),
                    driver_latitude: Number(
                      dirde.driver_latitude ??
                        dirde.driver_coordinates?.latitude
                    ),
                    driver_longitude: Number(
                      dirde.driver_longitude ??
                        dirde.driver_coordinates?.longitude
                    ),
                    pickup_location: td.pickup_location,
                    destination: td.destination,
                    fare: td.fare,
                    status: td.status || "confirmed",
                  });
                  lastDriverUpdateAtRef.current = Date.now();
                  lastDriverUpdateSourceRef.current = "dirde";
                }
              }
            } catch (_) {}
          })();
        }
      }
      localStorage.removeItem("pendingConfirmedTrip");
    } catch (_) {}
  }, []);

  // Sync destination with RiderSearchForm selection in real time
  useEffect(() => {
    const h = selectedHospitalFromForm;
    if (!h) return;
    const lat = Number(h.latitude);
    const lon = Number(h.longitude);
    if (!lat || !lon) return;

    setTripData((prev) => {
      const next = prev ? { ...prev } : {};
      next.destination = h.name || prev?.destination || "Hospital";
      next.destination_latitude = lat;
      next.destination_longitude = lon;
      return next;
    });
  }, [
    selectedHospitalFromForm?.latitude,
    selectedHospitalFromForm?.longitude,
    selectedHospitalFromForm?.name,
  ]);

  // Fetch destination from Hospital table for the rider in this trip (polling)
  useEffect(() => {
    const riderId =
      tripData?.rider_id || (user.role === "rider" ? user.id : null);
    if (!riderId) return;

    let cancelled = false;
    let intervalId;

    const load = async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          JSON.parse(localStorage.getItem("user") || "null")?.token;
        const res = await fetch(
          `http://localhost:8000/hospitals?rider_id=${riderId}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );
        if (!res.ok) return;
        const rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) return;
        const latest = rows[0];
        const lat = Number(latest.latitude);
        const lon = Number(latest.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        if (cancelled) return;

        setTripData((prev) => {
          const next = prev ? { ...prev } : {};
          next.destination = latest.name || prev?.destination || "Hospital";
          next.destination_latitude = lat;
          next.destination_longitude = lon;
          return next;
        });
      } catch (_) {}
    };

    load();
    intervalId = setInterval(load, 3000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [tripData?.rider_id, user.id, user.role]);

  // Update map markers when trip data changes
  useEffect(() => {
    if (!mapRef.current || !tripData) {
      console.log("Map or trip data not ready:", {
        mapRef: !!mapRef.current,
        tripData: !!tripData,
      });
      return;
    }

    console.log("🗺️ Updating map markers with trip data:", tripData);

    // Clear only dynamic trip markers; keep persistent collections like hospitals/nearbyAmbulances
    const keysToClear = ["rider", "driver", "hospital", "user"];
    keysToClear.forEach((k) => {
      const entry = markersRef.current[k];
      if (entry && !Array.isArray(entry)) {
        try {
          // Check if marker is still valid before removing
          if (entry._map && entry._map._container && entry._leaflet_id) {
            mapRef.current.removeLayer(entry);
          }
        } catch (error) {
          console.warn(`Error removing ${k} marker:`, error.message);
        }
        delete markersRef.current[k];
      }
    });

    const markers = [];
    let bounds = [];

    // Add rider marker
    if (tripData.rider_latitude && tripData.rider_longitude) {
      console.log(
        "📍 Adding rider marker:",
        tripData.rider_latitude,
        tripData.rider_longitude
      );

      try {
        const riderIcon = createCustomIcon("#3B82F6", "R", "🚶");
        const riderMarker = L.marker(
          [tripData.rider_latitude, tripData.rider_longitude],
          {
            icon: riderIcon,
          }
        ).addTo(mapRef.current);

        riderMarker.bindPopup(`
           <div style="text-align: center; min-width: 200px;">
             <h3 style="margin: 0 0 10px 0; color: #3B82F6;">🚶 ${
               tripData.rider_name || "Rider"
             }</h3>
             <p style="margin: 5px 0;"><strong>📍 Live Coordinates:</strong></p>
             <p style="margin: 5px 0; font-family: monospace; background: #f3f4f6; padding: 4px; border-radius: 4px;">Lat: ${tripData.rider_latitude.toFixed(
               6
             )}</p>
             <p style="margin: 5px 0; font-family: monospace; background: #f3f4f6; padding: 4px; border-radius: 4px;">Lng: ${tripData.rider_longitude.toFixed(
               6
             )}</p>
             <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #059669;">${
               tripData.status
             }</span></p>
             <p style="margin: 5px 0;"><strong>Trip ID:</strong> ${
               tripData.trip_id
             }</p>
             <p style="margin: 5px 0;"><strong>Fare:</strong> ৳${
               tripData.fare || 0
             }</p>
           </div>
         `);

        markersRef.current.rider = riderMarker;
        markers.push([tripData.rider_latitude, tripData.rider_longitude]);
        bounds.push([tripData.rider_latitude, tripData.rider_longitude]);
        console.log("✅ Rider marker added successfully");
      } catch (error) {
        console.error("❌ Error creating rider marker:", error);
      }
    } else {
      console.log("❌ No rider coordinates available");
    }

    // Add driver marker
    if (tripData.driver_latitude && tripData.driver_longitude) {
      console.log(
        "🚑 Adding driver marker:",
        tripData.driver_latitude,
        tripData.driver_longitude
      );

      try {
        const driverIcon = createCustomIcon("#EF4444", "D", "🚑");
        const driverMarker = L.marker(
          [tripData.driver_latitude, tripData.driver_longitude],
          {
            icon: driverIcon,
          }
        ).addTo(mapRef.current);

        driverMarker.bindPopup(`
           <div style="text-align: center; min-width: 200px;">
             <h3 style="margin: 0 0 10px 0; color: #EF4444;">🚑 ${
               tripData.driver_name || "Driver"
             }</h3>
             <p style="margin: 5px 0;"><strong>📍 Live Coordinates:</strong></p>
             <p style="margin: 5px 0; font-family: monospace; background: #fef2f2; padding: 4px; border-radius: 4px;">Lat: ${
               tripData.driver_latitude
             }</p>
             <p style="margin: 5px 0; font-family: monospace; background: #fef2f2; padding: 4px; border-radius: 4px;">Lng: ${
               tripData.driver_longitude
             }</p>
             <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #dc2626;">${
               tripData.status
             }</span></p>
             <p style="margin: 5px 0;"><strong>Trip ID:</strong> ${
               tripData.trip_id
             }</p>
             <p style="margin: 5px 0;"><strong>Fare:</strong> ৳${
               tripData.fare || 0
             }</p>
           </div>
         `);

        markersRef.current.driver = driverMarker;
        markers.push([tripData.driver_latitude, tripData.driver_longitude]);
        bounds.push([tripData.driver_latitude, tripData.driver_longitude]);
        console.log("✅ Driver marker added successfully");
      } catch (error) {
        console.error("❌ Error creating driver marker:", error);
      }
    } else {
      console.log("❌ No driver coordinates available");
    }

    // Add destination hospital marker as a red drop with 'H'
    if (tripData.destination_latitude && tripData.destination_longitude) {
      try {
        const hospitalIcon = createDropPinIcon("#DC2626", "H");
        const hospitalMarker = L.marker(
          [tripData.destination_latitude, tripData.destination_longitude],
          { icon: hospitalIcon }
        ).addTo(mapRef.current);

        hospitalMarker.bindPopup(`
           <div style="text-align: center; min-width: 200px;">
             <h3 style="margin: 0 0 10px 0; color: #DC2626;">🏥 ${
               tripData.destination || "Hospital"
             }</h3>
             <p style="margin: 5px 0; font-family: monospace;">${Number(
               tripData.destination_latitude
             ).toFixed(6)}, ${Number(tripData.destination_longitude).toFixed(
          6
        )}</p>
           </div>
         `);

        markersRef.current.hospital = hospitalMarker;
        markers.push([
          tripData.destination_latitude,
          tripData.destination_longitude,
        ]);
        bounds.push([
          tripData.destination_latitude,
          tripData.destination_longitude,
        ]);
      } catch (error) {
        console.error("❌ Error creating hospital marker:", error);
      }
    }

    // Fit map to show all trip markers only once per trip to avoid shaking
    if (bounds.length > 0 && !hasFittedBoundsRef.current) {
      console.log(
        "📏 Fitting map to show",
        bounds.length,
        "markers (first time)"
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      hasFittedBoundsRef.current = true;
      // Open popups safely once
      setTimeout(() => {
        const open = (m) =>
          m && typeof m.openPopup === "function" && m.openPopup();
        Object.values(markersRef.current).forEach((entry) => {
          if (Array.isArray(entry)) entry.forEach((m) => open(m));
          else open(entry);
        });
      }, 600);
    } else if (bounds.length === 0) {
      console.log("❌ No bounds to fit map to");
    }

    console.log("✅ Map markers updated successfully");
  }, [tripData]);

  // When tripData changes, sync a concise subset into Redux for right-side panels
  useEffect(() => {
    if (!tripData) return;
    try {
      // Expose latest trip data globally for non-Leaflet panels
      window.latestTripData = tripData;
      window.dispatchEvent(
        new CustomEvent("trip-data-changed", { detail: tripData })
      );
    } catch (_) {}

    // Keep Redux slice updated for details cards
    try {
      dispatch(
        setOngoingTripDetails({
          trip_id: tripData.trip_id ?? 0,
          pickup_location: tripData.pickup_location || "",
          destination: tripData.destination || "",
          fare: Number(tripData.fare ?? 0),
          status: tripData.status || "",
          rider_id: tripData.rider_id ?? 0,
          driver_id: tripData.driver_id ?? 0,
          driver_name: tripData.driver_name || "",
          rider_name: tripData.rider_name || "",
          driver_mobile: tripData.driver_mobile || "",
          rider_mobile: tripData.rider_mobile || "",
          // Store rider coords in existing fields for potential consumers
          latitude: Number(tripData.rider_latitude ?? 0),
          longitude: Number(tripData.rider_longitude ?? 0),
        })
      );
    } catch (_) {}
  }, [tripData, dispatch]);

  // Reset one-time fit when a different trip starts
  useEffect(() => {
    hasFittedBoundsRef.current = false;
  }, [tripData?.trip_id]);

  // Show live marker for current user's own location (rider/driver)
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // Remove existing user marker if any
    if (markersRef.current.user) {
      try {
        // Check if marker is still valid before removing
        if (
          markersRef.current.user._map &&
          markersRef.current.user._map._container &&
          markersRef.current.user._leaflet_id
        ) {
          mapRef.current.removeLayer(markersRef.current.user);
        }
      } catch (error) {
        console.warn("Error removing user marker:", error.message);
      }
      delete markersRef.current.user;
    }

    try {
      const color = user.role === "driver" ? "#EF4444" : "#3B82F6"; // red for driver, blue for rider
      const emoji = user.role === "driver" ? "🚑" : "🚶";
      const label = user.role === "driver" ? "D" : "R";
      const userIcon = createCustomIcon(color, label, emoji);

      const marker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
      }).addTo(mapRef.current);

      marker.bindPopup(
        `
          <div style="text-align: center; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: ${color};">${emoji} You (${
          user.role
        })</h3>
            <p style="margin: 5px 0; font-family: monospace; background: #f3f4f6; padding: 4px; border-radius: 4px;">Lat: ${userLocation.latitude.toFixed(
              6
            )}</p>
            <p style="margin: 5px 0; font-family: monospace; background: #f3f4f6; padding: 4px; border-radius: 4px;">Lng: ${userLocation.longitude.toFixed(
              6
            )}</p>
          </div>
        `
      );

      markersRef.current.user = marker;
    } catch (error) {
      console.error("❌ Error creating user marker:", error);
    }
  }, [userLocation, user.role]);

  // Fetch live coordinates from all database tables
  useEffect(() => {
    const fetchLiveCoordinates = async () => {
      try {
        console.log(
          "🔍 Fetching live coordinates for user:",
          user.id,
          "role:",
          user.role
        );

        // 1. First check OngoingTrip table for active trips
        const ongoingResponse = await apiFetch("/ongoing-trips", {
          method: "GET",
        });

        if (ongoingResponse.ok) {
          const trips = await ongoingResponse.json();
          console.log("📋 Ongoing trips found:", trips.length);

          const currentTrip = trips.find(
            (trip) =>
              (user.role === "rider" && trip.rider_id === user.id) ||
              (user.role === "driver" && trip.driver_id === user.id)
          );

          if (currentTrip) {
            console.log("✅ Found active trip with coordinates:", {
              trip_id: currentTrip.trip_id,
              rider_coords: `${currentTrip.rider_latitude}, ${currentTrip.rider_longitude}`,
              driver_coords: `${currentTrip.driver_latitude}, ${currentTrip.driver_longitude}`,
              status: currentTrip.status,
              fare: currentTrip.fare, // Log the latest fare
            });

            // Update Redux with latest trip data including fare
            dispatch(
              setOngoingTripDetails({
                trip_id: currentTrip.trip_id ?? 0,
                pickup_location: currentTrip.pickup_location || "",
                destination: currentTrip.destination || "",
                fare: Number(currentTrip.fare ?? 0), // Use latest fare from database
                status: currentTrip.status || "",
                rider_id: currentTrip.rider_id ?? 0,
                driver_id: currentTrip.driver_id ?? 0,
                driver_name: currentTrip.driver_name || "",
                rider_name: currentTrip.rider_name || "",
                driver_mobile: currentTrip.driver_mobile || "",
                rider_mobile: currentTrip.rider_mobile || "",
                latitude: Number(currentTrip.rider_latitude ?? 0),
                longitude: Number(currentTrip.rider_longitude ?? 0),
              })
            );

            // Fetch user names
            try {
              const [riderResponse, driverResponse] = await Promise.all([
                fetch(`http://localhost:8000/users/${currentTrip.rider_id}`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }),
                fetch(
                  `http://localhost:8000/drivers/${currentTrip.driver_id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  }
                ),
              ]);

              if (riderResponse.ok) {
                const riderInfo = await riderResponse.json();
                currentTrip.rider_name =
                  riderInfo.name || `Rider ${currentTrip.rider_id}`;
                currentTrip.rider_mobile =
                  riderInfo.mobile ||
                  riderInfo.phone ||
                  riderInfo.contact ||
                  "";
              }

              if (driverResponse.ok) {
                const driverInfo = await driverResponse.json();
                currentTrip.driver_name =
                  driverInfo.name || `Driver ${currentTrip.driver_id}`;
                currentTrip.driver_mobile =
                  driverInfo.mobile ||
                  driverInfo.phone ||
                  driverInfo.contact ||
                  "";
              }
            } catch (error) {
              console.log("Could not fetch user info:", error);
            }

            // Pull destination/pickup from rider's TripRequest for this req_id
            try {
              const trRes = await apiFetch("/trip-requests", { method: "GET" });
              if (trRes.ok) {
                const trData = await trRes.json();
                const match = (trData.requests || trData).find(
                  (r) =>
                    (r.req_id === currentTrip.req_id ||
                      r.id === currentTrip.req_id) &&
                    r.rider_id === currentTrip.rider_id
                );
                if (match) {
                  currentTrip.destination =
                    match.destination || currentTrip.destination;
                  currentTrip.pickup_location =
                    match.pickup_location || currentTrip.pickup_location;
                }
              }
            } catch (e) {
              console.log("Could not load TripRequest for destination:", e);
            }

            // Prefer destination from RiderSearchForm selection when available
            if (
              selectedHospitalFromForm?.latitude &&
              selectedHospitalFromForm?.longitude
            ) {
              currentTrip.destination =
                selectedHospitalFromForm.name || currentTrip.destination;
              currentTrip.destination_latitude = Number(
                selectedHospitalFromForm.latitude
              );
              currentTrip.destination_longitude = Number(
                selectedHospitalFromForm.longitude
              );
            } else if (
              currentTrip.destination &&
              !currentTrip.destination_latitude
            ) {
              // Fallback if still missing
              currentTrip.destination_latitude = 23.7315; // Dhaka Medical College Hospital
              currentTrip.destination_longitude = 90.3962;
            }

            // Ensure coordinates exist
            if (
              !currentTrip.rider_latitude ||
              !currentTrip.rider_longitude ||
              !currentTrip.driver_latitude ||
              !currentTrip.driver_longitude
            ) {
              console.log(
                "⚠️ Some coordinates missing, getting current location..."
              );

              try {
                const position = await new Promise((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                  });
                });

                const currentCoords = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };

                console.log("📍 Got current location:", currentCoords);

                // Update coordinates based on user role
                if (user.role === "rider") {
                  if (
                    !currentTrip.rider_latitude ||
                    !currentTrip.rider_longitude
                  ) {
                    currentTrip.rider_latitude = currentCoords.latitude;
                    currentTrip.rider_longitude = currentCoords.longitude;
                    console.log("✅ Updated rider coordinates");
                  }
                  // Add nearby driver coordinates
                  if (
                    !currentTrip.driver_latitude ||
                    !currentTrip.driver_longitude
                  ) {
                    currentTrip.driver_latitude =
                      currentCoords.latitude + (Math.random() - 0.5) * 0.01;
                    currentTrip.driver_longitude =
                      currentCoords.longitude + (Math.random() - 0.5) * 0.01;
                    console.log("📍 Added nearby driver coordinates");
                  }
                } else if (user.role === "driver") {
                  if (
                    !currentTrip.driver_latitude ||
                    !currentTrip.driver_longitude
                  ) {
                    currentTrip.driver_latitude = currentCoords.latitude;
                    currentTrip.driver_longitude = currentCoords.longitude;
                    console.log("✅ Updated driver coordinates");
                  }
                  // Add nearby rider coordinates
                  if (
                    !currentTrip.rider_latitude ||
                    !currentTrip.rider_longitude
                  ) {
                    currentTrip.rider_latitude =
                      currentCoords.latitude + (Math.random() - 0.5) * 0.01;
                    currentTrip.rider_longitude =
                      currentCoords.longitude + (Math.random() - 0.5) * 0.01;
                    console.log("📍 Added nearby rider coordinates");
                  }
                }
              } catch (error) {
                console.error("❌ Could not get current location:", error);
                // Use demo coordinates as fallback
                if (
                  !currentTrip.rider_latitude ||
                  !currentTrip.rider_longitude
                ) {
                  currentTrip.rider_latitude = 23.8103;
                  currentTrip.rider_longitude = 90.4125;
                }
                if (
                  !currentTrip.driver_latitude ||
                  !currentTrip.driver_longitude
                ) {
                  currentTrip.driver_latitude = 23.815;
                  currentTrip.driver_longitude = 90.42;
                }
                console.log("📍 Using fallback demo coordinates");
              }
            }

            console.log("📍 Final live coordinates:", {
              rider: `${currentTrip.rider_latitude}, ${currentTrip.rider_longitude}`,
              driver: `${currentTrip.driver_latitude}, ${currentTrip.driver_longitude}`,
              destination: `${currentTrip.destination_latitude}, ${currentTrip.destination_longitude}`,
              rider_name: currentTrip.rider_name,
              driver_name: currentTrip.driver_name,
            });

            setTripData(currentTrip);
            return;
          }
        }

        // 2. If no active trip, check for recent trip requests and driver locations
        console.log("❌ No active trip found, checking for available data...");

        try {
          const [tripRequestsResponse, driverLocationsResponse] =
            await Promise.all([
              fetch("http://localhost:8000/trip-requests", {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }),
              fetch("http://localhost:8000/driver-locations", {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }),
            ]);

          if (tripRequestsResponse.ok) {
            const tripRequests = await tripRequestsResponse.json();
            console.log(
              "📋 Trip requests found:",
              tripRequests.requests?.length || 0
            );
          }

          if (driverLocationsResponse.ok) {
            const driverLocations = await driverLocationsResponse.json();
            console.log(
              "🚑 Driver locations found:",
              driverLocations.length || 0
            );
          }
        } catch (error) {
          console.log("Could not fetch additional data:", error);
        }

        // 3. If no data found, but a hospital is selected in the form, still show it on the map
        if (
          selectedHospitalFromForm?.latitude &&
          selectedHospitalFromForm?.longitude
        ) {
          setTripData({
            trip_id: null,
            rider_id: user.id,
            driver_id: null,
            destination: selectedHospitalFromForm.name || "Hospital",
            destination_latitude: Number(selectedHospitalFromForm.latitude),
            destination_longitude: Number(selectedHospitalFromForm.longitude),
            pickup_location: null,
            fare: 0,
            status: "planning",
            rider_latitude: userLocation?.latitude || null,
            rider_longitude: userLocation?.longitude || null,
          });
        } else {
          setTripData(null);
        }
      } catch (error) {
        console.error("❌ Error fetching live coordinates:", error);
        setTripData(null);
      }
    };

    fetchLiveCoordinates();

    // Set up interval to fetch latest fare data every 10 seconds
    const fareInterval = setInterval(() => {
      fetchLiveCoordinates();
    }, 10000); // Fetch every 10 seconds to get latest fare

    // Also fetch Dirde coordinates
    const fetchDirdeCoordinates = async () => {
      try {
        console.log("🔍 Fetching Dirde coordinates...");

        const response = await fetch("http://localhost:8000/dirde", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const dirdeRecords = await response.json();
          console.log("📋 Dirde records found:", dirdeRecords.length);

          if (dirdeRecords.length > 0 && !tripData) {
            // Get the latest Dirde record
            const latestDirde = dirdeRecords[0];
            console.log("📍 Latest Dirde coordinates:", latestDirde);

            // Convert Dirde data to trip data format
            const tripData = {
              trip_id: latestDirde.dirde_id,
              rider_id: latestDirde.rider_id,
              driver_id: latestDirde.driver_id,
              rider_name: `Rider ${latestDirde.rider_id}`,
              driver_name: `Driver ${latestDirde.driver_id}`,
              rider_latitude: latestDirde.rider_coordinates.latitude,
              rider_longitude: latestDirde.rider_coordinates.longitude,
              driver_latitude: latestDirde.driver_coordinates.latitude,
              driver_longitude: latestDirde.driver_coordinates.longitude,
              destination_latitude: 23.7315, // Dhaka Medical College Hospital
              destination_longitude: 90.3962,
              pickup_location: "Pickup Location",
              destination: "Dhaka Medical College Hospital",
              fare: 250,
              status: latestDirde.status,
            };

            console.log("📍 Converted Dirde data to trip format:", {
              rider: `${tripData.rider_latitude}, ${tripData.rider_longitude}`,
              driver: `${tripData.driver_latitude}, ${tripData.driver_longitude}`,
            });

            setTripData(tripData);
          }
        }
      } catch (error) {
        console.log("Could not fetch Dirde coordinates:", error);
      }
    };

    fetchDirdeCoordinates();

    // Set up WebSocket listener for real-time location updates
    const handleLocationUpdate = (event) => {
      const message = event.detail;
      if (message.type === "trip-location-update" && message.data) {
        console.log("📍 Received real-time location update:", message.data);

        setTripData((prevData) => {
          if (!prevData) return prevData;

          const updatedData = { ...prevData };

          // Update rider location if provided
          if (message.data.rider_location) {
            updatedData.rider_latitude = message.data.rider_location.latitude;
            updatedData.rider_longitude = message.data.rider_location.longitude;
            console.log(
              "🔄 Updated rider location:",
              message.data.rider_location
            );
          }

          // Update driver location if provided
          if (message.data.driver_location) {
            // Avoid overwriting fresh Dirde-pulled coordinates
            const now = Date.now();
            const preferDirde =
              lastDriverUpdateSourceRef.current === "dirde" &&
              now - lastDriverUpdateAtRef.current < 8000; // 8s preference window
            if (!preferDirde) {
              updatedData.driver_latitude =
                message.data.driver_location.latitude;
              updatedData.driver_longitude =
                message.data.driver_location.longitude;
              lastDriverUpdateAtRef.current = now;
              lastDriverUpdateSourceRef.current = "ws";
              console.log(
                "🔄 Updated driver location from WS:",
                message.data.driver_location
              );
            } else {
              console.log(
                "⏭️ Skipped WS driver update; preferring recent Dirde data"
              );
            }
          }

          // Update other trip data
          if (message.data.eta !== undefined)
            updatedData.eta = message.data.eta;
          if (message.data.distance !== undefined)
            updatedData.distance = message.data.distance;
          if (message.data.progress !== undefined)
            updatedData.progress = message.data.progress;

          return updatedData;
        });
      }
    };

    window.addEventListener("trip-location-update", handleLocationUpdate);

    // When a bid is accepted, verify IDs and load Dirde coordinates for that pair
    const handleBidAccepted = async (event) => {
      const detail = event.detail;
      if (!detail) return;

      // Support both shapes:
      // 1) { type: 'bid-accepted', data: { rider_id, driver_id } }
      // 2) tripDetails object directly (from 'bidAccepted')
      const isTyped = typeof detail === "object" && detail.type && detail.data;
      const rider_id = isTyped
        ? detail.data?.rider_id
        : detail.rider_id || detail.tripDetails?.rider_id;
      const driver_id = isTyped
        ? detail.data?.driver_id
        : detail.driver_id || detail.tripDetails?.driver_id;

      if (!rider_id || !driver_id) return;

      // Only proceed if the current user is part of this pair
      if (user.id !== rider_id && user.id !== driver_id) return;

      try {
        const res = await fetch(
          `http://localhost:8000/dirde/${rider_id}/${driver_id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) return;
        const dirdeData = await res.json();
        if (!dirdeData.dirde_id) return;

        const nextTripData = {
          trip_id: dirdeData.dirde_id,
          rider_id: dirdeData.rider_id,
          driver_id: dirdeData.driver_id,
          rider_name: `Rider ${dirdeData.rider_id}`,
          driver_name: `Driver ${dirdeData.driver_id}`,
          rider_latitude: dirdeData.rider_coordinates?.latitude,
          rider_longitude: dirdeData.rider_coordinates?.longitude,
          driver_latitude: dirdeData.driver_coordinates?.latitude,
          driver_longitude: dirdeData.driver_coordinates?.longitude,
          destination_latitude: dirdeData.destination_coordinates?.latitude,
          destination_longitude: dirdeData.destination_coordinates?.longitude,
          pickup_location: "Pickup Location",
          destination: "Dhaka Medical College Hospital",
          fare: 250,
          status: "accepted",
        };

        // Fallback hospital coordinates if missing
        if (
          !nextTripData.destination_latitude ||
          !nextTripData.destination_longitude
        ) {
          nextTripData.destination_latitude = 23.7315;
          nextTripData.destination_longitude = 90.3962;
        }

        // Try to enrich with real names similar to manual Dirde load
        try {
          const [riderResponse, driverResponse] = await Promise.all([
            fetch(`http://localhost:8000/users/${nextTripData.rider_id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
            fetch(`http://localhost:8000/drivers/${nextTripData.driver_id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }),
          ]);
          if (riderResponse.ok) {
            const riderInfo = await riderResponse.json();
            nextTripData.rider_name = riderInfo.name || nextTripData.rider_name;
          }
          if (driverResponse.ok) {
            const driverInfo = await driverResponse.json();
            nextTripData.driver_name =
              driverInfo.name || nextTripData.driver_name;
          }
        } catch (err) {
          // non-fatal enrichment failure
        }

        // Load TripRequest to source destination/pickup by rider and req
        try {
          const trRes = await apiFetch("/trip-requests", { method: "GET" });
          if (trRes.ok) {
            const trData = await trRes.json();
            const match = (trData.requests || trData).find(
              (r) => r.rider_id === nextTripData.rider_id
            );
            if (match) {
              nextTripData.destination =
                match.destination || nextTripData.destination;
              nextTripData.pickup_location =
                match.pickup_location || nextTripData.pickup_location;
            }
          }
        } catch (_) {}

        setTripData(nextTripData);
        console.log("✅ Dirde pair loaded after bid accepted:", nextTripData);
      } catch (e) {
        console.error("❌ Failed loading Dirde pair after bid accepted:", e);
      }
    };

    window.addEventListener("bid-accepted", handleBidAccepted);
    window.addEventListener("bidAccepted", handleBidAccepted);

    // When a trip is confirmed (driver presses Confirm Trip), load Dirde pair
    const handleTripConfirmed = async (event) => {
      const td = event.detail;
      if (!td || !td.rider_id || !td.driver_id) return;
      if (user.id !== td.rider_id && user.id !== td.driver_id) return;
      try {
        const res = await fetch(
          `http://localhost:8000/dirde/${td.rider_id}/${td.driver_id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) return;
        const dirde = await res.json();
        if (!dirde || !dirde.dirde_id) return;
        setTripData((prev) => ({
          ...(prev || {}),
          trip_id: dirde.dirde_id,
          rider_id: dirde.rider_id,
          driver_id: dirde.driver_id,
          rider_latitude: Number(
            dirde.rider_latitude ?? dirde.rider_coordinates?.latitude
          ),
          rider_longitude: Number(
            dirde.rider_longitude ?? dirde.rider_coordinates?.longitude
          ),
          driver_latitude: Number(
            dirde.driver_latitude ?? dirde.driver_coordinates?.latitude
          ),
          driver_longitude: Number(
            dirde.driver_longitude ?? dirde.driver_coordinates?.longitude
          ),
          status: td.status || "confirmed",
          pickup_location: td.pickup_location || prev?.pickup_location,
          destination: td.destination || prev?.destination,
        }));
        lastDriverUpdateAtRef.current = Date.now();
        lastDriverUpdateSourceRef.current = "dirde";
        console.log("✅ Trip-confirmed: Dirde loaded onto map");
        if (user.role === "rider") {
          try {
            localStorage.setItem("pendingConfirmedTrip", JSON.stringify(td));
          } catch (_) {}
          // Ensure rider is on the map view
          if (!window.location.pathname.includes("route_map")) {
            window.location.href = "/route_map";
          }
        }
      } catch (e) {
        console.error("❌ Failed to load Dirde after trip-confirmed:", e);
      }
    };

    window.addEventListener("trip-confirmed", handleTripConfirmed);

    // Handle real-time fare updates
    const handleFareUpdate = (event) => {
      const fareData = event.detail;
      if (fareData && fareData.trip_id === tripData?.trip_id) {
        console.log("💰 Real-time fare update received:", fareData);

        // Update tripData state with latest fare
        setTripData((prev) => ({
          ...prev,
          fare: Number(fareData.fare ?? 0),
        }));
      }
    };

    window.addEventListener("fare-update", handleFareUpdate);

    return () => {
      window.removeEventListener("trip-location-update", handleLocationUpdate);
      window.removeEventListener("bid-accepted", handleBidAccepted);
      window.removeEventListener("bidAccepted", handleBidAccepted);
      window.removeEventListener("trip-confirmed", handleTripConfirmed);
      window.removeEventListener("fare-update", handleFareUpdate);
      clearInterval(fareInterval); // Clean up fare fetching interval
    };
  }, [user]);

  // Periodically update fare data from database for ongoing trips
  useEffect(() => {
    if (!tripData?.trip_id || !user.id) return;

    const updateFareData = async () => {
      try {
        console.log("💰 Updating fare data for trip:", tripData.trip_id);

        const ongoingResponse = await apiFetch("/ongoing-trips", {
          method: "GET",
        });

        if (ongoingResponse.ok) {
          const trips = await ongoingResponse.json();
          const currentTrip = trips.find(
            (trip) =>
              (user.role === "rider" && trip.rider_id === user.id) ||
              (user.role === "driver" && trip.driver_id === user.id)
          );

          if (currentTrip && currentTrip.fare !== tripData.fare) {
            console.log("💰 Fare updated:", {
              old_fare: tripData.fare,
              new_fare: currentTrip.fare,
              trip_id: currentTrip.trip_id,
            });

            // Update Redux with latest fare
            dispatch(
              setOngoingTripDetails({
                trip_id: currentTrip.trip_id ?? 0,
                pickup_location: currentTrip.pickup_location || "",
                destination: currentTrip.destination || "",
                fare: Number(currentTrip.fare ?? 0),
                status: currentTrip.status || "",
                rider_id: currentTrip.rider_id ?? 0,
                driver_id: currentTrip.driver_id ?? 0,
                driver_name: currentTrip.driver_name || "",
                rider_name: currentTrip.rider_name || "",
                driver_mobile: currentTrip.driver_mobile || "",
                rider_mobile: currentTrip.rider_mobile || "",
                latitude: Number(currentTrip.rider_latitude ?? 0),
                longitude: Number(currentTrip.rider_longitude ?? 0),
              })
            );

            // Update tripData state with latest fare
            setTripData((prev) => ({
              ...prev,
              fare: Number(currentTrip.fare ?? 0),
            }));
          }
        }
      } catch (error) {
        console.error("❌ Error updating fare data:", error);
      }
    };

    // Update fare every 5 seconds for ongoing trips
    const fareUpdateInterval = setInterval(updateFareData, 5000);

    // Initial update
    updateFareData();

    return () => {
      clearInterval(fareUpdateInterval);
    };
  }, [tripData?.trip_id, user.id, user.role, dispatch]);

  // Send real-time location updates for live tracking
  useEffect(() => {
    if (
      !WebSocketController.isConnected() ||
      !user.latitude ||
      !user.longitude ||
      !tripData?.trip_id ||
      !(tripData.status === "ongoing" || tripData.status === "accepted")
    )
      return;

    console.log("🔄 Setting up real-time location tracking for:", {
      user_id: user.id,
      role: user.role,
      trip_id: tripData.trip_id,
      coordinates: { lat: user.latitude, lng: user.longitude },
    });

    const interval = setInterval(async () => {
      try {
        const locationUpdate = {
          type: "trip-location-update",
          data: {
            trip_id: tripData.trip_id,
            rider_id: user.role === "rider" ? user.id : tripData.rider_id,
            driver_id: user.role === "driver" ? user.id : tripData.driver_id,
            rider_location:
              user.role === "rider"
                ? {
                    latitude: user.latitude,
                    longitude: user.longitude,
                  }
                : null,
            driver_location:
              user.role === "driver"
                ? {
                    latitude: user.latitude,
                    longitude: user.longitude,
                  }
                : null,
            timestamp: new Date().toISOString(),
            user_role: user.role,
          },
        };

        console.log("📍 Sending real-time location update:", locationUpdate);
        await WebSocketController.sendMessage(locationUpdate);
      } catch (error) {
        console.error("❌ Failed to send location update:", error);
      }
    }, 3000); // Send every 3 seconds for real-time tracking

    return () => {
      console.log("🛑 Stopping real-time location tracking");
      clearInterval(interval);
    };
  }, [user, tripData]);

  // Periodically refresh coordinates from Dirde table for realtime accuracy
  useEffect(() => {
    if (!tripData?.trip_id || !tripData?.rider_id || !tripData?.driver_id)
      return;
    if (
      !(
        tripData.status === "ongoing" ||
        tripData.status === "accepted" ||
        tripData.status === "active" ||
        tripData.status === "confirmed" ||
        tripData.status === "pending_confirmation"
      )
    )
      return;

    let isCancelled = false;
    const token =
      localStorage.getItem("token") ||
      JSON.parse(localStorage.getItem("user") || "null")?.token;

    const pull = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/dirde/${tripData.rider_id}/${tripData.driver_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) return;
        const d = await res.json();
        if (!d || !d.dirde_id) return;

        if (isCancelled) return;

        const riderLat = Number(
          d.rider_latitude ?? d.rider_coordinates?.latitude
        );
        const riderLng = Number(
          d.rider_longitude ?? d.rider_coordinates?.longitude
        );
        const driverLat = Number(
          d.driver_latitude ?? d.driver_coordinates?.latitude
        );
        const driverLng = Number(
          d.driver_longitude ?? d.driver_coordinates?.longitude
        );

        setTripData((prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          const prevDriver = {
            lat: prev.driver_latitude,
            lng: prev.driver_longitude,
          };
          const prevRider = {
            lat: prev.rider_latitude,
            lng: prev.rider_longitude,
          };
          if (Number.isFinite(riderLat)) next.rider_latitude = riderLat;
          if (Number.isFinite(riderLng)) next.rider_longitude = riderLng;
          if (Number.isFinite(driverLat)) next.driver_latitude = driverLat;
          if (Number.isFinite(driverLng)) next.driver_longitude = driverLng;
          if (
            prevDriver.lat !== next.driver_latitude ||
            prevDriver.lng !== next.driver_longitude
          ) {
            console.log("🧭 Dirde applied driver coords:", {
              from: prevDriver,
              to: { lat: next.driver_latitude, lng: next.driver_longitude },
            });
          }
          if (
            prevRider.lat !== next.rider_latitude ||
            prevRider.lng !== next.rider_longitude
          ) {
            console.log("🧭 Dirde applied rider coords:", {
              from: prevRider,
              to: { lat: next.rider_latitude, lng: next.rider_longitude },
            });
          }
          return next;
        });
        // Record that driver location came from Dirde just now
        lastDriverUpdateAtRef.current = Date.now();
        lastDriverUpdateSourceRef.current = "dirde";
      } catch (_) {}
    };

    // initial pull + interval
    pull();
    const id = setInterval(pull, 1000);

    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [
    tripData?.trip_id,
    tripData?.rider_id,
    tripData?.driver_id,
    tripData?.status,
  ]);

  // Geocode destination string -> coordinates when missing
  useEffect(() => {
    if (!tripData?.destination) return;
    if (tripData?.destination_latitude && tripData?.destination_longitude)
      return;

    let isCancelled = false;

    const geocode = async () => {
      try {
        // Query Nominatim constrained near current area
        const centerLat =
          tripData?.rider_latitude || userLocation?.latitude || 23.8103;
        const centerLng =
          tripData?.rider_longitude || userLocation?.longitude || 90.4125;
        const delta = 0.15; // ~15-20km box around center
        const viewbox = [
          (centerLng - delta).toFixed(6),
          (centerLat + delta).toFixed(6),
          (centerLng + delta).toFixed(6),
          (centerLat - delta).toFixed(6),
        ].join(",");

        const q = encodeURIComponent(`${tripData.destination} hospital Dhaka`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&bounded=1&viewbox=${viewbox}&q=${q}`;

        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const arr = await res.json();
        if (!Array.isArray(arr) || arr.length === 0) return;

        // Prefer results tagged as hospital or closest to center
        let best = arr[0];
        let bestScore = Infinity;
        arr.forEach((item) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
          const isHospital =
            (item.class === "amenity" && item.type === "hospital") ||
            /hospital/i.test(item.display_name || "");
          const dist = Math.hypot(lat - centerLat, lon - centerLng);
          const score = dist + (isHospital ? 0 : 10); // penalize non-hospital results
          if (score < bestScore) {
            bestScore = score;
            best = item;
          }
        });

        const lat = parseFloat(best.lat);
        const lon = parseFloat(best.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon) && !isCancelled) {
          setTripData((prev) =>
            prev
              ? {
                  ...prev,
                  destination_latitude: prev.destination_latitude ?? lat,
                  destination_longitude: prev.destination_longitude ?? lon,
                }
              : prev
          );
        }
      } catch (_) {}
    };

    geocode();

    return () => {
      isCancelled = true;
    };
  }, [
    tripData?.destination,
    tripData?.destination_latitude,
    tripData?.destination_longitude,
    userLocation?.latitude,
    userLocation?.longitude,
    tripData?.rider_latitude,
    tripData?.rider_longitude,
  ]);

  // Utility: approximate haversine distance in meters
  const getDistanceMeters = (aLat, aLng, bLat, bLng) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const lat1 = toRad(aLat);
    const lat2 = toRad(bLat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const a =
      sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Discovery layer disabled: remove any previously added nearby hospital markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear discovery markers (we still keep the single destination marker elsewhere)
    if (
      markersRef.current.hospitals &&
      Array.isArray(markersRef.current.hospitals)
    ) {
      try {
        markersRef.current.hospitals.forEach((m) => {
          if (m && m._map && m._map._container && m._leaflet_id) {
            mapRef.current.removeLayer(m);
          }
        });
      } catch (error) {
        console.warn("Error removing hospital markers:", error.message);
      }
      markersRef.current.hospitals = [];
    }
    if (
      markersRef.current.nearbyAmbulances &&
      Array.isArray(markersRef.current.nearbyAmbulances)
    ) {
      try {
        markersRef.current.nearbyAmbulances.forEach((m) => {
          if (m && m._map && m._map._container && m._leaflet_id) {
            mapRef.current.removeLayer(m);
          }
        });
      } catch (error) {
        console.warn("Error removing ambulance markers:", error.message);
      }
      markersRef.current.nearbyAmbulances = [];
    }
  }, [
    mapRef.current,
    userLocation?.latitude,
    userLocation?.longitude,
    tripData?.destination_latitude,
    tripData?.destination_longitude,
  ]);

  return (
    <div className="relative">
      {/* Map Header */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <h3 className="font-semibold text-gray-800 mb-2">
          🗺️ Live Trip Tracking
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span>🔵 Rider</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span>🔴 Driver</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span>🟢 Hospital</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <p>Click markers to see details</p>
        </div>
      </div>

      {/* Trip Info */}
      {tripData && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="font-semibold text-gray-800 mb-2">📋 Trip Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>From:</strong> {tripData.pickup_location}
            </p>
            <p>
              <strong>To:</strong> {tripData.destination}
            </p>
            <p>
              <strong>Fare:</strong> ৳{tripData.fare}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="text-green-600 font-medium">
                {tripData.status}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 max-w-sm">
        <h4 className="font-semibold text-gray-800 mb-2">
          🔍 Live Tracking Status
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center justify-between">
            <span>📍 GPS Access:</span>
            <span
              className={
                locationPermission === "granted"
                  ? "text-green-600"
                  : locationPermission === "denied"
                  ? "text-red-600"
                  : "text-yellow-600"
              }
            >
              {locationPermission === "granted"
                ? "✅ Enabled"
                : locationPermission === "denied"
                ? "❌ Denied"
                : "⏳ Requesting..."}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>📊 Trip Data:</span>
            <span className={tripData ? "text-green-600" : "text-red-600"}>
              {tripData ? "✅ Loaded" : "❌ None"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>👤 Current User:</span>
            <span className="text-blue-600">
              {user.name || user.id} ({user.role})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>🔄 Real-time:</span>
            <span
              className={tripData?.trip_id ? "text-green-600" : "text-red-600"}
            >
              {tripData?.trip_id ? "✅ Active" : "❌ Inactive"}
            </span>
          </div>
          {tripData && (
            <>
              <div className="flex items-center justify-between">
                <span>🔵 Rider:</span>
                <span
                  className={
                    tripData.rider_latitude ? "text-green-600" : "text-red-600"
                  }
                >
                  {tripData.rider_latitude ? "📍 Located" : "❌ No location"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>🔴 Driver:</span>
                <span
                  className={
                    tripData.driver_latitude ? "text-green-600" : "text-red-600"
                  }
                >
                  {tripData.driver_latitude ? "📍 Located" : "❌ No location"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>🟢 Hospital:</span>
                <span
                  className={
                    tripData.destination_latitude
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {tripData.destination_latitude
                    ? "📍 Located"
                    : "❌ No location"}
                </span>
              </div>
              {tripData.rider_latitude && (
                <div className="mt-2 pt-2 border-t text-xs">
                  <p>
                    <strong>Trip ID:</strong> {tripData.trip_id}
                  </p>
                  <p>
                    <strong>Rider:</strong>{" "}
                    {tripData.rider_name || `ID: ${tripData.rider_id}`}
                  </p>
                  <p style={{ fontFamily: "monospace" }}>
                    📍 {tripData.rider_latitude.toFixed(6)},{" "}
                    {tripData.rider_longitude.toFixed(6)}
                  </p>
                  {tripData.driver_latitude && (
                    <>
                      <p>
                        <strong>Driver:</strong>{" "}
                        {tripData.driver_name || `ID: ${tripData.driver_id}`}
                      </p>
                      <p style={{ fontFamily: "monospace" }}>
                        📍 {tripData.driver_latitude.toFixed(6)},{" "}
                        {tripData.driver_longitude.toFixed(6)}
                      </p>
                    </>
                  )}
                  {tripData.destination_latitude && (
                    <>
                      <p>
                        <strong>Destination:</strong> {tripData.destination}
                      </p>
                      <p style={{ fontFamily: "monospace" }}>
                        📍 {tripData.destination_latitude.toFixed(6)},{" "}
                        {tripData.destination_longitude.toFixed(6)}
                      </p>
                    </>
                  )}
                  <p>
                    <strong>Fare:</strong> ৳{tripData.fare}
                  </p>
                  <p>
                    <strong>Status:</strong> {tripData.status}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Manual Controls */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={async () => {
              try {
                const response = await fetch("http://localhost:8000/dirde", {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                });

                if (response.ok) {
                  const dirdeRecords = await response.json();
                  console.log("📋 Dirde records:", dirdeRecords);

                  if (dirdeRecords.length > 0) {
                    const latestDirde = dirdeRecords[0];
                    const tripData = {
                      trip_id: latestDirde.dirde_id,
                      rider_id: latestDirde.rider_id,
                      driver_id: latestDirde.driver_id,
                      rider_name: `Rider ${latestDirde.rider_id}`,
                      driver_name: `Driver ${latestDirde.driver_id}`,
                      rider_latitude: latestDirde.rider_coordinates.latitude,
                      rider_longitude: latestDirde.rider_coordinates.longitude,
                      driver_latitude: latestDirde.driver_coordinates.latitude,
                      driver_longitude:
                        latestDirde.driver_coordinates.longitude,
                      destination_latitude: 23.7315,
                      destination_longitude: 90.3962,
                      pickup_location: "Pickup Location",
                      destination: "Dhaka Medical College Hospital",
                      fare: 250,
                      status: latestDirde.status,
                    };

                    setTripData(tripData);
                    console.log("✅ Dirde data loaded on map!");
                  } else {
                    alert(
                      "No Dirde records found. Make sure a driver has sent a bid."
                    );
                  }
                }
              } catch (error) {
                console.error("❌ Error checking Dirde records:", error);
              }
            }}
            className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
          >
            📍 Check Dirde Records
          </button>
        </div>
      </div>

      <div
        id="route-map"
        style={{
          height: height,
          width: "100%",
          borderRadius: "12px",
          overflow: "hidden",
          border: "2px solid #e5e7eb",
        }}
      />
    </div>
  );
};

RouteMap.propTypes = {
  zoom: PropTypes.number,
  height: PropTypes.string,
};

export default RouteMap;
