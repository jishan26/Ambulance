import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Ambulance,
  Shield,
  Clock,
  AlertCircle,
  MapPin,
  Navigation,
  Target,
  DollarSign,
  CreditCard,
  Loader2,
  Search,
  Crosshair,
  Building2,
  ChevronDown,
} from "lucide-react";
import { addTripReq } from "../../../store/slices/trip-request-slice";
import {
  setSelectedHospital as setSelectedHospitalAction,
  clearSelectedHospital as clearHospital,
} from "../../../store/slices/selected-hospital-slice";
import store from "../../../store";
import WebSocketController from "../../../controllers/websocket/ConnectionManger";
import { createTripRequest } from "../../../controllers/apiClient";
import { useLocation } from "../../Geolocation/Geolocation";
import {
  getCurrentLocationAddress,
  searchNearbyHospitals,
  getSimpleAddress,
} from "../../../services/locationService";
import CoordinatesDisplay from "../../CoordinatesDisplay/CoordinatesDisplay";
import useHospitalSearch from "../../../hooks/useHospitalSearch";
import HospitalSuggestionDropdown from "../../HospitalSearch/HospitalSuggestionDropdown";
import HospitalDetails from "../../HospitalSearch/HospitalDetails";

export default function RideSearchForm() {
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupLatitude, setPickupLatitude] = useState("");
  const [pickupLongitude, setPickupLongitude] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [dropoffLatitude, setDropoffLatitude] = useState("");
  const [dropoffLongitude, setDropoffLongitude] = useState("");
  const [fare, setFare] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showHospitalSuggestions, setShowHospitalSuggestions] = useState(false);
  const [hospitalSuggestions, setHospitalSuggestions] = useState([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null); // New state for selected hospital coordinates
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState("");
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const lastSavedHospitalKeyRef = useRef("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [data, setData] = useState(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // Hospital search hook
  const {
    hospitals,
    loading: hospitalLoading,
    error: hospitalError,
  } = useHospitalSearch(hospitalSearchQuery);
  // Get current location
  const {
    coordinates,
    error: locationError,
    loading: locationLoading,
  } = useLocation({
    trackPeriodically: false,
    isActive: true,
    id: user.id,
    onLocationUpdate: null,
  });

  const isFormValid =
    pickupLocation &&
    pickupLatitude &&
    pickupLongitude &&
    dropoffLocation &&
    dropoffLatitude &&
    dropoffLongitude &&
    fare;

  // Get current location address when coordinates are available
  useEffect(() => {
    console.log("🔄 RideSearchForm useEffect triggered:", {
      hasCoordinates: !!coordinates,
      coordinates,
      hasPickupLocation: !!pickupLocation,
      pickupLocation,
      userRole: user.role,
      userId: user.id,
    });

    if (coordinates && !pickupLocation) {
      console.log("🚀 Triggering automatic location detection for rider");
      handleGetCurrentLocation();
    }
  }, [coordinates]);

  // Get nearby hospitals when user starts typing destination
  useEffect(() => {
    if (dropoffLocation.length > 2) {
      const timeoutId = setTimeout(() => {
        getNearbyHospitals(dropoffLocation);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setHospitalSuggestions([]);
      setShowHospitalSuggestions(false);
    }
  }, [dropoffLocation]);

  const handleGetCurrentLocation = async () => {
    if (!coordinates) {
      console.log("❌ No coordinates available for rider location");
      return;
    }

    console.log("🔄 Getting current location for rider:", coordinates);
    setIsGettingLocation(true);
    try {
      const address = await getCurrentLocationAddress(coordinates);
      setPickupLocation(address);
      setPickupLatitude(coordinates.latitude.toFixed(6));
      setPickupLongitude(coordinates.longitude.toFixed(6));
      console.log("✅ Rider location address:", address);
      console.log(
        "✅ Rider coordinates:",
        coordinates.latitude,
        coordinates.longitude
      );
    } catch (error) {
      console.error("❌ Error getting rider address:", error);
      // Fallback to simple address
      const simpleAddress = getSimpleAddress(coordinates);
      setPickupLocation(simpleAddress);
      setPickupLatitude(coordinates.latitude.toFixed(6));
      setPickupLongitude(coordinates.longitude.toFixed(6));
      console.log("📍 Using fallback address:", simpleAddress);
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    const fetchAddress = async () => {
      setIsFetchingAddress(true);
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?key=0b556b64e527464984f3e45777fcfac2&q=${pickupLatitude}+${pickupLongitude}&pretty=1&no_annotations=1`
        );
        const data = await response.json();
        setData(data);

        // Update pickup location with the fetched address
        if (data && data.results && data.results.length > 0) {
          const address =
            data.results[0].formatted ||
            data.results[0].components?.suburb ||
            `${pickupLatitude}, ${pickupLongitude}`;
          setPickupLocation(address);
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        // Fallback to coordinates if API fails
        setPickupLocation(`${pickupLatitude}, ${pickupLongitude}`);
      } finally {
        setIsFetchingAddress(false);
      }
    };

    if (pickupLatitude && pickupLongitude) {
      fetchAddress();
    }
  }, [pickupLatitude, pickupLongitude]);

  const getNearbyHospitals = async (query) => {
    if (!coordinates) return;

    setIsLoadingHospitals(true);
    try {
      const hospitals = await searchNearbyHospitals(query, coordinates);
      setHospitalSuggestions(hospitals);
      setShowHospitalSuggestions(true);
      console.log("🏥 Found hospitals:", hospitals);
    } catch (error) {
      console.error("❌ Error getting hospitals:", error);
      setHospitalSuggestions([]);
    } finally {
      setIsLoadingHospitals(false);
    }
  };

  const selectHospital = (hospital) => {
    console.log("🏥 selectHospital called with:", hospital);
    console.log("🏥 Hospital data structure:", {
      name: hospital.name,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      fullAddress: hospital.fullAddress,
    });

    setDropoffLocation(hospital.name);
    setDropoffLatitude(hospital.latitude.toFixed(6));
    setDropoffLongitude(hospital.longitude.toFixed(6));
    setSelectedHospital(hospital); // Store hospital with coordinates
    setShowHospitalSuggestions(false);
    setShowHospitalDropdown(false);
    setHospitalSearchQuery(hospital.name);

    // Validate hospital data before dispatching
    if (!hospital || !hospital.latitude || !hospital.longitude) {
      console.error("❌ Invalid hospital data:", hospital);
      return;
    }

    // Dispatch to Redux for map display
    console.log("🏥 Dispatching hospital to Redux:", hospital);
    console.log("🏥 setSelectedHospitalAction:", setSelectedHospitalAction);

    try {
      const action = setSelectedHospitalAction(hospital);
      console.log("🏥 Created action:", action);
      console.log("🏥 Action payload:", action.payload);
      dispatch(action);
      console.log("✅ Hospital dispatched successfully");

      // Persist selection to backend Hospitals table
      saveHospitalToBackend({
        name: hospital.name,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
      });

      // Check Redux state after dispatch
      setTimeout(() => {
        console.log(
          "🏥 Redux state after dispatch:",
          store.getState().selectedHospital
        );
      }, 100);
    } catch (error) {
      console.error("❌ Error dispatching hospital:", error);
    }

    console.log("🏥 Hospital selected:", {
      name: hospital.name,
      latitude: hospital.latitude.toFixed(6),
      longitude: hospital.longitude.toFixed(6),
      address: hospital.fullAddress,
    });
  };

  // Helper: POST selected hospital to backend, guard against duplicates
  const saveHospitalToBackend = async ({ name, latitude, longitude }) => {
    try {
      if (!user?.id) return;
      const lat = Number(latitude);
      const lon = Number(longitude);
      if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return;

      const key = `${user.id}|${name}|${lat.toFixed(6)}|${lon.toFixed(6)}`;
      if (lastSavedHospitalKeyRef.current === key) {
        return; // avoid duplicate save for same selection
      }

      const token =
        localStorage.getItem("token") ||
        JSON.parse(localStorage.getItem("user") || "null")?.token;
      const res = await fetch("http://localhost:8000/hospitals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          rider_id: user.id,
          name,
          latitude: lat,
          longitude: lon,
        }),
      });
      if (!res.ok) {
        console.warn("⚠️ Failed to save hospital:", res.status);
        return;
      }
      lastSavedHospitalKeyRef.current = key;
      console.log("✅ Hospital saved to backend");
    } catch (e) {
      console.error("❌ Error saving hospital:", e);
    }
  };

  // If user manually types destination and coordinates, save when all are present
  useEffect(() => {
    if (!dropoffLocation || !dropoffLatitude || !dropoffLongitude) return;
    saveHospitalToBackend({
      name: dropoffLocation,
      latitude: dropoffLatitude,
      longitude: dropoffLongitude,
    });
  }, [dropoffLocation, dropoffLatitude, dropoffLongitude, user.id]);

  const handleHospitalSearchChange = (e) => {
    const query = e.target.value;
    setHospitalSearchQuery(query);
    setDropoffLocation(query);
    setShowHospitalDropdown(query.length > 1);

    // Clear selected hospital if user is typing
    if (selectedHospital && query !== selectedHospital.name) {
      setSelectedHospital(null);
      setDropoffLatitude("");
      setDropoffLongitude("");
    }
  };

  const handleLatitudeChange = (e) => {
    const value = e.target.value;
    setDropoffLatitude(value);
    console.log("📍 Destination Latitude updated:", value);
  };

  const handleLongitudeChange = (e) => {
    const value = e.target.value;
    setDropoffLongitude(value);
    console.log("📍 Destination Longitude updated:", value);
  };

  const clearSelectedHospital = () => {
    setSelectedHospital(null);
    setDropoffLocation("");
    setDropoffLatitude("");
    setDropoffLongitude("");
    setHospitalSearchQuery("");
    setShowHospitalDropdown(false);

    // Clear from Redux
    console.log("🏥 Clearing hospital from Redux");

    try {
      dispatch(clearHospital());
      console.log("✅ Hospital cleared successfully");
    } catch (error) {
      console.error("❌ Error clearing hospital:", error);
    }
  };

  const handleSearch = async () => {
    if (!isFormValid) {
      setError("Please fill all required fields.");
      return;
    }

    if (!user.id || !user.token) {
      setError("Please login to request a ride.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Create payload for backend
      const payload = {
        pickup_location: pickupLocation,
        destination: dropoffLocation,
        fare: parseFloat(fare),
        latitude: parseFloat(pickupLatitude),
        longitude: parseFloat(pickupLongitude),
      };

      const result = await createTripRequest(payload);
      if (!result.success) {
        console.error(
          "❌ Failed to create trip request via API:",
          result.error
        );
        setError(
          result.error?.detail ||
            result.error?.message ||
            "Failed to submit request."
        );
        setIsLoading(false);
        return;
      }

      // Build local model for UI/Redux; server will broadcast to drivers
      const req_id = result.data.req_id || Date.now();
      const tripRequest = {
        req_id,
        rider_id: user.id,
        pickup_location: pickupLocation,
        pickup_latitude: parseFloat(pickupLatitude),
        pickup_longitude: parseFloat(pickupLongitude),
        destination: dropoffLocation,
        destination_latitude: parseFloat(dropoffLatitude || 0),
        destination_longitude: parseFloat(dropoffLongitude || 0),
        fare: parseFloat(fare),
        latitude: parseFloat(pickupLatitude),
        longitude: parseFloat(pickupLongitude),
        timestamp: new Date().toISOString(),
        status: "pending",
      };

      console.log("🚀 RideSearchForm - Dispatching addTripReq:", tripRequest);
      dispatch(addTripReq(tripRequest));
      console.log("🚀 RideSearchForm - Trip request dispatched to Redux");

      setIsLoading(false);

      // Small delay to ensure Redux state is updated
      setTimeout(() => {
        console.log("🚀 RideSearchForm - Navigating to /ride_request");
        navigate("/ride_request");
      }, 100);
    } catch (error) {
      console.error("Error submitting trip request:", error);
      setError("Failed to submit request. Please try again.");
      setIsLoading(false);
    }
  };

  const getButtonClass = () => {
    if (isLoading) return "bg-gray-400 cursor-not-allowed";
    if (isFormValid)
      return "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700";
    return "bg-gray-300 cursor-not-allowed";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 ">
      <div className="p-10 rounded-3xl  w-full max-w-5xl border border-gray-200 relative overflow-hidden shadow-lg">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl translate-y-12 -translate-x-12"></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <Ambulance className="text-white text-2xl w-8 h-8" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                  Emergency Transport
                </h2>
                <p className="text-sm text-gray-500">Find & Request Service</p>
              </div>
            </div>

            <div className="flex justify-center mb-2">
              <div className="bg-gradient-to-r from-red-50 to-blue-50 border border-red-200/50 text-red-700 px-4 py-2 rounded-full text-sm font-medium inline-flex items-center">
                <div className="animate-pulse mr-2 h-2 w-2 rounded-full bg-red-500"></div>
                Emergency Medical Service
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex justify-center space-x-6 text-xs text-gray-500 mt-4">
              <div className="flex items-center">
                <Shield className="w-3 h-3 mr-1 text-red-500" />
                Licensed
              </div>
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1 text-blue-500" />
                24/7 Available
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm mb-6 text-center p-4 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              {/* Pickup Location */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Pickup Location
                </label>

                {/* Address Input */}
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="text-red-500 w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Patient's current location address"
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-red-400 focus:ring-0 transition-all duration-300 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center space-x-2">
                    {isGettingLocation || isFetchingAddress ? (
                      <Loader2 className="text-red-500 w-4 h-4 animate-spin" />
                    ) : (
                      <button
                        onClick={handleGetCurrentLocation}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        title="Get current location"
                      >
                        <Crosshair className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Latitude and Longitude Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Latitude
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Navigation className="text-red-500 w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        step="any"
                        placeholder="23.7944"
                        className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-red-400 focus:ring-0 transition-all duration-300 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                        value={pickupLatitude}
                        onChange={(e) => setPickupLatitude(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Longitude
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Target className="text-red-500 w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        step="any"
                        placeholder="90.436"
                        className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-red-400 focus:ring-0 transition-all duration-300 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                        value={pickupLongitude}
                        onChange={(e) => setPickupLongitude(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {locationError && (
                  <p className="text-xs text-red-500 mt-2 ml-1">
                    Location error: {locationError}
                  </p>
                )}
              </div>

              {/* Destination - Hospital Search */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Destination - Hospital Search
                </label>

                {/* Hospital Search Input */}
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="text-blue-500 w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for hospitals in Dhaka, Bangladesh..."
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-0 transition-all duration-300 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                    value={hospitalSearchQuery}
                    onChange={handleHospitalSearchChange}
                    onFocus={() =>
                      setShowHospitalDropdown(hospitalSearchQuery.length > 1)
                    }
                    onBlur={() =>
                      setTimeout(() => setShowHospitalDropdown(false), 200)
                    }
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {hospitalLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    ) : (
                      <Search className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </div>

                {/* Hospital Suggestions Dropdown */}
                <HospitalSuggestionDropdown
                  hospitals={hospitals}
                  loading={hospitalLoading}
                  error={hospitalError}
                  onSelectHospital={selectHospital}
                  isVisible={
                    showHospitalDropdown && hospitalSearchQuery.length > 1
                  }
                />

                {/* Real-time Coordinates Display
                {dropoffLatitude && dropoffLongitude && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-semibold text-blue-800">
                        Destination GPS Coordinates
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">
                          Latitude:
                        </span>
                        <div className="font-mono text-blue-900">
                          {parseFloat(dropoffLatitude).toFixed(6)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">
                          Longitude:
                        </span>
                        <div className="font-mono text-blue-900">
                          {parseFloat(dropoffLongitude).toFixed(6)}
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Selected Hospital Details
                {selectedHospital && (
                  <HospitalDetails
                    hospital={selectedHospital}
                    onClear={clearSelectedHospital}
                  />
                )} */}

                {/* Manual Coordinate Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Destination Latitude
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Navigation className="text-blue-500 w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        step="any"
                        placeholder="23.7944"
                        className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-0 transition-all duration-300 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                        value={dropoffLatitude}
                        onChange={handleLatitudeChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Destination Longitude
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Target className="text-blue-500 w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        step="any"
                        placeholder="90.436"
                        className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-0 transition-all duration-300 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                        value={dropoffLongitude}
                        onChange={handleLongitudeChange}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2 ml-1 flex items-center">
                  <Building2 className="w-3 h-3 mr-1" />
                  Search for hospitals in Dhaka, Bangladesh using OpenStreetMap
                </p>
              </div>

              {/* Budget Limit */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Budget Limit
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    TK.
                  </div>
                  <input
                    type="text"
                    placeholder="Maximum budget for service"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-400 focus:ring-0 transition-all duration-300 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                    value={fare}
                    onChange={(e) => setFare(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <CreditCard className="text-gray-300 w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Enter the maximum amount you're willing to pay
                </p>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={!isFormValid || isLoading}
                className={`w-full ${getButtonClass()} text-white py-4 rounded-xl flex justify-center items-center transition-all duration-300 mt-6 font-semibold text-lg relative overflow-hidden`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Searching for Drivers...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Find Emergency Transport
                  </>
                )}
              </button>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Navigation className="w-5 h-5 mr-2 text-blue-600" />
                  How It Works
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                      1
                    </div>
                    <div>
                      <strong>Auto-location:</strong> Your current location is
                      automatically detected and filled in.
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                      2
                    </div>
                    <div>
                      <strong>Hospital Search:</strong> Type to find nearby
                      hospitals and medical facilities.
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                      3
                    </div>
                    <div>
                      <strong>Set Budget:</strong> Enter your maximum budget for
                      the emergency transport.
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">
                      4
                    </div>
                    <div>
                      <strong>Find Drivers:</strong> Available drivers will be
                      notified of your request.
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                  Safety Features
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Licensed and verified drivers
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Real-time location tracking
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Emergency contact notifications
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    24/7 customer support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
