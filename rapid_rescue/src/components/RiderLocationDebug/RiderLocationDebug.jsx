import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "../Geolocation/Geolocation";
import {
  getCurrentLocationAddress,
  getSimpleAddress,
} from "../../services/locationService";
import {
  MapPin,
  Crosshair,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const RiderLocationDebug = () => {
  const user = useSelector((state) => state.user);
  const [debugInfo, setDebugInfo] = useState({});
  const [currentAddress, setCurrentAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current location
  const {
    coordinates,
    error: locationError,
    loading: locationLoading,
  } = useLocation({
    trackPeriodically: false,
    isActive: true,
    id: user.id,
    onLocationUpdate: null,
  });

  useEffect(() => {
    const info = {
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        latitude: user.latitude,
        longitude: user.longitude,
      },
      location: {
        coordinates,
        error: locationError,
        loading: locationLoading,
        hasCoordinates: !!coordinates,
        coordinatesLat: coordinates?.latitude,
        coordinatesLng: coordinates?.longitude,
      },
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
  }, [user, coordinates, locationError, locationLoading]);

  const testLocationAddress = async () => {
    if (!coordinates) {
      setError("No coordinates available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔄 Testing location address for rider...");
      console.log("📍 Coordinates:", coordinates);

      // Test 1: Direct Google Maps API call
      console.log("🔄 Testing direct Google Maps API...");
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=AIzaSyADSv601FKrwX9iKhAdpumh_0ZLhzWBALQ`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Google Maps API response:", data);

        if (data.results && data.results.length > 0) {
          const address = data.results[0].formatted_address;
          setCurrentAddress(address);
          console.log("✅ Direct API address:", address);
        } else {
          throw new Error("No results from Google Maps API");
        }
      } else {
        throw new Error(
          `Google Maps API error: ${response.status} ${response.statusText}`
        );
      }
    } catch (err) {
      console.error("❌ Error testing location address:", err);
      setError(err.message);

      // Fallback to simple address
      const simpleAddress = getSimpleAddress(coordinates);
      setCurrentAddress(simpleAddress);
      console.log("📍 Fallback address:", simpleAddress);
    } finally {
      setIsLoading(false);
    }
  };

  const testLocationService = async () => {
    if (!coordinates) {
      setError("No coordinates available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔄 Testing location service...");
      const address = await getCurrentLocationAddress(coordinates);
      setCurrentAddress(address);
      console.log("✅ Location service address:", address);
    } catch (err) {
      console.error("❌ Location service error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setCurrentAddress("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Rider Location Debug
        </h1>

        {/* User Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">User Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Role:</span>{" "}
              {user.role || "Not set"}
            </div>
            <div>
              <span className="font-medium">ID:</span> {user.id || "Not set"}
            </div>
            <div>
              <span className="font-medium">Redux Lat:</span>{" "}
              {user.latitude || "N/A"}
            </div>
            <div>
              <span className="font-medium">Redux Lng:</span>{" "}
              {user.longitude || "N/A"}
            </div>
          </div>
        </div>

        {/* Location Hook Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Location Hook Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                useLocation Hook
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="font-medium">Loading:</span>
                  {locationLoading ? (
                    <CheckCircle className="w-4 h-4 text-blue-500 ml-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 ml-2" />
                  )}
                  <span className="ml-2">{locationLoading ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Error:</span>
                  {locationError ? (
                    <XCircle className="w-4 h-4 text-red-500 ml-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                  )}
                  <span className="ml-2">{locationError || "None"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Has Coordinates:</span>
                  {coordinates ? (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 ml-2" />
                  )}
                  <span className="ml-2">{coordinates ? "Yes" : "No"}</span>
                </div>
                {coordinates && (
                  <>
                    <div>
                      <span className="font-medium">Latitude:</span>{" "}
                      {coordinates.latitude.toFixed(6)}
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span>{" "}
                      {coordinates.longitude.toFixed(6)}
                    </div>
                    {coordinates.accuracy && (
                      <div>
                        <span className="font-medium">Accuracy:</span> ±
                        {Math.round(coordinates.accuracy)}m
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Current Address
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Address:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    {currentAddress || "Not set"}
                  </div>
                </div>
                {error && (
                  <div className="text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testLocationAddress}
              disabled={!coordinates || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4 mr-2" />
              )}
              Test Direct Google Maps API
            </button>

            <button
              onClick={testLocationService}
              disabled={!coordinates || isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Test Location Service
            </button>

            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default RiderLocationDebug;
