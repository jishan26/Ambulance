import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Notification from "../Notification/Notification";
import { useSelector, useDispatch } from "react-redux";
import { getNotifications } from "../../controllers/apiClient";
import {
  Menu,
  Bell,
  User,
  Phone,
  PlusCircle,
  MapPin,
  Triangle,
  Info,
} from "react-feather";
import { motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import Logout from "../../controllers/Logout"; // <-- import Logout

const Navbar = () => {
  const [toggle, settoggle] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const Navigate = useNavigate();
  const handletoggle = () => {
    settoggle(!toggle);
  };
  const Profile = (role) => {
    if (role === "rider") {
      Navigate("/patient_profile");
    } else if (role === "driver") {
      Navigate("/driver_profile");
    }
  };

  const handleCloseNotification = () => {
    settoggle(false);
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (user.id && user.role) {
        try {
          const result = await getNotifications();
          if (result.success && result.data.notifications) {
            // Filter notifications based on user role and status
            const relevantNotifications = result.data.notifications.filter((notif) => {
              const isForUser = notif.recipient_id === user.id;
              const isRelevantStatus = 
                notif.status === "unread" ||
                notif.status === "pending" ||
                notif.status === "new" ||
                !notif.status;
              
              console.log(`🔍 Navbar - Notification filter:`, {
                id: notif.notification_id,
                recipient: notif.recipient_id,
                status: notif.status,
                isForUser,
                isRelevantStatus,
                currentUser: user.id,
              });
              
              return isForUser && isRelevantStatus;
            });
            
            setNotificationCount(relevantNotifications.length);
            console.log(`🔍 Navbar - Notification count:`, relevantNotifications.length);
          } else {
            setNotificationCount(0);
          }
        } catch (error) {
          console.error("❌ Error fetching notification count:", error);
          setNotificationCount(0);
        }
      } else {
        setNotificationCount(0);
      }
    };

    fetchNotificationCount();
    // Refresh notification count every 10 seconds
    const interval = setInterval(fetchNotificationCount, 10000);
    return () => clearInterval(interval);
  }, [user.id, user.role]);

  return (
    <header className="fixed w-full top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handletoggle}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>

            <Link to="/">
              <div className="flex items-center space-x-2">
                <motion.div
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg flex items-center justify-center shadow-md"
                >
                  <span className="text-red-700 font-bold text-lg">RR</span>
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900 hidden sm:block">
                  Rapid Rescue
                </h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink
              to="/"
              className="flex items-center px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <PlusCircle size={16} className="mr-2" /> Homepage
            </NavLink>

            {console.log("User object:", user.role)}

            {
              // Only show navigation links if user is logged in
              user ? (
                user.role === "rider" ? (
                  // If user is "rider", only show Find Ambulance
                  <NavLink
                    to="/ride_request"
                    className="flex items-center px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <MapPin size={16} className="mr-2" /> Find Ambulance
                  </NavLink>
                ) : user.role === "driver" ? (
                  // If user is "driver", only show DriverDash
                  <NavLink
                    to="/available_ride"
                    className="flex items-center px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <Triangle size={16} className="mr-2" /> DriverDash
                  </NavLink>
                ) : null // If user has a different role or no role, show nothing
              ) : null // If user is not logged in, show nothing
            }

            <NavLink
              to="/about"
              className="flex items-center px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <Info size={16} className="mr-2" /> About Us
            </NavLink>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Notification Bell - Fixed positioning */}
            <div className="relative">
              <button
                onClick={handletoggle}
                className="p-2 rounded-full relative text-gray-700 hover:bg-gray-100"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <Notification isOpen={toggle} onClose={handleCloseNotification} />
            </div>
{/* 
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex items-center space-x-1 px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-lg"
            >
              <Phone size={18} className="mr-1" />
              Emergency
            </motion.button> */}
            {/* Show user info and logout if logged in, else show profile */}
            {user && user.id && user.token ? (
              <div className="flex items-center space-x-3">
                <span
                  onClick={() => Profile(user.role)}
                  className="hidden md:block text-sm text-gray-700 font-medium cursor-pointer"
                >
                  Welcome, {user.name || user.email}
                </span>
                <button
                  onClick={() => Logout(dispatch, navigate)}
                  className="p-2 rounded-full text-gray-700 hover:bg-gray-100 font-semibold"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
      {console.log(user.role)}
      {/* Mobile Menu */}
      {toggle && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-6 space-y-4">
            <NavLink
              to="/"
              onClick={handleCloseNotification}
              className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              <PlusCircle size={20} className="mr-3" /> Homepage
            </NavLink>

            <NavLink
              to="/ride_request"
              onClick={handleCloseNotification}
              className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              <MapPin size={20} className="mr-3" /> Find Ambulance
            </NavLink>

            <NavLink
              to="/available_ride"
              onClick={handleCloseNotification}
              className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              <Triangle size={20} className="mr-3" /> DriverDash
            </NavLink>

            <NavLink
              to="/about"
              onClick={handleCloseNotification}
              className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              <Info size={20} className="mr-3" /> About Us
            </NavLink>

            <div className="pt-4 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md"
              >
                <Phone size={18} />
                <span>Emergency</span>
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
