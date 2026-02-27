import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from '../Geolocation/Geolocation';
import LiveLocationMap from '../Map/LiveLocationMap';
import CurrentLocationDisplay from '../CurrentLocationDisplay/CurrentLocationDisplay';
import { MapPin, Crosshair, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const RiderLocationTest = () => {
  const user = useSelector((state) => state.user);
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Get current location
  const { coordinates, error, loading, updateLocation } = useLocation({
    trackPeriodically: false,
    isActive: true,
    id: user.id,
    onLocationUpdate: null,
  });

  useEffect(() => {
    const info = {
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        latitude: user.latitude,
        longitude: user.longitude,
      },
      location: {
        coordinates,
        error,
        loading,
        hasCoordinates: !!coordinates,
        coordinatesLat: coordinates?.latitude,
        coordinatesLng: coordinates?.longitude,
      },
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
  }, [user, coordinates, error, loading]);

  const handleManualLocationUpdate = async () => {
    if (!user.id) {
      console.log('❌ No user ID available');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Manually updating location for rider...');
      const result = await updateLocation();
      console.log('📍 Manual location update result:', result);
    } catch (err) {
      console.error('❌ Manual location update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Rider Location Test
        </h1>

        {/* User Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">User Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Role:</span> {user.role || 'Not set'}
            </div>
            <div>
              <span className="font-medium">ID:</span> {user.id || 'Not set'}
            </div>
            <div>
              <span className="font-medium">Redux Lat:</span> {user.latitude || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Redux Lng:</span> {user.longitude || 'N/A'}
            </div>
          </div>
        </div>

        {/* Location Hook Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Location Hook Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">useLocation Hook</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="font-medium">Loading:</span>
                  {loading ? (
                    <CheckCircle className="w-4 h-4 text-blue-500 ml-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 ml-2" />
                  )}
                  <span className="ml-2">{loading ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Error:</span>
                  {error ? (
                    <XCircle className="w-4 h-4 text-red-500 ml-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                  )}
                  <span className="ml-2">{error || 'None'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Has Coordinates:</span>
                  {coordinates ? (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 ml-2" />
                  )}
                  <span className="ml-2">{coordinates ? 'Yes' : 'No'}</span>
                </div>
                {coordinates && (
                  <>
                    <div>
                      <span className="font-medium">Latitude:</span> {coordinates.latitude.toFixed(6)}
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span> {coordinates.longitude.toFixed(6)}
                    </div>
                    {coordinates.accuracy && (
                      <div>
                        <span className="font-medium">Accuracy:</span> ±{Math.round(coordinates.accuracy)}m
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Test Controls</h3>
              <div className="space-y-2">
                <button
                  onClick={handleManualLocationUpdate}
                  disabled={!user.id || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Crosshair className="w-4 h-4 mr-2" />
                  )}
                  Update Location
                </button>
                <p className="text-xs text-gray-500">
                  Click to manually trigger location detection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Location Display */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Location Display</h2>
          <CurrentLocationDisplay id={user.id} />
        </div>

        {/* Live Location Map */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Live Location Map</h2>
          <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <LiveLocationMap
              height="400px"
              title="Rider Location Test"
              trackPeriodically={false}
              showAccuracy={true}
              markerColor="#4CAF50"
              markerBorderColor="#2E7D32"
              id={user.id}
            />
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default RiderLocationTest;