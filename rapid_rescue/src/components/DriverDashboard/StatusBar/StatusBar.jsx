import { FaAmbulance, FaHeartbeat } from "react-icons/fa";
import { MdEmergency, MdWifiOff } from "react-icons/md";
import { Bell } from "lucide-react";
import PropTypes from "prop-types";
import DriverNotification from "../../DriverNotification/DriverNotification";
import { useState, useEffect } from "react";
import { getNotifications } from "../../../controllers/apiClient";
import { useSelector } from "react-redux";

const StatusBar = ({ isAvailable, toggleAvailability }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const user = useSelector((state) => state.user);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (user.id && user.role === "driver") {
        try {
          const result = await getNotifications();
          if (result.success && result.data.notifications) {
            const driverNotifications = result.data.notifications.filter(
              (notif) => {
                // Only notifications for this driver (recipient_id)
                const isForThisDriver = notif.recipient_id === user.id;
                
                // Filter out read, denied, and rejected notifications
                const isRelevantStatus = 
                  notif.status === "unread" ||
                  notif.status === "pending" ||
                  notif.status === "new" ||
                  !notif.status;

                console.log(`🔍 StatusBar Notification Filter:`, {
                  id: notif.notification_id,
                  type: notif.notification_type,
                  recipient: notif.recipient_id,
                  sender: notif.sender_id,
                  status: notif.status,
                  currentDriver: user.id,
                  isForThisDriver,
                  isRelevantStatus,
                });

                // Show only unread/relevant notifications for this driver
                return isForThisDriver && isRelevantStatus;
              }
            );
            setNotificationCount(driverNotifications.length);
          }
        } catch (error) {
          console.error("Error fetching notification count:", error);
        }
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [user.id, user.role]);

  return (
    <div className="mt-6 sm:mt-8 lg:mt-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100 transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left side with icon and status */}
            <div className="flex items-center space-x-4">
              <div
                className={`relative rounded-2xl p-3 shadow-lg transition-all duration-300 ${
                  isAvailable
                    ? "bg-gradient-to-br from-red-500 to-red-600"
                    : "bg-gradient-to-br from-gray-400 to-gray-500"
                }`}
              >
                <FaAmbulance className="text-white text-2xl" />

                {/* Pulsing indicator */}
                {isAvailable && (
                  <div className="absolute -top-1 -right-1">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h2 className="font-bold text-xl text-gray-800 flex items-center">
                  Emergency Response Unit
                  {isAvailable ? (
                    <MdEmergency className="ml-2 text-red-500" />
                  ) : (
                    <MdWifiOff className="ml-2 text-gray-500" />
                  )}
                </h2>
                <div className="flex items-center mt-1">
                  <span
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      isAvailable ? "bg-green-500 animate-pulse" : "bg-red-500"
                    }`}
                  ></span>
                  <span
                    className={`text-sm font-medium ${
                      isAvailable ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {isAvailable
                      ? "Active & Available"
                      : "Offline - Not Accepting Calls"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side with toggle and additional info */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              {/* <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Notifications"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button> */}

              <div className="hidden sm:flex flex-col items-end border-r border-gray-200 pr-4">
                <span className="text-xs text-gray-500 mb-1 font-medium">
                  RESPONSE STATUS
                </span>
                <span
                  className={`text-sm font-semibold ${
                    isAvailable ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {isAvailable ? "READY FOR EMERGENCIES" : "OFFLINE"}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1 font-medium">
                  SET STATUS
                </span>
                <div className="relative">
                  <label
                    className="flex items-center cursor-pointer"
                    aria-label="Toggle Availability"
                  >
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isAvailable}
                      onChange={toggleAvailability}
                    />
                    <div
                      className="w-16 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer 
                        peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 
                        after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 
                        after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-red-600 
                        shadow-inner transition-all duration-300"
                    ></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Additional status information */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <FaHeartbeat className="text-red-400" />
              <span className="text-sm text-gray-600">
                Emergency Medical Team:{" "}
                <span className="font-semibold">On Standby</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                System: <span className="font-semibold">Operational</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">
                GPS: <span className="font-semibold">Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Notification Modal */}
      <DriverNotification
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

StatusBar.propTypes = {
  isAvailable: PropTypes.bool.isRequired,
  toggleAvailability: PropTypes.func.isRequired,
};

export default StatusBar;
