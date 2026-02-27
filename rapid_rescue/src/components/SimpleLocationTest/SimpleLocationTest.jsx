import React, { useState } from "react";
import { Crosshair, Loader2, CheckCircle, XCircle } from "lucide-react";

const SimpleLocationTest = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testLocation = () => {
    setLoading(true);
    setError(null);
    setCoordinates(null);

    console.log("🔄 Testing browser geolocation directly...");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        console.log("📍 Direct geolocation result:", coords);
        setCoordinates(coords);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Direct geolocation error:", error);
        setError(`Error: ${error.message} (Code: ${error.code})`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Force fresh location
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Simple Location Test
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Direct Browser Geolocation Test
          </h2>

          <button
            onClick={testLocation}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center mb-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Crosshair className="w-5 h-5 mr-2" />
            )}
            Test Location
          </button>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
              <span className="text-lg">Getting location...</span>
            </div>
          )}

          {coordinates && (
            <div className="space-y-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="font-semibold text-green-800">
                  Location Retrieved Successfully
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Latitude:</span>
                  <div className="text-lg font-mono">
                    {coordinates.latitude.toFixed(6)}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Longitude:</span>
                  <div className="text-lg font-mono">
                    {coordinates.longitude.toFixed(6)}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Accuracy:</span>
                  <div className="text-lg">
                    ±{Math.round(coordinates.accuracy)}m
                  </div>
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span>
                  <div className="text-sm">
                    {new Date(coordinates.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              {coordinates.latitude === 52.132633 &&
                coordinates.longitude === 5.291266 && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                    <div className="font-semibold text-yellow-800 mb-2">
                      ⚠️ Warning: These coordinates appear to be cached or
                      incorrect
                    </div>
                    <p className="text-sm text-yellow-700">
                      The coordinates 52.132633, 5.291266 suggest this might be:
                    </p>
                    <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                      <li>Cached location data from your browser</li>
                      <li>Default location from your device/network</li>
                      <li>VPN or proxy location</li>
                      <li>Incorrect GPS data</li>
                    </ul>
                    <p className="text-sm text-yellow-700 mt-2">
                      Try refreshing the page or clearing your browser cache.
                    </p>
                  </div>
                )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="font-semibold text-blue-800 mb-2">
                  Debug Information
                </div>
                <pre className="text-xs text-blue-700 overflow-auto">
                  {JSON.stringify(coordinates, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-semibold text-red-800">Error</span>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Make sure location permissions are granted for this website</li>
            <li>Try refreshing the page and testing again</li>
            <li>
              Check if you're using a VPN or proxy that might affect location
            </li>
            <li>Try opening the page in an incognito/private window</li>
            <li>Check your device's location settings</li>
            <li>Try a different browser</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SimpleLocationTest;
