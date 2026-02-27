import React, { useState, useEffect } from "react";
import { getDriverCount } from "../../controllers/apiClient";

const StatisticsBanner = () => {
  const [driverCount, setDriverCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch driver count every 10 seconds
  useEffect(() => {
    const fetchDriverCount = async () => {
      try {
        const result = await getDriverCount();
        if (result.success) {
          setDriverCount(result.data.total_count || 0);
        }
      } catch (error) {
        console.error("Error fetching driver count:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchDriverCount();

    // Set up interval to refresh every 10 seconds
    const interval = setInterval(fetchDriverCount, 10000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      value: loading ? "..." : driverCount.toString(),
      label: "VEHICLES",
      description: "Total Drivers",
    },
    {
      value: "0%",
      label: "SUCCESS RATE",
      description: "Trip Completion",
    },
    {
      value: "0",
      label: "LIVES SAVED",
      description: "Emergency Responses",
    },
    {
      value: "24/7",
      label: "SERVICE",
      description: "Always Available",
    },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-blue-900 to-blue-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-blue-200 font-medium mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-blue-300">{stat.description}</div>

              {/* Live indicator for driver count */}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatisticsBanner;
