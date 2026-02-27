import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "../Geolocation/Geolocation";
import {
  getCurrentLocationAddress,
  searchNearbyHospitals,
  getSimpleAddress,
  hasApiKeys,
} from "../../services/locationService";
import {
  MapPin,
  Building2,
  Search,
  Crosshair,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

const LocationFeaturesDemo = () => {
  const user = useSelector((state) => state.user);
  const [currentAddress, setCurrentAddress] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [apiKeysStatus, setApiKeysStatus] = useState({});

  // Get current location
  const {
    coordinates,
    error: locationError,
    loading: locationLoading,
  } = useLocation({
    trackPeriodically: false,
    isActive: true,
    id: user.id,
    onLocationUpdate: null,
  });

  useEffect(() => {
    setApiKeysStatus(hasApiKeys());
  }, []);

  const handleGetCurrentAddress = async () => {
    if (!coordinates) return;

    setIsLoadingAddress(true);
    try {
      const address = await getCurrentLocationAddress(coordinates);
      setCurrentAddress(address);
      console.log("📍 Current address:", address);
    } catch (error) {
      console.error("❌ Error getting address:", error);
      const simpleAddress = getSimpleAddress(coordinates);
      setCurrentAddress(simpleAddress);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleSearchHospitals = async () => {
    if (!coordinates || !searchQuery.trim()) return;

    setIsLoadingHospitals(true);
    try {
      const results = await searchNearbyHospitals(searchQuery, coordinates);
      setHospitals(results);
      console.log("🏥 Found hospitals:", results);
    } catch (error) {
      console.error("❌ Error searching hospitals:", error);
      setHospitals([]);
    } finally {
      setIsLoadingHospitals(false);
    }
  };

  const clearResults = () => {
    setCurrentAddress("");
    setHospitals([]);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Location Features Demo
        </h1>

        {/* API Keys Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">API Keys Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              {apiKeysStatus.googleMaps ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
              )}
              <span className="text-sm">Google Maps API</span>
            </div>
            <div className="flex items-center">
              {apiKeysStatus.openCage ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
              )}
              <span className="text-sm">OpenCage API</span>
            </div>
            <div className="flex items-center">
              {apiKeysStatus.mapbox ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
              )}
              <span className="text-sm">Mapbox API</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {Object.values(apiKeysStatus).some((status) => status)
              ? "Some APIs are configured - enhanced features available"
              : "No APIs configured - using fallback data only"}
          </p>
        </div>

        {/* Current Location Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-red-500" />
            Current Location Address
          </h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location (Auto-filled)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder="Current location will appear here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isLoadingAddress ? (
                      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    ) : (
                      <button
                        onClick={handleGetCurrentAddress}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        title="Get current location address"
                      >
                        <Crosshair className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {coordinates && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">
                  Current Coordinates:
                </h3>
                <div className="text-sm text-gray-600 font-mono">
                  <div>Latitude: {coordinates.latitude.toFixed(6)}</div>
                  <div>Longitude: {coordinates.longitude.toFixed(6)}</div>
                  {coordinates.accuracy && (
                    <div>Accuracy: ±{Math.round(coordinates.accuracy)}m</div>
                  )}
                </div>
              </div>
            )}

            {locationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
                <p className="text-sm">Location Error: {locationError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Hospital Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-500" />
            Hospital Search
          </h2>

          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for hospitals (e.g., 'hospital', 'medical', 'emergency')"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSearchHospitals}
                disabled={!searchQuery.trim() || isLoadingHospitals}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoadingHospitals ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search
              </button>
              <button
                onClick={clearResults}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Clear
              </button>
            </div>

            {/* Hospital Results */}
            {hospitals.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-3">
                  Found {hospitals.length} hospitals:
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {hospitals.map((hospital, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {hospital.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {hospital.address}
                          </p>
                          {hospital.distance && (
                            <p className="text-xs text-gray-500">
                              Distance: {hospital.distance.toFixed(1)} km
                            </p>
                          )}
                        </div>
                        {hospital.rating > 0 && (
                          <div className="flex items-center ml-4">
                            <span className="text-yellow-500 text-sm">★</span>
                            <span className="text-sm text-gray-600 ml-1">
                              {hospital.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && hospitals.length === 0 && !isLoadingHospitals && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hospitals found for "{searchQuery}"</p>
                <p className="text-sm">
                  Try searching for "hospital", "medical", or "emergency"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">How to Use:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>
              • <strong>Current Location:</strong> Click the crosshair icon to
              get your current address
            </li>
            <li>
              • <strong>Hospital Search:</strong> Type keywords like "hospital",
              "medical", or "emergency" to find nearby hospitals
            </li>
            <li>
              • <strong>API Keys:</strong> Configure API keys in the config file
              for enhanced features
            </li>
            <li>
              • <strong>Fallback Mode:</strong> Works without API keys using
              local hospital data
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationFeaturesDemo;
