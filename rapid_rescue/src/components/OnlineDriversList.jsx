import React from "react";
import { useSelector } from "react-redux";
import { MapPin, Clock, User } from "lucide-react";

const OnlineDriversList = () => {
  const nearbyDrivers = useSelector((state) => state.nearbyDrivers);
  
  // Convert drivers object to array
  const driversArray = Object.values(nearbyDrivers.drivers || {});
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    // Simple distance calculation (not accurate for large distances)
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  if (driversArray.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <User className="w-5 h-5 mr-2 text-gray-600" />
          Online Drivers
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🚑</div>
          <p className="text-gray-500 text-sm">No drivers online</p>
          <p className="text-gray-400 text-xs mt-1">
            Drivers will appear here when they come online
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <User className="w-5 h-5 mr-2 text-green-600" />
        Online Drivers ({driversArray.length})
      </h3>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {driversArray.map((driver) => (
          <div
            key={driver.id}
            className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {driver.name?.charAt(0) || "D"}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">
                  {driver.name || `Driver ${driver.id}`}
                </p>
                <p className="text-xs text-blue-600 font-semibold">
                  ID: {driver.id}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>
                    {driver.latitude?.toFixed(4)}, {driver.longitude?.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatTimestamp(driver.timestamp)}</span>
              </div>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Online
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {nearbyDrivers.lastUpdated ? 
            new Date(nearbyDrivers.lastUpdated).toLocaleTimeString() : 
            "Never"
          }
        </p>
      </div>
    </div>
  );
};

export default OnlineDriversList;
