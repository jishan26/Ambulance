// API Keys Configuration
// Replace with your actual API keys

export const API_KEYS = {
  // Google Maps API Key (for Places API and Geocoding)
  GOOGLE_MAPS: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyADSv601FKrwX9iKhAdpumh_0ZLhzWBALQ',
  
  // OpenCage API Key (for reverse geocoding)
  OPENCAGE: process.env.REACT_APP_OPENCAGE_API_KEY || 'YOUR_OPENCAGE_API_KEY',
  
  // Mapbox API Key (alternative for geocoding)
  MAPBOX: process.env.REACT_APP_MAPBOX_API_KEY || 'YOUR_MAPBOX_API_KEY',
};

// API Endpoints
export const API_ENDPOINTS = {
  GOOGLE_PLACES: 'https://maps.googleapis.com/maps/api/place',
  GOOGLE_GEOCODING: 'https://maps.googleapis.com/maps/api/geocode',
  OPENCAGE_GEOCODING: 'https://api.opencagedata.com/geocode/v1/json',
  MAPBOX_GEOCODING: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
};

// Default coordinates for Bangladesh/Dhaka area
export const DEFAULT_COORDINATES = {
  latitude: 23.7944,
  longitude: 90.436,
  city: 'Dhaka',
  country: 'Bangladesh'
};
