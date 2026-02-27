import { useState, useEffect, useCallback } from 'react';

const useHospitalSearch = (query, delay = 300) => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search function
  const searchHospitals = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setHospitals([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // OpenStreetMap Nominatim API for Dhaka, Bangladesh
      const viewbox = '90.297,23.700,90.450,23.900'; // Dhaka bounding box
      const url = `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery + ' hospital')}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=10&` +
        `viewbox=${viewbox}&` +
        `bounded=1&` +
        `countrycodes=bd&` +
        `featuretype=amenity`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RapidRescue/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hospitals');
      }

      const data = await response.json();
      
      // Filter and process results
      const hospitalResults = data
        .filter(item => {
          // Filter for hospitals and medical facilities
          const name = item.display_name?.toLowerCase() || '';
          const type = item.type?.toLowerCase() || '';
          const category = item.category?.toLowerCase() || '';
          
          return (
            name.includes('hospital') ||
            name.includes('medical') ||
            name.includes('clinic') ||
            name.includes('health') ||
            type.includes('hospital') ||
            category.includes('hospital') ||
            item.class === 'amenity' && item.type === 'hospital'
          );
        })
        .map(item => ({
          id: item.place_id,
          name: item.display_name.split(',')[0].trim(), // Get the first part as hospital name
          fullAddress: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type,
          category: item.category
        }))
        .filter((hospital, index, self) => 
          // Deduplicate by name and coordinates
          index === self.findIndex(h => 
            h.name.toLowerCase() === hospital.name.toLowerCase() &&
            Math.abs(h.latitude - hospital.latitude) < 0.001 &&
            Math.abs(h.longitude - hospital.longitude) < 0.001
          )
        )
        .slice(0, 5); // Limit to top 5 results

      setHospitals(hospitalResults);
    } catch (err) {
      console.error('Error searching hospitals:', err);
      setError(err.message);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchHospitals(query);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [query, searchHospitals, delay]);

  return { hospitals, loading, error };
};

export default useHospitalSearch;
