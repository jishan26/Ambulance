import {
  API_KEYS,
  API_ENDPOINTS,
  DEFAULT_COORDINATES,
} from "../config/apiKeys";

/**
 * Location Service for handling geocoding and place search
 * Provides fallback functionality when API keys are not available
 */

// Fallback hospital data for Bangladesh/Dhaka area
const FALLBACK_HOSPITALS = [
  {
    name: "Dhaka Medical College Hospital",
    address: "Dhaka Medical College, Dhaka 1000, Bangladesh",
    rating: 4.2,
    place_id: "dmc_dhaka",
    coordinates: { lat: 23.7289, lng: 90.3944 },
  },
  {
    name: "Square Hospital",
    address: "18/F, West Panthapath, Dhaka 1205, Bangladesh",
    rating: 4.5,
    place_id: "square_hospital",
    coordinates: { lat: 23.7489, lng: 90.3934 },
  },
  {
    name: "Apollo Hospitals Dhaka",
    address: "Plot 81, Block E, Bashundhara R/A, Dhaka 1229, Bangladesh",
    rating: 4.3,
    place_id: "apollo_dhaka",
    coordinates: { lat: 23.8139, lng: 90.4264 },
  },
  {
    name: "United Hospital Limited",
    address: "Plot 15, Road 71, Gulshan, Dhaka 1212, Bangladesh",
    rating: 4.4,
    place_id: "united_hospital",
    coordinates: { lat: 23.7907, lng: 90.4158 },
  },
  {
    name: "Ibn Sina Hospital",
    address: "House 64, Road 7/A, Dhanmondi, Dhaka 1205, Bangladesh",
    rating: 4.1,
    place_id: "ibn_sina",
    coordinates: { lat: 23.7489, lng: 90.3734 },
  },
  {
    name: "Popular Medical College Hospital",
    address: "House 25, Road 2, Dhanmondi, Dhaka 1205, Bangladesh",
    rating: 4.0,
    place_id: "popular_medical",
    coordinates: { lat: 23.7489, lng: 90.3734 },
  },
  {
    name: "Bangabandhu Sheikh Mujib Medical University",
    address: "Shahbag, Dhaka 1000, Bangladesh",
    rating: 4.3,
    place_id: "bsmmu",
    coordinates: { lat: 23.7379, lng: 90.3934 },
  },
  {
    name: "National Institute of Cardiovascular Diseases",
    address: "Sher-e-Bangla Nagar, Dhaka 1207, Bangladesh",
    rating: 4.2,
    place_id: "nicvd",
    coordinates: { lat: 23.7489, lng: 90.3734 },
  },
  {
    name: "Kurmitola General Hospital",
    address: "Kurmitola, Dhaka 1206, Bangladesh",
    rating: 4.0,
    place_id: "kurmitola",
    coordinates: { lat: 23.8489, lng: 90.3934 },
  },
  {
    name: "Central Police Hospital",
    address: "Rajarbagh, Dhaka 1217, Bangladesh",
    rating: 3.9,
    place_id: "police_hospital",
    coordinates: { lat: 23.7489, lng: 90.4134 },
  },
  {
    name: "Labaid Specialized Hospital",
    address: "House 1, Road 7, Dhanmondi, Dhaka 1205, Bangladesh",
    rating: 4.1,
    place_id: "labaid",
    coordinates: { lat: 23.7489, lng: 90.3734 },
  },
  {
    name: "Evercare Hospital Dhaka",
    address: "Plot 81, Block E, Bashundhara R/A, Dhaka 1229, Bangladesh",
    rating: 4.4,
    place_id: "evercare",
    coordinates: { lat: 23.8139, lng: 90.4264 },
  },
];

/**
 * Get current location address using reverse geocoding
 * @param {Object} coordinates - {latitude, longitude}
 * @returns {Promise<string>} Formatted address
 */
export const getCurrentLocationAddress = async (coordinates) => {
  if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
    throw new Error("Invalid coordinates provided");
  }

  try {
    // Try OpenCage first (free tier available)
    if (API_KEYS.OPENCAGE && API_KEYS.OPENCAGE !== "YOUR_OPENCAGE_API_KEY") {
      const address = await getAddressFromOpenCage(coordinates);
      if (address) return address;
    }

    // Try Google Maps
    if (
      API_KEYS.GOOGLE_MAPS &&
      API_KEYS.GOOGLE_MAPS !== "YOUR_GOOGLE_MAPS_API_KEY"
    ) {
      const address = await getAddressFromGoogleMaps(coordinates);
      if (address) return address;
    }

    // Fallback to coordinates
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(
      6
    )}`;
  } catch (error) {
    console.error("Error getting address:", error);
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(
      6
    )}`;
  }
};

