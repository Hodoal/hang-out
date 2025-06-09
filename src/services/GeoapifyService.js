import axios from 'axios';

const API_KEY = '198d534fadd94e3cb31bf88d646d4046';
const API_URL = 'https://api.geoapify.com/v2/places';

const _formatPlacesResponse = (places) => {
  if (!places || !places.features) {
    return [];
  }
  return places.features.map((place) => {
    const properties = place.properties;
    return {
      id: properties.place_id,
      name: properties.name || properties.address_line1 || 'Unknown Place',
      category: properties.categories && properties.categories.length > 0 ? properties.categories.join(', ') : 'Uncategorized',
      // Geoapify 'places' endpoint doesn't typically provide detailed ratings or descriptions for all places.
      // These might come from 'place-details' endpoint or might not be available.
      rating: properties.rating || null, // Assuming rating might exist, otherwise null
      description: properties.datasource && properties.datasource.raw && properties.datasource.raw.description ? properties.datasource.raw.description : 'No description available.',
      address: properties.formatted,
      imageUrl: null, // Geoapify 'places' might not directly provide images.
                      // This might require another call or be unavailable.
      latitude: properties.lat,
      longitude: properties.lon,
      distance: properties.distance, // If available from API (e.g. when using bias/filter)
      raw: properties, // Include raw properties for potential further use
    };
  });
};

const searchPlaces = async (searchText, location, categories = ['tourism', 'entertainment', 'catering']) => {
  try {
    const params = {
      text: searchText,
      apiKey: API_KEY,
      categories: categories.join(','),
      limit: 20, // Default limit
    };

    if (location && location.latitude && location.longitude) {
      params.filter = `circle:${location.longitude},${location.latitude},5000`; // 5km radius
      params.bias = `proximity:${location.longitude},${location.latitude}`;
    }

    const response = await axios.get(API_URL, { params });

    if (response.data && response.data.features) {
      return _formatPlacesResponse(response.data);
    } else {
      console.warn('Geoapify: No features found in response', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error searching places with Geoapify:', error.response ? error.response.data : error.message);
    // You might want to throw a custom error or return a specific error object
    return { error: true, message: error.message, details: error.response ? error.response.data : null };
  }
};

export default {
  searchPlaces,
};
