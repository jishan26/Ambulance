import React, { useState, useEffect } from 'react';
import { useLocation } from '../Geolocation/Geolocation';
import { useSelector } from 'react-redux';
import { MapPin, Navigation, User, Car } from 'lucide-react';

const CurrentLocationDisplay = ({ id, onLocationUpdate }) => {
  const user = useSelector((state) => state.user);
  const { coordinates, loading, error, currentLocationDisplay } = useLocation({
    trackPeriodically: false,
    isActive: true,
    id,
    onLocationUpdate,
  });

  const getUserRoleInfo = () => {
    if (user.role === 'driver') {
      return {
        icon: <Car className="w-5 h-5" />,
        title: "Driver Location",
        description: "Your current driver location",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-400",
        textColor: "text-blue-700",
        iconBg: "bg-blue-500"
      };
    } else if (user.role === 'rider') {
      return {
        icon: <User className="w-5 h-5" />,
        title: "Rider Location", 
        description: "Your current rider location",
        bgColor: "bg-green-100",
        borderColor: "border-green-400",
        textColor: "text-green-700",
        iconBg: "bg-green-500"
      };
    } else {
      return {
        icon: <MapPin className="w-5 h-5" />,
        title: "Current Location",
        description: "Your current location",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-400",
        textColor: "text-gray-700",
        iconBg: "bg-gray-500"
      };
    }
  };

  const roleInfo = getUserRoleInfo();

  if (loading) {
    return (
      <div className={`${roleInfo.bgColor} ${roleInfo.borderColor} border-2 rounded-lg px-4 py-3 flex items-center`}>
        <div className={`${roleInfo.iconBg} text-white p-2 rounded-full mr-3`}>
          {roleInfo.icon}
        </div>
        <div>
          <p className={`font-semibold ${roleInfo.textColor}`}>
            {roleInfo.title}
          </p>
          <p className="text-sm text-gray-500">
            Getting your location...
          </p>
        </div>
        <div className="ml-auto">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${roleInfo.bgColor} ${roleInfo.borderColor} border-2 rounded-lg px-4 py-3 flex items-center`}>
        <div className={`${roleInfo.iconBg} text-white p-2 rounded-full mr-3`}>
          {roleInfo.icon}
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${roleInfo.textColor}`}>
            {roleInfo.title}
          </p>
          <p className="text-sm text-red-600">
            Location error: {error}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Using fallback location
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${roleInfo.bgColor} ${roleInfo.borderColor} border-2 rounded-lg px-4 py-3`}>
      <div className="flex items-center mb-2">
        <div className={`${roleInfo.iconBg} text-white p-2 rounded-full mr-3`}>
          {roleInfo.icon}
        </div>
        <div>
          <p className={`font-semibold ${roleInfo.textColor}`}>
            {roleInfo.title}
          </p>
          <p className="text-sm text-gray-600">
            {roleInfo.description}
          </p>
        </div>
      </div>
      
      {coordinates && (
        <div className="ml-12 space-y-1">
          <div className="flex items-center text-sm">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            <span className="font-mono text-gray-700">
              {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Latitude:</span>
              <br />
              <span className="font-mono">{coordinates.latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="font-medium">Longitude:</span>
              <br />
              <span className="font-mono">{coordinates.longitude.toFixed(6)}</span>
            </div>
          </div>
          {user.role && (
            <div className="text-xs text-gray-500 mt-2 flex items-center">
              <Navigation className="w-3 h-3 mr-1" />
              Logged in as: <span className="font-medium ml-1 capitalize">{user.role}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CurrentLocationDisplay;