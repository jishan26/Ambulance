import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  ConnectToserver,
  DisconnectFromServer,
} from "../../controllers/websocket/handler";
import { setDrivers } from "../../store/slices/nearby-drivers-slice";
import { setSelectedHospital as setSelectedHospitalAction } from "../../store/slices/selected-hospital-slice";
import RideRequest from "./RideRequest/RideRequest";
import LiveLocationMap from "../Map/LiveLocationMap";
import AvailableDrivers from "./AvailableDrivers/AvailableDrivers";
import OngoingTrip from "./../OngoingTrip/OngoingTrip";
import OnlineDriversList from "../OnlineDriversList";
import CurrentLocationDisplay from "../CurrentLocationDisplay/CurrentLocationDisplay";
import AvailableDriversCount from "../AvailableDriversCount";
import { getNotifications } from "../../controllers/apiClient";
import { Bell } from "lucide-react";
import SimpleBidNotification from "./SimpleBidNotification/SimpleBidNotification";
const RiderDashboard = () => {
  const user = useSelector((state) => state.user);
  const nearbyDrivers = useSelector((state) => state.nearbyDrivers);
  const selectedHospital = useSelector((state) => state.selectedHospital);
  const [driverBidCount, setDriverBidCount] = useState(0);
  const dispatch = useDispatch();

  // Fetch driver bid notifications
  useEffect(() => {
    const fetchDriverBids = async () => {
      if (user.id && user.role === "rider") {
        try {
          const result = await getNotifications();
          if (result.success && result.data.notifications) {
            const driverBidNotifications = result.data.notifications.filter(
              (notif) => {
                const isRelevantType = notif.notification_type === "driver_bid_sent";
                const isRelevantStatus = 
                  notif.status === "unread" ||
                  notif.status === "pending" ||
                  notif.status === "new" ||
                  !notif.status;
                
                console.log(`🔍 RiderDashboard - Driver bid filter:`, {
                  id: notif.notification_id,
                  type: notif.notification_type,
                  status: notif.status,
                  isRelevantType,
                  isRelevantStatus,
                });
                
                return isRelevantType && isRelevantStatus;
              }
            );
            setDriverBidCount(driverBidNotifications.length);
            console.log(
              "🔍 RiderDashboard - Driver bids count:",
              driverBidNotifications.length
            );

            // Driver bid popup will handle showing notifications automatically
          }
        } catch (error) {
          console.error("Error fetching driver bids:", error);
        }
      }
    };

    fetchDriverBids();
    const interval = setInterval(fetchDriverBids, 5000);
    return () => clearInterval(interval);
  }, [user.id, user.role]);

  // Test function to add a hospital marker
  const testHospitalMarker = () => {
    const testHospital = {
      name: "Test Hospital",
      latitude: 23.7944,
      longitude: 90.436,
      fullAddress: "Test Hospital, Dhaka, Bangladesh",
    };

    console.log("🧪 Testing hospital marker with:", testHospital);
    console.log("🧪 setSelectedHospitalAction:", setSelectedHospitalAction);
    console.log(
      "🧪 setSelectedHospitalAction type:",
      setSelectedHospitalAction.type
    );

    try {
      const action = setSelectedHospitalAction(testHospital);
      console.log("🧪 Created action:", action);
      dispatch(action);
      console.log("✅ Test hospital dispatched successfully");
    } catch (error) {
      console.error("❌ Error dispatching test hospital:", error);
    }
  };

  // Connect to WebSocket when component mounts
  useEffect(() => {
    console.log("RiderDashboard mounted, user:", user);
    if (user.id && user.role === "rider" && user.token) {
      console.log("🔌 Connecting to WebSocket as rider...");
      ConnectToserver(user.id, user.role, user.token);
      console.log("✅ Rider WebSocket connected successfully");
      console.log("🔍 Rider user ID:", user.id);
      console.log("🔍 Rider role:", user.role);
    }

    // Cleanup on unmount
    return () => {
      console.log("🔌 Disconnecting WebSocket...");
      DisconnectFromServer();
    };
  }, [user.id, user.role, user.token]);

  // Log driver counts when they change
  useEffect(() => {
    const onlineDriverCount = Object.keys(nearbyDrivers.drivers || {}).length;
    console.log(`📊 Online drivers: ${onlineDriverCount}`);
    console.log(`👥 Active riders: 1 (you)`);
    console.log(`🚑 Currently connected drivers: ${onlineDriverCount}`);

    if (onlineDriverCount > 0) {
      console.log("🎉 Online drivers found! Check the map for driver markers.");

      // Log individual driver details
      console.log("🚑 Available drivers:");
      Object.entries(nearbyDrivers.drivers || {}).forEach(
        ([driverId, driverData]) => {
          console.log(
            `  - Driver ${driverId}: ${
              driverData.name
            } (${driverData.latitude?.toFixed(
              4
            )}, ${driverData.longitude?.toFixed(4)}) - Status: ${
              driverData.status
            }`
          );
        }
      );
    } else {
      console.log("📭 No drivers currently connected via WebSocket.");
    }
  }, [nearbyDrivers.drivers]);

  // Periodic summary every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const driverCount = Object.keys(nearbyDrivers.drivers || {}).length;
      console.log("🔄 PERIODIC SUMMARY:");
      console.log(`   👥 Active Riders: 1 (you)`);
      console.log(`   🚑 Available Drivers: ${driverCount}`);
      console.log(
        `   📍 Your Location: ${user.latitude?.toFixed(
          6
        )}, ${user.longitude?.toFixed(6)}`
      );
      console.log(`   🏥 Selected Hospital:`, selectedHospital);
      console.log("   ⏰ Time:", new Date().toLocaleTimeString());
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [nearbyDrivers.drivers, user.latitude, user.longitude, selectedHospital]);

  console.log("🔍 RiderDashboard render - user:", user);

  return (
    <>
      {/* Driver Bid Notifications */}
     

      {/* Statistics Banner */}

      <div className="min-h-screen flex flex-col items-center p-4 md:p-8 gap-8">
        {false ? (
          <div className="w-full max-w-4xl mt-20">
            <OngoingTrip />
          </div>
        ) : (
          <>
            {/* Upper Section: Ride Request */}
            <div className="w-full max-w-4xl mt-20">
              <RideRequest />
            </div>

            {/* Driver Bid Notification Indicator */}
            {driverBidCount > 0 && (
              <div className="w-full max-w-4xl mt-4">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {driverBidCount} Driver Bid
                          {driverBidCount > 1 ? "s" : ""} Received!
                        </h3>
                        <p className="text-green-100 text-sm">
                          EMT services have responded to your request. Check the
                          bidding section above.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                      {driverBidCount}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Location Display */}
            {/* <div className="w-full max-w-4xl">
              <CurrentLocationDisplay id={user.id} />
            </div> */}

            {/* Available Drivers Count */}
            <div className="w-full max-w-4xl">
              <AvailableDriversCount />
            </div>

            {/* Lower Section: Map */}
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-6 md:mb-12">
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center px-4 py-2 md:px-6 md:py-3 rounded-lg">
                  <span className="bg-red-500 p-1 md:p-2 rounded-full mr-2 md:mr-3 shadow-sm">
                    🗺️
                  </span>
                  <span className="tracking-wide">Your Location</span>
                </h1>

                {/* Test Hospital Marker Button */}
                {/* <button
                  onClick={testHospitalMarker}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  🧪 Test Hospital Marker
                </button> */}

                {/* Online Drivers Count - Real Time */}
                {/* <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2 flex items-center">
                  <span className="text-2xl mr-2">🚑</span>
                  <div>
                    <div className="text-sm text-green-600 font-medium">
                      Online Drivers
                    </div>
                    <div className="text-lg font-bold text-green-800">
                      {Object.keys(nearbyDrivers.drivers || {}).length}
                    </div>
                  </div>
                </div> */}
              </div>

              {/* Online Drivers List */}
              <div className="w-full mb-6">{/* <OnlineDriversList /> */}</div>

              <div className="w-full flex flex-col h-[40vh] sm:h-[50vh] lg:h-[70vh]">
                <div
                  className="bg-white shadow-lg overflow-hidden border border-gray-200 rounded-md w-full z-0"
                  style={{ height: "100%", minHeight: "400px" }}
                >
                  <LiveLocationMap
                    height="500px"
                    title="Your Location"
                    trackPeriodically={false}
                    showAccuracy={true}
                    markerColor="#4CAF50"
                    markerBorderColor="#2E7D32"
                    id={user.id}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      background: "rgba(255,255,255,0.9)",
                      padding: "10px",
                      borderRadius: "5px",
                      zIndex: 1000,
                    }}
                  >
                    <p>Map should appear above this text</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
    </>
  );
};

export default RiderDashboard;
