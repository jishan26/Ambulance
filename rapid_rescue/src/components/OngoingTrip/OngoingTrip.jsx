import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Header from "./Header/Header";
import RouteMap from "../Map/RouteMap";
import LocationBar from "./LocationBar/LocationBar";
import OngoingTripDetails from "./OngoingTripDetails/OngoingTripDetails";
import ETA from "./ETA/ETA";
import Distance from "./Distance/Distance";
import WebSocketController from "../../controllers/websocket/ConnectionManger";
const OngoingTrip = () => {
  const [etaMinutes, setEtaMinutes] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [progress, setProgress] = useState(0);
  const [driverLocation, setDriverLocation] = useState(null);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const ongoingTrip = useSelector((state) => state.ongoingTripDetails);
  const nearbyDrivers = useSelector((state) => state.nearbyDrivers);

  // Get trip details from Redux
  console.log("🔍 OngoingTrip - ongoingTrip from Redux:", ongoingTrip);
  console.log("🔍 OngoingTrip - user from Redux:", user);

  const tripDetails = ongoingTrip || {
    pickup_location: "123 Main Street",
    destination: "456 Broadway",
    driver_name: "Alex Miller",
    fare: 250,
  };

  console.log("🔍 OngoingTrip - final tripDetails:", tripDetails);

  // Get driver's current location from nearby drivers
  useEffect(() => {
    if (nearbyDrivers && nearbyDrivers.drivers && ongoingTrip) {
      const driver = Object.values(nearbyDrivers.drivers).find(
        (d) =>
          d.id === ongoingTrip.driver_id ||
          d.driver_id === ongoingTrip.driver_id
      );
      if (driver) {
        setDriverLocation({
          latitude: driver.latitude,
          longitude: driver.longitude,
        });
      }
    }
  }, [nearbyDrivers, ongoingTrip]);

  // Compute ETA, distance and progress from latest map trip data
  useEffect(() => {
    const compute = () => {
      const td = window.latestTripData;
      if (!td) return;
      // remaining distance between driver and destination if driver exists; otherwise rider to destination
      const aLat = td.driver_latitude || td.rider_latitude;
      const aLng = td.driver_longitude || td.rider_longitude;
      const bLat = td.destination_latitude;
      const bLng = td.destination_longitude;
      if (!aLat || !aLng || !bLat || !bLng) return;
      const toRad = (v) => (v * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(bLat - aLat);
      const dLng = toRad(bLng - aLng);
      const lat1 = toRad(aLat);
      const lat2 = toRad(bLat);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKmCalc = R * c;
      setDistanceKm(Number(distanceKmCalc.toFixed(1)));

      // very rough ETA assuming average 25 km/h in city
      const avgSpeedKmh = 25;
      const eta = Math.max(0, (distanceKmCalc / avgSpeedKmh) * 60);
      setEtaMinutes(Number(eta.toFixed(0)));

      // progress: based on initial distance stored on first compute
      if (!compute._initial) compute._initial = distanceKmCalc || 0;
      const initial = compute._initial || distanceKmCalc;
      const traveled = Math.max(0, initial - distanceKmCalc);
      const pct = initial > 0 ? Math.min(100, (traveled / initial) * 100) : 0;
      setProgress(Number(pct.toFixed(0)));
    };

    compute();
    const id = setInterval(compute, 3000);
    return () => clearInterval(id);
  }, []);

  const handleEndTrip = () => {
    // Driver sends end emergency request to rider for confirmation
    if (user.role === "driver") {
      if (WebSocketController.isConnected()) {
        WebSocketController.sendMessage({
          type: "end-emergency-request",
          data: {
            trip_id: ongoingTrip?.trip_id,
            rider_id: ongoingTrip?.rider_id,
            driver_id: user.id,
            driver_name: user.name || "Driver",
            pickup_location: ongoingTrip?.pickup_location,
            destination: ongoingTrip?.destination,
            timestamp: new Date().toISOString(),
          },
        });
      }
      window.location.href = "/available_ride";
      console.log("✅ End emergency request sent to rider for confirmation");
      alert("Request sent to rider for confirmation to end emergency");
      // Driver stays on this page and waits for rider's response
      // Will navigate when "end-emergency-confirmed" event is received
    } else {
      // Rider can directly end trip
      if (WebSocketController.isConnected()) {
        WebSocketController.sendMessage({
          type: "trip-ended",
          data: {
            trip_id: ongoingTrip?.trip_id,
            rider_id: user.id,
            driver_id: ongoingTrip?.driver_id,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Clear ongoing trip details
      dispatch({ type: "ongoingTripDetails/clearTrip" });
    }
  };

  return (
    <div className="flex justify-center mb-10 pt-10">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <Header
          role={user.role || "driver"}
          handleEndTrip={handleEndTrip}
          userName={user.name || tripDetails.driver_name || "Alex Miller"}
        />

        {/* Content Container */}
        <div className="grid md:grid-cols-2 gap-6 pt-5">
          {/* Map Section */}
          <div className="relative">
            <RouteMap />
            <div className="absolute top-4 right-4 z-[1001]">
              <button
                onClick={() => (window.location.href = "/route_map")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2"
              >
                <span>🗺️</span>
                <span>Full Screen Map</span>
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Status and Location Bar */}
            <LocationBar
              pickup_location={tripDetails.pickup_location}
              destination={tripDetails.destination}
              status={progress < 100 ? "En Route - Emergency" : "Arrived"}
            />

            <ETA
              eta={etaMinutes}
              distance={distanceKm}
              progressPercent={progress}
            />
            <Distance
              remainingDistanceKm={distanceKm}
              routeActive={progress < 100}
              progressPercent={progress}
            />

            {/* Trip Details */}
            <div className="bg-slate-50 rounded-2xl">
              <OngoingTripDetails role={user.role} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OngoingTrip;
