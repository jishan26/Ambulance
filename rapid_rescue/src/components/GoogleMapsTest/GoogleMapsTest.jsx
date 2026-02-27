import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from '../Geolocation/Geolocation';
import { getCurrentLocationAddress, searchNearbyHospitals, hasApiKeys } from '../../services/locationService';
import { MapPin, Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const GoogleMapsTest = () => {
  const user = useSelector((state) => state.user);
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [hospitals, setHospitals] = useState([]);

  // Get current location
  const { coordinates, error: locationError, loading: locationLoading } = useLocation({
    trackPeriodically: false,
    isActive: true,
    id: user.id,
    onLocationUpdate: null,
  });

  const testGoogleMapsAPI = async () => {
    setIsTesting(true);
    const results = {};

    try {
      console.log('🧪 Testing Google Maps API...');

      // Test 1: Check API key status
      const apiKeys = hasApiKeys();
      results.apiKeyStatus = apiKeys;
      console.log('✅ API Key Status:', apiKeys);

      // Test 2: Test reverse geocoding (coordinates to address)
      if (coordinates) {
        console.log('🔄 Testing reverse geocoding...');
        try {
          const address = await getCurrentLocationAddress(coordinates);
          results.reverseGeocoding = {
            success: true,
            address: address,
            coordinates: coordinates
          };
          setCurrentAddress(address);
          console.log('✅ Reverse geocoding successful:', address);
        } catch (error) {
          results.reverseGeocoding = {
            success: false,
            error: error.message
          };
          console.error('❌ Reverse geocoding failed:', error);
        }
      } else {
        results.reverseGeocoding = {
          success: false,
          error: 'No coordinates available'
        };
      }

      // Test 3: Test Places API (hospital search)
      if (coordinates) {
        console.log('🔄 Testing Places API...');
        try {
          const hospitalResults = await searchNearbyHospitals('hospital', coordinates);
          results.placesAPI = {
            success: true,
            hospitalsFound: hospitalResults.length,
            hospitals: hospitalResults.slice(0, 3) // Show first 3
          };
          setHospitals(hospitalResults);
          console.log('✅ Places API successful:', hospitalResults.length, 'hospitals found');
        } catch (error) {
          results.placesAPI = {
            success: false,
            error: error.message
          };
          console.error('❌ Places API failed:', error);
        }
      } else {
        results.placesAPI = {
          success: false,
          error: 'No coordinates available'
        };
      }

      // Test 4: Direct API call test
      try {
        console.log('🔄 Testing direct API call...');
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=23.7944,90.436&key=AIzaSyADSv601FKrwX9iKhAdpumh_0ZLhzWBALQ`
        );
        
        if (response.ok) {
          const data = await response.json();
          results.directAPICall = {
            success: true,
            status: data.status,
            results: data.results?.length || 0
          };
          console.log('✅ Direct API call successful:', data.status);
        } else {
          results.directAPICall = {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
          console.error('❌ Direct API call failed:', response.status);
        }
      } catch (error) {
        results.directAPICall = {
          success: false,
          error: error.message
        };
        console.error('❌ Direct API call error:', error);
      }

    } catch (error) {
      console.error('❌ Test suite error:', error);
      results.error = error.message;
    } finally {
      setIsTesting(false);
    }

    setTestResults(results);
  };

  useEffect(() => {
    // Auto-test when coordinates are available
    if (coordinates && !isTesting) {
      testGoogleMapsAPI();
    }
  }, [coordinates]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Google Maps API Test
        </h1>

        {/* API Key Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">API Key Status</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {testResults.apiKeyStatus?.googleMaps ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
              )}
              <span className="text-sm">Google Maps API Key</span>
            </div>
            <div className="text-xs text-gray-500">
              {testResults.apiKeyStatus?.googleMaps ? 'Configured' : 'Not configured'}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <button
            onClick={testGoogleMapsAPI}
            disabled={isTesting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isTesting ? 'Testing...' : 'Test Google Maps API'}
          </button>
        </div>

        {/* Current Location */}
        {coordinates && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-red-500" />
              Current Location
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 font-mono">
                <div>Latitude: {coordinates.latitude.toFixed(6)}</div>
                <div>Longitude: {coordinates.longitude.toFixed(6)}</div>
                {coordinates.accuracy && (
                  <div>Accuracy: ±{Math.round(coordinates.accuracy)}m</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            {/* Reverse Geocoding Results */}
            {testResults.reverseGeocoding && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Reverse Geocoding Test</h3>
                <div className={`p-4 rounded-lg ${testResults.reverseGeocoding.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {testResults.reverseGeocoding.success ? (
                    <div>
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-green-700 font-medium">Success</span>
                      </div>
                      <div className="text-sm text-green-600">
                        <div className="font-medium">Address:</div>
                        <div className="mt-1">{testResults.reverseGeocoding.address}</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center mb-2">
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-red-700 font-medium">Failed</span>
                      </div>
                      <div className="text-sm text-red-600">
                        Error: {testResults.reverseGeocoding.error}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Places API Results */}
            {testResults.placesAPI && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Places API Test</h3>
                <div className={`p-4 rounded-lg ${testResults.placesAPI.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {testResults.placesAPI.success ? (
                    <div>
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-green-700 font-medium">Success</span>
                      </div>
                      <div className="text-sm text-green-600">
                        <div>Found {testResults.placesAPI.hospitalsFound} hospitals</div>
                        {testResults.placesAPI.hospitals.length > 0 && (
                          <div className="mt-2">
                            <div className="font-medium">Sample hospitals:</div>
                            <ul className="mt-1 space-y-1">
                              {testResults.placesAPI.hospitals.map((hospital, index) => (
                                <li key={index} className="text-xs">• {hospital.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center mb-2">
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-red-700 font-medium">Failed</span>
                      </div>
                      <div className="text-sm text-red-600">
                        Error: {testResults.placesAPI.error}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Direct API Call Results */}
            {testResults.directAPICall && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Direct API Call Test</h3>
                <div className={`p-4 rounded-lg ${testResults.directAPICall.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {testResults.directAPICall.success ? (
                    <div>
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-green-700 font-medium">Success</span>
                      </div>
                      <div className="text-sm text-green-600">
                        <div>Status: {testResults.directAPICall.status}</div>
                        <div>Results: {testResults.directAPICall.results} found</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center mb-2">
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-red-700 font-medium">Failed</span>
                      </div>
                      <div className="text-sm text-red-600">
                        Error: {testResults.directAPICall.error}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Raw Results */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                View Raw Test Results
              </summary>
              <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Current Address Display */}
        {currentAddress && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Address</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-700">
                {currentAddress}
              </div>
            </div>
          </div>
        )}

        {/* Hospital Results */}
        {hospitals.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-500" />
              Found Hospitals
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {hospitals.slice(0, 5).map((hospital, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-gray-900 mb-1">
                    {hospital.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {hospital.address}
                  </div>
                  {hospital.rating > 0 && (
                    <div className="text-xs text-yellow-600 mt-1">
                      Rating: {hospital.rating.toFixed(1)} ⭐
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">What This Test Does:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• <strong>API Key Check:</strong> Verifies your Google Maps API key is configured</li>
            <li>• <strong>Reverse Geocoding:</strong> Converts your coordinates to a readable address</li>
            <li>• <strong>Places API:</strong> Searches for nearby hospitals using your location</li>
            <li>• <strong>Direct API Call:</strong> Tests the API key with a simple geocoding request</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsTest;
