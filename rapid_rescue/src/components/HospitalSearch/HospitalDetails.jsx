import React from 'react';
import { MapPin, Copy, ExternalLink, CheckCircle } from 'lucide-react';

const HospitalDetails = ({ hospital, onClear }) => {
  if (!hospital) return null;

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

  return (
    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          <h3 className="font-semibold text-green-800">Selected Hospital</h3>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Change
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-gray-900 text-sm mb-1">
            {hospital.name}
          </h4>
          <p className="text-xs text-gray-600 line-clamp-2">
            {hospital.fullAddress}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Latitude
            </label>
            <div className="flex items-center">
              <span className="text-sm font-mono text-gray-700">
                {hospital.latitude.toFixed(6)}
              </span>
              <button
                onClick={() => copyToClipboard(hospital.latitude.toString())}
                className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                title="Copy latitude"
              >
                <Copy className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Longitude
            </label>
            <div className="flex items-center">
              <span className="text-sm font-mono text-gray-700">
                {hospital.longitude.toFixed(6)}
              </span>
              <button
                onClick={() => copyToClipboard(hospital.longitude.toString())}
                className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                title="Copy longitude"
              >
                <Copy className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 pt-2 border-t border-green-200">
          <button
            onClick={() => copyToClipboard(`${hospital.latitude}, ${hospital.longitude}`)}
            className="flex items-center px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded transition-colors"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy Coordinates
          </button>
          <button
            onClick={() => openInOpenStreetMap(hospital.latitude, hospital.longitude)}
            className="flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View on Map
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalDetails;
