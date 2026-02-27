import React from "react";

const ETA = ({ eta, distance, progressPercent }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden relative">
      {/* Animated progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-red-600 animate-pulse"
          style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
        ></div>
      </div>

      {/* Content */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Icon */}
          <div className="bg-red-50 p-3 rounded-2xl shadow-sm">
            <div className="w-6 h-6 text-red-600 font-bold">⏱</div>
          </div>

          {/* Info */}
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Estimated Arrival
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-800">{eta}</span>
              <span className="text-sm text-gray-500">min</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Distance
          </span>
          <div className="flex items-baseline justify-end space-x-2">
            <span className="text-lg font-bold text-gray-800">{distance}</span>
            <span className="text-sm text-gray-500">km</span>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="px-5 pb-4 -mt-2">
        <div className="flex items-center justify-center bg-green-50 text-green-700 text-xs font-medium py-1.5 px-3 rounded-full ">
          <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          On optimal route • {Math.min(Math.max(progressPercent, 0), 100)}%
          complete
        </div>
      </div>
    </div>
  );
};

ETA.defaultProps = {
  eta: "12",
  distance: "5.2",
  progressPercent: 85,
};

export default ETA;
