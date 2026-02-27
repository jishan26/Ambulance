import React, { useState, useEffect } from "react";
import { PuffLoaderComponent } from "../PuffLoader/PuffLoaderComponent";
import AvailableDrivers from "../RiderDashboard/AvailableDrivers/AvailableDrivers";
const DriverSearch = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [driverFound, setDriverFound] = useState(false);

  // Simulate driver search process
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setDriverFound(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="flex flex-col items-center w-full max-w-6xl space-y-6">
        {/* Header Section */}
        <div className="w-full text-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800">Find Your Driver</h1>
          <p className="text-gray-600 mt-2">
            We're connecting you with the best available drivers
          </p>
        </div>

        {/* Upper Section: Puff Loader and Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center w-full">
          {/* Left Side - Puff Loader in Styled Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center h-full transition-all duration-300 hover:shadow-xl">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-700 text-center">
                Searching for drivers
              </h2>
              <p className="text-gray-500 text-center mt-1">
                {isLoading ? "Scanning nearby areas..." : "Driver found!"}
              </p>
            </div>
            <PuffLoaderComponent />
            {!isLoading && (
              <div className="mt-4 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                Driver matched successfully!
              </div>
            )}
          </div>

          {/* Right Side - Ride Request Image */}
          <div className="flex justify-center items-center h-full">
            <div className="relative">
              <img
                src="/src/assets/images/driverPageRequest 1.png"
                alt="Ride Request"
                className="w-full max-w-md rounded-2xl shadow-lg transform transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-md">
                Ride requested
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="w-full bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  isLoading ? "bg-yellow-400" : "bg-green-500"
                }`}
              ></div>
              <span className="text-sm font-medium">
                {isLoading ? "Searching..." : "Driver found - 2 mins away"}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Estimated arrival: 5:42 PM
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                isLoading ? "bg-yellow-400 w-3/4" : "bg-green-500 w-full"
              }`}
            ></div>
          </div>
        </div>

        {/* Bottom Section - Map and Driver Response */}
        <div className="w-full mt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
            {/* Left Side - Google Map */}
            <div className="rounded-2xl overflow-hidden shadow-2xl h-[550px]">
              <iframe
                title="Google Map"
                width="100%"
                height="100%"
                className="rounded-2xl"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3689.126991404184!2d91.807229414965!3d22.356851185285853!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30ad27582ff5c2ef%3A0x3e696c9b6b4d962c!2sChittagong%2C%20Bangladesh!5e0!3m2!1sen!2sbd!4v1649761307864!5m2!1sen!2sbd"
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>

            {/* Right Side - Driver Response */}
            <div className="h-[550px] flex flex-col">
              <AvailableDrivers />

              {/* Action Buttons */}
              <div className="mt-4 flex space-x-3">
                <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-md">
                  Confirm Ride
                </button>
                <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverSearch;
