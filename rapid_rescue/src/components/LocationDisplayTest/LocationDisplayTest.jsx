import React from 'react';
import { useSelector } from 'react-redux';
import CurrentLocationDisplay from '../CurrentLocationDisplay/CurrentLocationDisplay';

const LocationDisplayTest = () => {
  const user = useSelector((state) => state.user);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Location Display Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">User ID:</span> {user.id || 'Not logged in'}
            </div>
            <div>
              <span className="font-medium">Role:</span> {user.role || 'Not set'}
            </div>
            <div>
              <span className="font-medium">Name:</span> {user.name || 'Not set'}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email || 'Not set'}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Current Location Display</h2>
            <CurrentLocationDisplay id={user.id} />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Expected Behavior:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• If logged in as <strong>rider</strong>: Shows "Rider Location" with green styling</li>
              <li>• If logged in as <strong>driver</strong>: Shows "Driver Location" with blue styling</li>
              <li>• If not logged in: Shows "Current Location" with gray styling</li>
              <li>• Displays real GPS coordinates from your device</li>
              <li>• Shows loading state while getting location</li>
              <li>• Shows error state if location access is denied</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Testing Instructions:</h3>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>1. Login as a rider and check the location display</li>
              <li>2. Login as a driver and check the location display</li>
              <li>3. Logout and check the location display</li>
              <li>4. Try denying location access to see error state</li>
              <li>5. Check the Homepage, RiderDashboard, and DriverDashboard</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDisplayTest;
