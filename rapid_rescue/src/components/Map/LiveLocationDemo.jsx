import React, { useState } from "react";
import LiveLocationMap from "./LiveLocationMap";

const LiveLocationDemo = () => {
  const [isTracking, setIsTracking] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(5000);
  const [showAccuracy, setShowAccuracy] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Live Location Tracking Demo
          </h1>
          <p className="text-gray-600 text-lg">
            Real-time GPS tracking with WebSocket integration
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tracking Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Status
              </label>
              <button
                onClick={() => setIsTracking(!isTracking)}
                className={`px-4 py-2 rounded-md font-medium ${
                  isTracking
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {isTracking ? "Stop Tracking" : "Start Tracking"}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Interval: {updateInterval / 1000}s
              </label>
              <input
                type="range"
                min="1000"
                max="30000"
                step="1000"
                value={updateInterval}
                onChange={(e) => setUpdateInterval(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Show Accuracy Circle
              </label>
              <button
                onClick={() => setShowAccuracy(!showAccuracy)}
                className={`px-4 py-2 rounded-md font-medium ${
                  showAccuracy
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                {showAccuracy ? "Hide" : "Show"} Accuracy
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Live Location Map</h2>
          <LiveLocationMap
            height="600px"
            title="Your Live Location"
            trackPeriodically={isTracking}
            updateInterval={updateInterval}
            showAccuracy={showAccuracy}
            markerColor="#3B82F6"
            markerBorderColor="#1E40AF"
          />
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Real-time Updates</h3>
            </div>
            <p className="text-gray-600">
              Automatically updates your location every few seconds with high
              accuracy GPS tracking.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">WebSocket Integration</h3>
            </div>
            <p className="text-gray-600">
              Sends location updates to the server in real-time via WebSocket
              for live tracking.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Accuracy Visualization</h3>
            </div>
            <p className="text-gray-600">
              Shows GPS accuracy circle to visualize the precision of your
              current location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveLocationDemo;
