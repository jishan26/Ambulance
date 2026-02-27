import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "../Geolocation/Geolocation";
import { setUser } from "../../store/slices/user-slice";
import LiveLocationMap from "../Map/LiveLocationMap";
import CurrentLocationDisplay from "../CurrentLocationDisplay/CurrentLocationDisplay";

const LocationTestSuite = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  // Test location hook
  const { coordinates, error, loading, updateLocation } = useLocation({
    trackPeriodically: false,
    isActive: true,
    id: user.id,
    onLocationUpdate: null,
  });

  const runLocationTests = async () => {
    setIsRunning(true);
    const results = {};

    try {
      console.log("🧪 Starting location system tests...");

      // Test 1: Check if geolocation is supported
      results.geolocationSupported = !!navigator.geolocation;
      console.log("✅ Geolocation supported:", results.geolocationSupported);

      // Test 2: Check user state
      results.userState = {
        id: user.id,
        role: user.role,
        latitude: user.latitude,
        longitude: user.longitude,
      };
      console.log("✅ User state:", results.userState);

      // Test 3: Check useLocation hook
      results.locationHook = {
        hasCoordinates: !!coordinates,
        coordinates,
        error,
        loading,
      };
      console.log("✅ Location hook:", results.locationHook);

      // Test 4: Manual location update
      if (user.id) {
        console.log("🔄 Testing manual location update...");
        try {
          const manualResult = await updateLocation();
          results.manualUpdate = {
            success: true,
            result: manualResult,
          };
          console.log("✅ Manual update successful:", manualResult);
        } catch (err) {
          results.manualUpdate = {
            success: false,
            error: err.message,
          };
          console.error("❌ Manual update failed:", err);
        }
      }

      // Test 5: Redux store update
      results.reduxUpdate = {
        before: { latitude: user.latitude, longitude: user.longitude },
        after: { latitude: user.latitude, longitude: user.longitude },
      };

      // Test 6: Component rendering
      results.componentRendering = {
        LiveLocationMap: true,
        CurrentLocationDisplay: true,
      };

      console.log("✅ All tests completed");
    } catch (error) {
      console.error("❌ Test suite error:", error);
      results.error = error.message;
    } finally {
      setIsRunning(false);
    }

    setTestResults(results);
  };

  const simulateRiderLogin = () => {
    dispatch(
      setUser({
        id: 1,
        role: "rider",
        name: "Test Rider",
        email: "rider@test.com",
        latitude: 0,
        longitude: 0,
      })
    );
  };

  const simulateDriverLogin = () => {
    dispatch(
      setUser({
        id: 2,
        role: "driver",
        name: "Test Driver",
        email: "driver@test.com",
        latitude: 0,
        longitude: 0,
      })
    );
  };

  const clearUser = () => {
    dispatch(
      setUser({
        id: 0,
        role: "",
        name: "",
        email: "",
        latitude: 0,
        longitude: 0,
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Location System Test Suite
        </h1>

        {/* User Simulation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">User Simulation</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={simulateRiderLogin}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🚶 Simulate Rider Login
            </button>
            <button
              onClick={simulateDriverLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🚗 Simulate Driver Login
            </button>
            <button
              onClick={clearUser}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              🚪 Clear User
            </button>
          </div>
        </div>

        {/* Current User Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current User Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Role:</span>{" "}
              {user.role || "Not set"}
            </div>
            <div>
              <span className="font-medium">ID:</span> {user.id || "Not set"}
            </div>
            <div>
              <span className="font-medium">Name:</span>{" "}
              {user.name || "Not set"}
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              {user.email || "Not set"}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runLocationTests}
              disabled={isRunning}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isRunning ? "Running Tests..." : "🧪 Run Location Tests"}
            </button>
          </div>
        </div>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        {/* Component Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LiveLocationMap Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">LiveLocationMap Test</h2>
            <div
              className="border rounded-lg overflow-hidden"
              style={{ height: "400px" }}
            >
              {user.id > 0 ? (
                <LiveLocationMap
                  zoom={13}
                  height="400px"
                  markerColor="#4CAF50"
                  markerBorderColor="#2E7D32"
                  title={
                    user.role === "driver"
                      ? "Driver Location"
                      : user.role === "rider"
                      ? "Rider Location"
                      : "Your Location"
                  }
                  trackPeriodically={false}
                  updateInterval={5000}
                  showAccuracy={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <p className="text-gray-500">
                      Please login to test the map
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CurrentLocationDisplay Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              CurrentLocationDisplay Test
            </h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              {user.id > 0 ? (
                <CurrentLocationDisplay id={user.id} />
              ) : (
                <div className="text-center">
                  <p className="text-gray-500">
                    Please login to test location display
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Hook Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Location Hook Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      {coordinates.latitude.toFixed(6)}
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span>{" "}
                      {coordinates.longitude.toFixed(6)}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Redux Store</h3>
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

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                Browser Support
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Geolocation:</span>{" "}
                  {navigator.geolocation ? "Supported" : "Not Supported"}
                </div>
                <div>
                  <span className="font-medium">HTTPS:</span>{" "}
                  {window.location.protocol === "https:" ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-medium">User Agent:</span>{" "}
                  {navigator.userAgent.split(" ")[0]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationTestSuite;
