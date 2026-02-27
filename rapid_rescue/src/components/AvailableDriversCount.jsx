import React, { useState, useEffect } from "react";
import { getDriverCount } from "../controllers/apiClient";

const AvailableDriversCount = () => {
  const [availableCount, setAvailableCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchAvailableDriversCount();
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(fetchAvailableDriversCount, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableDriversCount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getDriverCount();
      
      if (result.success) {
        const data = result.data;
        setAvailableCount(data.available_count);
        setTotalCount(data.total_count);
        setLastUpdated(data.timestamp);
        console.log(`📊 Real-time driver count: ${data.available_count}/${data.total_count} available`);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch driver count');
      }
    } catch (err) {
      console.error("❌ Error fetching available drivers count:", err);
      setError(err.message);
      // Don't reset counts to 0 on error, keep previous values
    } finally {
      setLoading(false);
    }
  };

  if (loading && availableCount === 0 && totalCount === 0) {
    return (
      <div className="bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 flex items-center">
        <span className="text-2xl mr-2">🚑</span>
        <div>
          <div className="text-sm text-blue-600 font-medium">
            Available Drivers
          </div>
          <div className="text-lg font-bold text-blue-800">
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

  const percentage = totalCount > 0 ? ((availableCount / totalCount) * 100).toFixed(1) : 0;

  return (
    <div className="bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 flex items-center">
      <span className="text-2xl mr-2">🚑</span>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-600 font-medium">
            Available Drivers
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-xs text-blue-500">
              {loading ? 'Updating...' : 'Live'}
            </span>
          </div>
        </div>
        <div className="text-lg font-bold text-blue-800">
          {availableCount} / {totalCount}
        </div>
        <div className="text-xs text-blue-500">
          {percentage}% available
          {lastUpdated && (
            <span className="ml-2">
              • Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailableDriversCount;