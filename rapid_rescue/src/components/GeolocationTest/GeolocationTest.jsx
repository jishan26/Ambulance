import React, { useState, useEffect } from "react";
import {
  MapPin,
  Crosshair,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const GeolocationTest = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("unknown");
  const [testResults, setTestResults] = useState([]);

  // Check geolocation permission status
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermissionStatus(result.state);
        console.log("📍 Geolocation permission status:", result.state);
      });
    }
  }, []);

  const testGeolocation = async () => {
    setLoading(true);
    setError(null);
    setCoordinates(null);

    const testId = Date.now();
    const startTime = new Date();

    console.log(`🔄 Starting geolocation test ${testId}...`);

    try {
      // Test 1: Basic geolocation
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log("✅ Geolocation success:", pos);
            resolve(pos);
          },
          (err) => {
            console.error("❌ Geolocation error:", err);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0, // Force fresh location
          }
        );
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      setCoordinates(coords);

      const endTime = new Date();
      const duration = endTime - startTime;

      const result = {
        testId,
        success: true,
        coordinates: coords,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        permissionStatus,
      };

      setTestResults((prev) => [result, ...prev.slice(0, 4)]); // Keep last 5 results

      console.log("✅ Geolocation test completed:", result);
    } catch (err) {
      const endTime = new Date();
      const duration = endTime - startTime;

      setError(err.message);

      const result = {
        testId,
        success: false,
        error: err.message,
        errorCode: err.code,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        permissionStatus,
      };

      setTestResults((prev) => [result, ...prev.slice(0, 4)]);

      console.error("❌ Geolocation test failed:", result);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setCoordinates(null);
    setError(null);
  };

  const getLocationFromIP = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      console.log("🌐 IP-based location:", data);
      return data;
    } catch (err) {
      console.error("❌ IP location failed:", err);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Geolocation API Test
        </h1>

        {/* Permission Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Permission Status</h2>
          <div className="flex items-center">
            <span className="font-medium mr-2">Geolocation Permission:</span>
            {permissionStatus === "granted" ? (
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            ) : permissionStatus === "denied" ? (
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            )}
            <span
              className={`font-semibold ${
                permissionStatus === "granted"
                  ? "text-green-600"
                  : permissionStatus === "denied"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {permissionStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testGeolocation}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Crosshair className="w-5 h-5 mr-2" />
              )}
              Test Geolocation API
            </button>

            <button
              onClick={getLocationFromIP}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Test IP Location
            </button>

            <button
              onClick={clearResults}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Clear Results
            </button>
          </div>
        </div>

        {/* Current Result */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Result</h2>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
              <span className="text-lg">Getting location...</span>
            </div>
          )}

          {coordinates && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    {new Date(coordinates.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {coordinates.latitude === 52.132633 &&
                coordinates.longitude === 5.291266 && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="font-semibold text-yellow-800">
                        Warning: These coordinates appear to be cached or
                        incorrect
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">
                      The coordinates 52.132633, 5.291266 suggest this might be
                      cached location data or a default location from your
                      browser/device.
                    </p>
                  </div>
                )}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-semibold text-red-800">Error:</span>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          )}
        </div>

        {/* Test History */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Test History</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={result.testId}
                  className={`border rounded-lg p-4 ${
                    result.success
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <span className="font-medium">
                        Test #{result.testId} -{" "}
                        {result.success ? "Success" : "Failed"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {result.duration}
                    </span>
                  </div>

                  {result.success ? (
                    <div className="mt-2 text-sm">
                      <div>
                        Coordinates: {result.coordinates.latitude.toFixed(6)},{" "}
                        {result.coordinates.longitude.toFixed(6)}
                      </div>
                      <div>
                        Accuracy: ±{Math.round(result.coordinates.accuracy)}m
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {result.error} (Code: {result.errorCode})
                    </div>
                  )}

                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeolocationTest;
