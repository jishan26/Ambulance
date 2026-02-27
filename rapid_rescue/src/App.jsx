import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { setupGlobalErrorHandling } from "./utils/errorHandler";
import UserLogin from "./components/UserLogin/UserLogin";
import Homepage from "./components/Homepage/Homepage";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/Navbar/Navbar";
import OverallSignup from "./components/OverallSignup/OverallSignup";
import RiderDashboard from "./components/RiderDashboard/RiderDashboard";
import LocationPointMap from "./components/Map/LocationPointMap";
import RouteMap from "./components/Map/RouteMap";
import ETA from "./components/OngoingTrip/ETA/ETA";
import Header from "./components/OngoingTrip/Header/Header";
import OngoingTripDetails from "./components/OngoingTrip/OngoingTrip";
import OngoingTrip from "./components/OngoingTrip/OngoingTrip";
import RideSearchForm from "./components/RiderDashboard/RideSearchForm/RideSearchForm";
import RideRequest from "./components/RiderDashboard/RideRequest/RideRequest";
import AvailableDrivers from "./components/RiderDashboard/AvailableDrivers/AvailableDrivers";
import RiderReview from "./components/RiderReview/RiderReview";
import DriverSearch from "./components/DriverSearch/DriverSearch";
import AlignDriverInfo from "./components/AlignDriverInfo/AlignDriverInfo";
import LoadingIndicator from "./components/DriverResponse/LoadingIndicator";
import DriverDashboard from "./components/DriverDashboard/DriverDashboard";
import MapComponent from "./components/DriverDashboard/MainContent/MapComponent/MapComponent";
import { Outlet, createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./components/ErrorPage/ErrorPage";
import TripCheckout from "./components/TripCheckout/TripCheckout";
import PatientRequestComponent from "./components/DriverDashboard/MainContent/PatientRequestComponent/PatientRequestComponent";
import IncomingTrips from "./components/IncomingTrips/IncomingTrips";
import AuthWrapper from "./components/AuthWrapper";
import BidNegotiation from "./components/RiderDashboard/BidNegotiation/BidNegotiation";
import About from "./components/About/About";
import DriverProfile from "./components/DriverProfile/DriverProfile";
import PatientProfile from "./components/PatientProfile/PatientProfile";

function App() {
  // Setup global error handling for external scripts
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  function Layout() {
    return (
      <AuthWrapper>
        <div className="app">
          <Navbar />
          <div className="content">
            <Outlet />
          </div>
          <Footer />
        </div>
      </AuthWrapper>
    );
  }
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "/",
          element: <Homepage />,
        },
        {
          path: "ride_request",
          element: <RiderDashboard />,
        },
        {
          path: "available_ride",
          element: <DriverDashboard />,
        },
        {
          path: "rider_review",
          element: <RiderReview></RiderReview>,
        },
        {
          path: "ongoing_trip",
          element: <OngoingTrip></OngoingTrip>,
        },
        {
          path: "route_map",
          element: <RouteMap />,
        },

        {
          path: "incomingtips",
          element: <IncomingTrips />,
        },
        {
          path: "patientrequestcomponent",
          element: <PatientRequestComponent />,
        },
        {
          path: "tripcheckout",
          element: <TripCheckout />,
        },
        {
          path: "driver_profile",
          element: <DriverProfile />,
        },
        {
          path: "patient_profile",
          element: <PatientProfile />,
        },

        {
          path: "about",
          element: <About />,
        },
        {
          path: "bid_negotiation",
          element: <BidNegotiation />,
        },

        // Add more routes as needed
      ],
    },
    {
      path: "login",
      element: <UserLogin />,
    },
    {
      path: "signup",
      element: <OverallSignup />,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
