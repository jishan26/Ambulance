// RideRequest.jsx - Responsive version
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import RideSearchForm from "../RideSearchForm/RideSearchForm";
import AvailableDrivers from "../AvailableDrivers/AvailableDrivers";
import BidNegotiation from "../BidNegotiation/BidNegotiation";
import TripCheckout from "../../TripCheckout/TripCheckout";
import PropTypes from "prop-types";
import { FaAmbulance } from "react-icons/fa";
import { getNotifications } from "../../../controllers/apiClient";

const RideRequest = ({}) => {
  const [currentView, setCurrentView] = useState("search"); // search, waiting, bidding, checkout, ongoing
  const [driverBids, setDriverBids] = useState([]);
  const [manuallyFlippedToSearch, setManuallyFlippedToSearch] = useState(false);
  const tripRequests = useSelector((state) => state.tripRequests);
  const driverResponses = useSelector((state) => state.driverResponse);
  const ongoingTrip = useSelector((state) => state.ongoingTripDetails);
  const user = useSelector((state) => state.user);

  // Fetch driver bid notifications
  useEffect(() => {
    const fetchDriverBids = async () => {
      console.log(
        "🔍 Fetching driver bids - User:",
        user.id,
        "Role:",
        user.role,
        "TripRequests:",
        tripRequests?.length
      );

      if (
        user.id &&
        user.role === "rider" &&
        tripRequests &&
        tripRequests.length > 0
      ) {
        try {
          const result = await getNotifications();
          console.log("🔍 Notifications API result:", result);

          if (result.success && result.data.notifications) {
            console.log("🔍 All notifications:", result.data.notifications);

            const driverBidNotifications = result.data.notifications.filter(
              (notif) =>
                notif.notification_type === "driver_bid_sent" &&
                notif.status === "unread"
            );

            console.log("🔍 Driver bid notifications:", driverBidNotifications);
            setDriverBids(driverBidNotifications);
            console.log("🔍 Driver bids found:", driverBidNotifications.length);
            console.log(
              "🔍 Setting driverBids state to:",
              driverBidNotifications
            );
            
            // Debug: Check if we should switch to bidding view
            if (driverBidNotifications.length > 0) {
              console.log("🔍 Should switch to bidding view - driver bids found!");
            } else {
              console.log("🔍 No driver bids found, staying in current view");
            }
          } else {
            console.log("🔍 No notifications found or API failed");
          }
        } catch (error) {
          console.error("Error fetching driver bids:", error);
        }
      } else {
        console.log("🔍 Not fetching driver bids - conditions not met");
      }
    };

    fetchDriverBids();
    const interval = setInterval(fetchDriverBids, 5000);
    return () => clearInterval(interval);
  }, [user.id, user.role, tripRequests]);

  // Listen for notification events
  useEffect(() => {
    const handleDriverBidAccepted = (event) => {
      console.log("🔔 Driver bid accepted, switching to bidding view");
      setCurrentView("bidding");
    };

    const handleDriverBidCancelled = (event) => {
      console.log("🔔 Driver bid cancelled");
      // For now, just log the cancellation
      // In a real system, this would refresh the driver bids list
    };

    const handleFlipToRideSearchForm = (event) => {
      const { reason, reqId } = event.detail;
      console.log("🔄 RideRequest - flipToRideSearchForm event received:", { reason, reqId });
      console.log("🔄 RideRequest - Current view before flip:", currentView);
      console.log("🔄 RideRequest - Event detail:", event.detail);
      
      setCurrentView("search");
      setManuallyFlippedToSearch(true);
      
      console.log("🔄 RideRequest - View changed to search, manuallyFlippedToSearch set to true");
      console.log("🔄 RideRequest - New currentView should be 'search'");
    };

    window.addEventListener("driverBidAccepted", handleDriverBidAccepted);
    window.addEventListener("driverBidCancelled", handleDriverBidCancelled);
    window.addEventListener("flipToRideSearchForm", handleFlipToRideSearchForm);

    return () => {
      window.removeEventListener("driverBidAccepted", handleDriverBidAccepted);
      window.removeEventListener(
        "driverBidCancelled",
        handleDriverBidCancelled
      );
      window.removeEventListener("flipToRideSearchForm", handleFlipToRideSearchForm);
    };
  }, []);

  useEffect(() => {
    // Determine current view based on state
    console.log("🔍 RideRequest state check:");
    console.log("🔍 ongoingTrip:", ongoingTrip);
    console.log("🔍 driverResponses:", driverResponses);
    console.log("🔍 tripRequests:", tripRequests);
    console.log("🔍 tripRequests.length:", tripRequests?.length);
    console.log("🔍 driverBids:", driverBids);
    console.log("🔍 driverBids.length:", driverBids?.length);
    console.log("🔍 currentView:", currentView);
    console.log("🔍 manuallyFlippedToSearch:", manuallyFlippedToSearch);

    // Reset the flag when we have new trip requests (user created a new request)
    if (tripRequests && tripRequests.length > 0 && manuallyFlippedToSearch) {
      console.log("🔍 New trip request detected, resetting manuallyFlippedToSearch flag");
      console.log("🔍 Trip requests:", tripRequests);
      setManuallyFlippedToSearch(false);
      console.log("🔍 manuallyFlippedToSearch reset to false");
    }

    // Don't auto-set view if we manually flipped to search (to respect flipToRideSearchForm)
    if (manuallyFlippedToSearch && currentView === "search") {
      console.log("🔍 Manually flipped to search, not overriding");
      return;
    }

    if (ongoingTrip && ongoingTrip.trip_id) {
      console.log("🔍 Setting view to: ongoing");
      setCurrentView("ongoing");
    } else if (driverBids && driverBids.length > 0) {
      console.log("🔍 Setting view to: bidding");
      console.log("🔍 Driver bids that triggered bidding view:", driverBids);
      setCurrentView("bidding");
    } else if (driverResponses && driverResponses.length > 0) {
      console.log("🔍 Setting view to: checkout");
      setCurrentView("checkout");
    } else if (tripRequests && tripRequests.length > 0) {
      console.log("🔍 Setting view to: waiting (AvailableDrivers)");
      setCurrentView("waiting");
    } else {
      console.log("🔍 Setting view to: search (RideSearchForm)");
      setCurrentView("search");
    }
  }, [tripRequests, driverResponses, ongoingTrip, driverBids, manuallyFlippedToSearch]);

  const renderCurrentView = () => {
    console.log("🔍 renderCurrentView called with currentView:", currentView);
    console.log("🔍 driverBids in renderCurrentView:", driverBids);
    console.log("🔍 driverBids.length:", driverBids?.length);
    
    switch (currentView) {
      case "search":
        return (
          <>
            <div className="text-center mb-6 md:mb-10">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-3">
                Emergency Medical Transport
              </h1>
              <p className="text-gray-600 max-w-3xl mx-auto text-sm md:text-lg px-4">
                Connect with nearby ambulance services for quick and reliable
                medical transportation
              </p>
            </div>
            <RideSearchForm />
          </>
        );
      case "waiting":
        return <AvailableDrivers />;
      case "bidding":
        return <BidNegotiation />;
      case "checkout":
        return <TripCheckout />;
      case "ongoing":
        // This would be handled by the OngoingTrip component
        return <div>Ongoing Trip - Redirecting...</div>;
      default:
        return <RideSearchForm />;
    }
  };

  return <>{renderCurrentView()}</>;
};

RideRequest.propTypes = {
  isRequested: PropTypes.bool.isRequired,
  pickupLocation: PropTypes.string.isRequired,
  dropoffLocation: PropTypes.string.isRequired,
  setPickupLocation: PropTypes.func.isRequired,
  setDropoffLocation: PropTypes.func.isRequired,
  handleSearch: PropTypes.func.isRequired,
  isFormValid: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  fare: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setFare: PropTypes.func.isRequired,
};

export default RideRequest;
