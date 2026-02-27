import React from "react";
import { useSelector } from "react-redux";
import PatientProfile from "../PatientProfile/PatientProfile";
import DriverProfile from "../DriverProfile/DriverProfile";

const ProfileDemo = () => {
  const user = useSelector((state) => state.user);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Profile System Demo
        </h1>

        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Current User Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Role:</span>{" "}
              {user.role || "Not logged in"}
            </div>
            <div>
              <span className="font-medium">ID:</span> {user.id || "N/A"}
            </div>
            <div>
              <span className="font-medium">Name:</span> {user.name || "N/A"}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email || "N/A"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient Profile */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-blue-900">
                Patient Profile (Rider)
              </h2>
              <p className="text-sm text-blue-700 mt-1">
                Medical information and contact details for riders
              </p>
            </div>
            <div className="max-h-screen overflow-y-auto">
              <PatientProfile />
            </div>
          </div>

          {/* Driver Profile */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-green-900">
                Driver Profile
              </h2>
              <p className="text-sm text-green-700 mt-1">
                Driver information, vehicle details, and availability
              </p>
            </div>
            <div className="max-h-screen overflow-y-auto">
              <DriverProfile />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">
            Demo Instructions:
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>
              • <strong>Left Panel:</strong> Patient Profile - Shows for riders,
              displays message for others
            </li>
            <li>
              • <strong>Right Panel:</strong> Driver Profile - Shows for
              drivers, displays message for others
            </li>
            <li>
              • <strong>Edit Mode:</strong> Click "Edit Profile" to modify
              information
            </li>
            <li>
              • <strong>Save Changes:</strong> Click "Save Changes" to update
              the database
            </li>
            <li>
              • <strong>Role-based Access:</strong> Each profile shows
              appropriate content based on user role
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileDemo;
