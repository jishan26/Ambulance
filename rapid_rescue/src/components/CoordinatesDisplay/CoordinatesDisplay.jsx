import React from 'react';
import { MapPin, Navigation, Target } from 'lucide-react';

const CoordinatesDisplay = ({ 
  coordinates, 
  title = "Coordinates", 
  color = "blue", 
  showAccuracy = true,
  showDistance = false,
  distance = 0 
}) => {
  if (!coordinates || (!coordinates.latitude && !coordinates.lat)) {
    return null;
  }

  // Handle both formats: {latitude, longitude} and {lat, lng}
  const lat = coordinates.latitude || coordinates.lat;
  const lng = coordinates.longitude || coordinates.lng;
  const accuracy = coordinates.accuracy;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      label: 'text-blue-700',
      value: 'text-blue-900'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      label: 'text-green-700',
      value: 'text-green-900'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      label: 'text-red-700',
      value: 'text-red-900'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      title: 'text-purple-800',
      label: 'text-purple-700',
      value: 'text-purple-900'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`mt-3 p-4 ${colors.bg} border ${colors.border} rounded-lg`}>
      <div className="flex items-center mb-3">
        <MapPin className={`w-5 h-5 ${colors.icon} mr-2`} />
        <span className={`text-sm font-semibold ${colors.title}`}>{title}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex items-center mb-1">
            <Navigation className={`w-3 h-3 ${colors.icon} mr-1`} />
            <span className={`font-medium ${colors.label}`}>Latitude:</span>
          </div>
          <div className={`font-mono text-lg ${colors.value}`}>
            {lat.toFixed(6)}
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-1">
            <Target className={`w-3 h-3 ${colors.icon} mr-1`} />
            <span className={`font-medium ${colors.label}`}>Longitude:</span>
          </div>
          <div className={`font-mono text-lg ${colors.value}`}>
            {lng.toFixed(6)}
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-xs">
        {showAccuracy && accuracy && (
          <div className={`${colors.label}`}>
            Accuracy: ±{Math.round(accuracy)}m
          </div>
        )}
        
        {showDistance && distance > 0 && (
          <div className={`${colors.label}`}>
            Distance: {distance.toFixed(1)} km
          </div>
        )}
      </div>
      
      {/* Copy to clipboard button */}
      <div className="mt-3">
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            // You could add a toast notification here
          }}
          className={`text-xs px-3 py-1 rounded ${colors.icon} hover:bg-white hover:bg-opacity-50 transition-colors`}
          title="Copy coordinates to clipboard"
        >
          Copy Coordinates
        </button>
      </div>
    </div>
  );
};

export default CoordinatesDisplay;
