import React from 'react';
import { MapPin, Loader2, AlertCircle, Copy, ExternalLink } from 'lucide-react';

const HospitalSuggestionDropdown = ({ 
  hospitals, 
  loading, 
  error, 
  onSelectHospital, 
  isVisible 
}) => {
  if (!isVisible) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Coordinates copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const openInOpenStreetMap = (lat, lng) => {
    const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=18`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin text-red-500 mr-2" />
          <span className="text-gray-600">Searching hospitals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-red-200 rounded-lg shadow-lg">
        <div className="flex items-center p-4 text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Error searching hospitals: {error}</span>
        </div>
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="p-4 text-gray-500 text-center">
          No hospitals found. Try a different search term.
        </div>
      </div>
    );
  }

  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {hospitals.map((hospital) => (
        <div
          key={hospital.id}
          onClick={() => onSelectHospital(hospital)}
          className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                <h4 className="font-semibold text-gray-900 text-sm">
                  {hospital.name}
                </h4>
              </div>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {hospital.fullAddress}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Lat: {hospital.latitude.toFixed(6)}</span>
                <span>Lng: {hospital.longitude.toFixed(6)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(`${hospital.latitude}, ${hospital.longitude}`);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Copy coordinates"
              >
                <Copy className="w-3 h-3 text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openInOpenStreetMap(hospital.latitude, hospital.longitude);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="View on OpenStreetMap"
              >
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HospitalSuggestionDropdown;
