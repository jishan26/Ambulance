import React from "react";
import LocationPointerMap from "../../../Map/LocationPointMap";
import LiveLocationMap from "../../../Map/LiveLocationMap";
import RouteMap from "../../../Map/RouteMap";

const MapComponent = ({ isCheckedOut }) => (
  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200/50">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
      <div>
        <h3 className="text-xl font-semibold text-slate-800">
          {isCheckedOut ? "Active Route" : "Current Location"}
        </h3>
        <p className="text-sm text-slate-500">Real-time tracking</p>
      </div>
    </div>

    {/* Interactive Map */}
    <div className="rounded-xl overflow-hidden border border-slate-200">
      {isCheckedOut ? (
        <RouteMap height="420px" />
      ) : (
        <LiveLocationMap
          height="420px"
          title="Your Live Location (Driver)"
          trackPeriodically={true}
          updateInterval={5000}
          showAccuracy={true}
          markerColor="#FF6B35"
          markerBorderColor="#E55A2B"
        />
      )}
    </div>
  </div>
);

export default MapComponent;
