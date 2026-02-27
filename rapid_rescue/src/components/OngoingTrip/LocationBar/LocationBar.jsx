import PropTypes from "prop-types";
import { Stethoscope, MapPin, Navigation } from "lucide-react";

const LocationBar = ({ pickup_location, destination, status }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
      {/* Left Section */}
      <div className="flex flex-1 items-center gap-6 min-w-0">
        {" "}
        {/* 👈 added min-w-0 */}
        {/* Status */}
        <div className="flex items-center space-x-3">
          <div className="bg-red-50 p-2.5 rounded-xl shadow-sm">
            <Stethoscope className="w-6 h-6 text-red-600 stroke-[2]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Current Status</p>
            <div className="flex items-center mt-1">
              <span className="text-base font-semibold text-gray-800">
                {status}
              </span>
              <div className="ml-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        {/* Route */}
        <div className="flex items-center space-x-3 min-w-0">
          {" "}
          {/* 👈 added min-w-0 */}
          <div className="bg-blue-50 p-2.5 rounded-xl shadow-sm">
            <Navigation className="w-6 h-6 text-blue-600 stroke-[2]" />
          </div>
          <div className="min-w-0">
            {" "}
            {/* 👈 added min-w-0 */}
            <p className="text-xs text-gray-500 font-medium">Emergency Route</p>
            <div className="text-sm font-medium text-gray-800 flex items-center min-w-0">
              <span className="truncate block min-w-0">{pickup_location}</span>{" "}
              {/* 👈 truncate works now */}
              <span className="mx-2 text-red-500">→</span>
              <span className="truncate block min-w-0">{destination}</span>{" "}
              {/* 👈 truncate works now */}
            </div>
          </div>
        </div>
      </div>

      {/* Button */}
      
    </div>
  );
};

LocationBar.propTypes = {
  pickup_location: PropTypes.string.isRequired,
  destination: PropTypes.string.isRequired,
  status: PropTypes.string,
};

export default LocationBar;
