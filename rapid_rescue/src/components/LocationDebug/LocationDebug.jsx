import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "../Geolocation/Geolocation";

const LocationDebug = () => {
  const user = useSelector((state) => state.user);
  const [debugInfo, setDebugInfo] = useState({});

  const { coordinates, error, loading, updateLocation } = useLocation({
    trackPeriodically: false,
    isActive: true,
    id: user.id,
    onLocationUpdate: null, // Same as riders
  });

  useEffect(() => {
    setDebugInfo({
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
    });
  }, [user, coordinates, error, loading]);

  const handleUpdateLocation = async () => {
    console.log("🔄 Manually updating location...");
    try {
      const result = await updateLocation();
      console.log("📍 Location update result:", result);
    } catch (err) {
      console.error("❌ Location update error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Location Debug - Rider Issue
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">User State</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.user, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Location State
              </h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.location, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleUpdateLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Location Manually
            </button>

            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Reload Page
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Location Display Test</h2>

          {loading && (
            <div className="text-blue-600 mb-4">🔄 Getting location...</div>
          )}

          {error && <div className="text-red-600 mb-4">❌ Error: {error}</div>}

          {coordinates && (
            <div className="text-green-600 mb-4">
              ✅ Coordinates received:
              <div className="mt-2 font-mono text-sm">
                <div>Latitude: {coordinates.latitude.toFixed(6)}</div>
                <div>Longitude: {coordinates.longitude.toFixed(6)}</div>
                {coordinates.accuracy && (
                  <div>Accuracy: ±{Math.round(coordinates.accuracy)}m</div>
                )}
              </div>
            </div>
          )}

          {!coordinates && !loading && !error && (
            <div className="text-yellow-600 mb-4">
              ⚠️ No coordinates available
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">
            Troubleshooting Steps:
          </h3>
          <ol className="text-sm text-yellow-800 space-y-1">
            <li>1. Check if you're logged in as a rider</li>
            <li>2. Allow location access when prompted</li>
            <li>3. Check browser console for any errors</li>
            <li>4. Try the "Update Location Manually" button</li>
            <li>5. Check if coordinates appear in the debug info above</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LocationDebug;