/**
 * Get address from OpenCage API
 */
const getAddressFromOpenCage = async (coordinates) => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.OPENCAGE_GEOCODING}?q=${coordinates.latitude}+${coordinates.longitude}&key=${API_KEYS.OPENCAGE}&language=en&pretty=1`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted;
      }
    }
  } catch (error) {
    console.error("OpenCage API error:", error);
  }
  return null;
};

/**
 * Get address from Google Maps API
 */
const getAddressFromGoogleMaps = async (coordinates) => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.GOOGLE_GEOCODING}/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${API_KEYS.GOOGLE_MAPS}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
    }
  } catch (error) {
    console.error("Google Maps API error:", error);
  }
  return null;
};

/**
 * Search for nearby hospitals
 * @param {string} query - Search query
 * @param {Object} coordinates - Current location coordinates
 * @returns {Promise<Array>} Array of hospital objects
 */
export const searchNearbyHospitals = async (query, coordinates) => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Try Google Places API first
    if (
      API_KEYS.GOOGLE_MAPS &&
      API_KEYS.GOOGLE_MAPS !== "AIzaSyADSv601FKrwX9iKhAdpumh_0ZLhzWBALQ"
    ) {
      const hospitals = await getHospitalsFromGooglePlaces(query, coordinates);
      if (hospitals && hospitals.length > 0) {
        return hospitals;
      }
    }

    // Fallback to local hospital data
    return getFallbackHospitals(query, coordinates);
  } catch (error) {
    console.error("Error searching hospitals:", error);
    return getFallbackHospitals(query, coordinates);
  }
};

/**
 * Get hospitals from Google Places API
 */
const getHospitalsFromGooglePlaces = async (query, coordinates) => {
  try {
    const response = await fetch(
      `${
        API_ENDPOINTS.GOOGLE_PLACES
      }/textsearch/json?query=${encodeURIComponent(
        query + " hospital"
      )}&location=${coordinates.latitude},${
        coordinates.longitude
      }&radius=50000&type=hospital&key=${API_KEYS.GOOGLE_MAPS}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.results) {
        return data.results
          .filter(
            (place) =>
              place.types.includes("hospital") || place.types.includes("health")
          )
          .slice(0, 8)
          .map((place) => ({
            name: place.name,
            address: place.formatted_address,
            rating: place.rating || 0,
            place_id: place.place_id,
            distance: place.distance || 0,
            coordinates: {
              lat: place.geometry?.location?.lat,
              lng: place.geometry?.location?.lng,
            },
          }));
      }
    }
  } catch (error) {
    console.error("Google Places API error:", error);
  }
  return [];
};

/**
 * Get fallback hospitals from local data
 */
const getFallbackHospitals = (query, coordinates) => {
  const searchQuery = query.toLowerCase();

  return FALLBACK_HOSPITALS.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(searchQuery) ||
      hospital.address.toLowerCase().includes(searchQuery) ||
      searchQuery.includes("hospital") ||
      searchQuery.includes("medical")
  )
    .slice(0, 8)
    .map((hospital) => ({
      ...hospital,
      distance: calculateDistance(
        coordinates.latitude,
        coordinates.longitude,
        hospital.coordinates.lat,
        hospital.coordinates.lng
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Calculate distance between two coordinates (in kilometers)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get formatted address from coordinates (simple fallback)
 */
export const getSimpleAddress = (coordinates) => {
  if (!coordinates) return "Location not available";

  // Simple address format based on coordinates
  const lat = coordinates.latitude;
  const lng = coordinates.longitude;

  // Determine area based on coordinates (rough approximation for Dhaka)
  let area = "Dhaka";
  if (lat > 23.8) area = "Uttara";
  else if (lat < 23.7) area = "Old Dhaka";
  else if (lng > 90.4) area = "Gulshan";
  else if (lng < 90.3) area = "Dhanmondi";

  return `${area}, Dhaka, Bangladesh (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
};

/**
 * Check if API keys are configured
 */
export const hasApiKeys = () => {
  return {
    googleMaps: API_KEYS.GOOGLE_MAPS !== "YOUR_GOOGLE_MAPS_API_KEY",
    openCage: API_KEYS.OPENCAGE !== "YOUR_OPENCAGE_API_KEY",
    mapbox: API_KEYS.MAPBOX !== "YOUR_MAPBOX_API_KEY",
  };
};
