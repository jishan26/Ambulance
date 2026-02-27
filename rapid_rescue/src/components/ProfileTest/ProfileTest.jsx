import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { apiFetch } from "../../controllers/apiClient";
import PatientProfile from "../PatientProfile/PatientProfile";
import DriverProfile from "../DriverProfile/DriverProfile";

const ProfileTest = () => {
  const user = useSelector((state) => state.user);
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testProfileAPI = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test Driver Profile API
      if (user.role === "driver") {
        console.log("🧪 Testing Driver Profile API...");

        // Test GET
        const getResponse = await apiFetch(`/profile/driver/${user.id}`);
        if (getResponse.ok) {
          const data = await getResponse.json();
          results.driverGet = { success: true, data };
          console.log("✅ Driver GET successful:", data);
        } else {
          results.driverGet = {
            success: false,
            error: await getResponse.text(),
          };
        }

        // Test PUT
        const updateData = {
          name: `Test Driver ${Date.now()}`,
          email: `testdriver${Date.now()}@example.com`,
          mobile: `+123456789${Date.now().toString().slice(-4)}`,
          ratings: 4.5,
          is_available: true,
        };

        const putResponse = await apiFetch(`/profile/driver/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (putResponse.ok) {
          const data = await putResponse.json();
          results.driverPut = { success: true, data };
          console.log("✅ Driver PUT successful:", data);
        } else {
          results.driverPut = {
            success: false,
            error: await putResponse.text(),
          };
        }
      }

      // Test Rider Profile API
      if (user.role === "rider") {
        console.log("🧪 Testing Rider Profile API...");

        // Test GET
        const getResponse = await apiFetch(`/profile/rider/${user.id}`);
        if (getResponse.ok) {
          const data = await getResponse.json();
          results.riderGet = { success: true, data };
          console.log("✅ Rider GET successful:", data);
        } else {
          results.riderGet = {
            success: false,
            error: await getResponse.text(),
          };
        }

        // Test PUT
        const updateData = {
          name: `Test Rider ${Date.now()}`,
          email: `testrider${Date.now()}@example.com`,
          mobile: `+123456789${Date.now().toString().slice(-4)}`,
        };

        const putResponse = await apiFetch(`/profile/rider/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (putResponse.ok) {
          const data = await putResponse.json();
          results.riderPut = { success: true, data };
          console.log("✅ Rider PUT successful:", data);
        } else {
          results.riderPut = {
            success: false,
            error: await putResponse.text(),
          };
        }
      }
    } catch (error) {
      console.error("❌ Profile API test error:", error);
      results.error = error.message;
    } finally {
      setLoading(false);
    }

    setTestResults(results);
  };

  const resetProfile = async () => {
    if (!user.id) return;

    try {
      setLoading(true);

      if (user.role === "driver") {
        const resetData = {
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          ratings: 0,
          is_available: false,
        };

        await apiFetch(`/profile/driver/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resetData),
        });
      } else if (user.role === "rider") {
        const resetData = {
          name: user.name,
          email: user.email,
          mobile: user.mobile,
        };

        await apiFetch(`/profile/rider/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resetData),
        });
      }

      console.log("🔄 Profile reset to original values");
    } catch (error) {
      console.error("❌ Error resetting profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user.id) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Please Login
          </h2>
          <p className="text-gray-600">
            You need to be logged in to test the profile system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Profile System Test
        </h1>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Role:</span>{" "}
              {user.role || "Not set"}
            </div>
            <div>
              <span className="font-medium">ID:</span> {user.id || "Not set"}
            </div>
            <div>
              <span className="font-medium">Name:</span>{" "}
              {user.name || "Not set"}
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              {user.email || "Not set"}
            </div>
          </div>
        </div>

        {/* API Test Results */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">API Test Results</h2>

          <div className="flex space-x-4 mb-4">
            <button
              onClick={testProfileAPI}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test Profile APIs"}
            </button>

            <button
              onClick={resetProfile}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Reset Profile
            </button>
          </div>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-4">
              {testResults.driverGet && (
                <div
                  className={`p-4 rounded-lg ${
                    testResults.driverGet.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Driver GET Test
                  </h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults.driverGet, null, 2)}
                  </pre>
                </div>
              )}

              {testResults.driverPut && (
                <div
                  className={`p-4 rounded-lg ${
                    testResults.driverPut.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Driver PUT Test
                  </h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults.driverPut, null, 2)}
                  </pre>
                </div>
              )}

              {testResults.riderGet && (
                <div
                  className={`p-4 rounded-lg ${
                    testResults.riderGet.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Rider GET Test
                  </h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults.riderGet, null, 2)}
                  </pre>
                </div>
              )}

              {testResults.riderPut && (
                <div
                  className={`p-4 rounded-lg ${
                    testResults.riderPut.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Rider PUT Test
                  </h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults.riderPut, null, 2)}
                  </pre>
                </div>
              )}

              {testResults.error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-700">{testResults.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

         {/* Profile Components */}
         <div className="bg-white rounded-lg shadow-sm p-6">
           <h2 className="text-xl font-semibold mb-4">Profile Components</h2>

           <div className="space-y-8">
             {/* Patient Profile Component - Always show */}
             <div>
               <h3 className="text-lg font-medium mb-4">
                 Patient Profile Component
               </h3>
               <div className="border rounded-lg overflow-hidden">
                 <PatientProfile />
               </div>
             </div>

             {/* Driver Profile Component - Always show */}
             <div>
               <h3 className="text-lg font-medium mb-4">
                 Driver Profile Component
               </h3>
               <div className="border rounded-lg overflow-hidden">
                 <DriverProfile />
               </div>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
};

export default ProfileTest;
