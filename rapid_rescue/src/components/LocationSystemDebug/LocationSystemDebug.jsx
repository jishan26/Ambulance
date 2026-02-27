import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "../Geolocation/Geolocation";
import { setUser } from "../../store/slices/user-slice";

const LocationSystemDebug = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [debugInfo, setDebugInfo] = useState({});
  const [manualLocation, setManualLocation] = useState(null);

  // Test location hook for riders
  const { coordinates, error, loading, updateLocation } = useLocation({
    trackPeriodically: false,
    isActive: true,
    id: user.id,
    onLocationUpdate: null, // No WebSocket updates for riders
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
        error,
        loading,
        hasCoordinates: !!coordinates,
        coordinatesLat: coordinates?.latitude,
        coordinatesLng: coordinates?.longitude,
      },
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
  }, [user, coordinates, error, loading]);

  const handleManualLocationUpdate = async () => {
    console.log("🔄 Manually updating location...");
    try {
      const result = await updateLocation();
      console.log("📍 Manual location update result:", result);
      setManualLocation(result);
    } catch (err) {
      console.error("❌ Manual location update error:", err);
    }
  };

  const simulateRiderLocation = () => {
    const mockCoords = {
      latitude: 23.789419,
      longitude: 90.446112,
    };

    console.log("🎭 Simulating rider location:", mockCoords);
    setManualLocation(mockCoords);

    // Update Redux store
    dispatch(
      setUser({
        latitude: mockCoords.latitude,
        longitude: mockCoords.longitude,
      })
    );
  };

  const clearLocation = () => {
    console.log("🗑️ Clearing location data...");
    setManualLocation(null);
    dispatch(
      setUser({
        latitude: 0,
        longitude: 0,
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Location System Debug
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
                <div>
                  <span className="font-medium">Loading:</span>{" "}
                  {loading ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-medium">Error:</span> {error || "None"}
                </div>
                <div>
                  <span className="font-medium">Has Coordinates:</span>{" "}
                  {coordinates ? "Yes" : "No"}
                </div>
                {coordinates && (
                  <>
                    <div>
                      <span className="font-medium">Latitude:</span>{" "}
                      {coordinates.latitude}
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span>{" "}
                      {coordinates.longitude}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Manual Location
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Set:</span>{" "}
                  {manualLocation ? "Yes" : "No"}
                </div>
                {manualLocation && (
                  <>
                    <div>
                      <span className="font-medium">Latitude:</span>{" "}
                      {manualLocation.latitude}
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span>{" "}
                      {manualLocation.longitude}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleManualLocationUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Update Location Manually
            </button>

            <button
              onClick={simulateRiderLocation}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🎭 Simulate Rider Location
            </button>

            <button
              onClick={clearLocation}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              🗑️ Clear Location
            </button>

            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              🔄 Reload Page
            </button>
          </div>
        </div>

        {/* Location Display Test */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Location Display Test</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Location Display */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Current Location Display
              </h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                {loading && (
                  <div className="text-blue-600 mb-2">
                    🔄 Getting location...
                  </div>
                )}

                {error && (
                  <div className="text-red-600 mb-2">❌ Error: {error}</div>
                )}

                {coordinates && (
                  <div className="text-green-600 mb-2">
                    ✅ Coordinates from useLocation:
                    <div className="mt-2 font-mono text-sm">
                      <div>Lat: {coordinates.latitude.toFixed(6)}</div>
                      <div>Lng: {coordinates.longitude.toFixed(6)}</div>
                    </div>
                  </div>
                )}

                {!coordinates && !loading && !error && (
                  <div className="text-yellow-600 mb-2">
                    ⚠️ No coordinates from useLocation hook
                  </div>
                )}
              </div>
            </div>

            {/* Redux Store Display */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Redux Store</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Latitude:</span>{" "}
                    {user.latitude || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Longitude:</span>{" "}
                    {user.longitude || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span>{" "}
                    {user.role || "N/A"}
                  </div>
                </div>
              </div>
            </div>
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

export default LocationSystemDebug;
