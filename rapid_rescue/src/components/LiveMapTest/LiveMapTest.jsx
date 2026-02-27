import React from "react";
import { useSelector } from "react-redux";
import LiveLocationMap from "../Map/LiveLocationMap";
import CurrentLocationDisplay from "../CurrentLocationDisplay/CurrentLocationDisplay";

const LiveMapTest = () => {
  const user = useSelector((state) => state.user);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Live Tracking Map Test
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">User ID:</span>{" "}
              {user.id || "Not logged in"}
            </div>
            <div>
              <span className="font-medium">Role:</span>{" "}
              {user.role || "Not set"}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Map */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Live Tracking Map</h2>
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
                  trackPeriodically={true}
                  updateInterval={5000}
                  showAccuracy={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium mb-2">
                      Live GPS Tracking Map
                    </p>
                    <p className="text-sm text-gray-400">
                      Please login to view live location tracking
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Location Information</h2>
            <CurrentLocationDisplay id={user.id} />

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Map Features:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Real-time GPS tracking</li>
                <li>• Interactive map with zoom/pan</li>
                <li>• Location accuracy circle</li>
                <li>• Periodic location updates</li>
                <li>• Role-based marker styling</li>
                <li>• Live location sharing via WebSocket</li>
              </ul>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">
                Testing Instructions:
              </h3>
              <ol className="text-sm text-yellow-800 space-y-1">
                <li>1. Login as a rider or driver</li>
                <li>2. Allow location access when prompted</li>
                <li>3. Watch the map update with your location</li>
                <li>4. Check the Homepage for the integrated map</li>
                <li>5. Test the "View on Map" button functionality</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMapTest;
