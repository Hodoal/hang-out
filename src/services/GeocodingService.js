import axios from 'axios';

const OPENCAGE_API_KEY = 'afb2022d3e894f88ac4243d8c642b6b7';
const OPENCAGE_BASE_URL = 'https://api.opencagedata.com/geocode/v1/json';

class GeocodingService {
  static async geocodeAddress(addressString) {
    try {
      const params = {
        q: addressString,
        key: OPENCAGE_API_KEY,
        limit: 1,
        language: 'es', // Optional: set language for results
        no_annotations: 1, // Optional: simplify response
      };

      const response = await axios.get(OPENCAGE_BASE_URL, { params });

      if (response.status === 200 && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
          formattedAddress: result.formatted,
          // You can add more details if needed, e.g., result.components
        };
      } else {
        console.warn('GeocodingService: No results found for address:', addressString, response.data);
        return null;
      }
    } catch (error) {
      console.error('GeocodingService: Error geocoding address:', addressString, error.response?.data || error.message);
      // Depending on how you want to handle errors, you might throw the error
      // or return a specific error object/null.
      // throw error;
      return null;
    }
  }
}

export default GeocodingService;
