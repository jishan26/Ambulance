import React, { useState, useEffect } from "react";
import { apiFetch } from "../controllers/apiClient";

const TotalDriversCount = () => {
  const [driverCount, setDriverCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDriverCount();
  }, []);

  const fetchDriverCount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFetch("/drivers/count");
      
      if (response.ok) {
        const data = await response.json();
        setDriverCount(data.total_drivers);
        console.log(`📊 Total drivers in database: ${data.total_drivers}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error("❌ Error fetching driver count:", err);
      setError(err.message);
      setDriverCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2 flex items-center">
        <span className="text-2xl mr-2">🚑</span>
        <div>
          <div className="text-sm text-green-600 font-medium">
            Total Drivers
          </div>
          <div className="text-lg font-bold text-green-800">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-2 flex items-center">
        <span className="text-2xl mr-2">⚠️</span>
        <div>
          <div className="text-sm text-red-600 font-medium">
            Error
          </div>
          <div className="text-lg font-bold text-red-800">
            Failed to load
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2 flex items-center">
      <span className="text-2xl mr-2">🚑</span>
      <div>
        <div className="text-sm text-green-600 font-medium">
          Total Drivers
        </div>
        <div className="text-lg font-bold text-green-800">
          {driverCount}
        </div>
      </div>
    </div>
  );
};

export default TotalDriversCount;
