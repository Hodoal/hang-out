import axios from 'axios';

const API_KEY = 'afb2022d3e894f88ac4243d8c642b6b7';
const API_URL = 'https://api.opencagedata.com/geocode/v1/json';

const _formatPlacesResponse = (data) => {
  if (!data || !data.results) {
    return [];
  }
  return data.results.map((result) => {
    // OpenCageData provides components for address details
    const components = result.components;
    let name = 'Unknown Place';
    // Attempt to find a suitable name from components
    if (components) {
      name = components.amenity || components.shop || components.tourism || components.historic || components.building || components.house_number || components.road || components.suburb || components.city || components.country || 'Unknown location';
      if (components.house_number && components.road) {
        name = `${components.road} ${components.house_number}`;
      } else if (components.amenity) {
        name = components.amenity;
      } else if (result.formatted) {
          // Fallback to parts of the formatted address if specific name components are missing
          const parts = result.formatted.split(',');
          name = parts[0]; // Take the first part as a guess for the name
      }
    }


    // Category might be derived from 'type' or other components if available
    let category = components._type || 'Uncategorized';
    if (components.amenity) category = components.amenity;
    else if (components.shop) category = components.shop;
    else if (components.tourism) category = components.tourism;


    return {
      id: result.annotations && result.annotations.geohash ? result.annotations.geohash : `opencage-${Math.random().toString(36).substring(2, 15)}`, // OpenCage doesn't have a stable place ID, geohash can be an alternative or generate one
      name: name,
      category: category,
      rating: null, // OpenCageData is a geocoder, does not provide ratings
      description: result.formatted || 'No description available.', // Use formatted address as description
      address: result.formatted,
      imageUrl: null, // No images from OpenCageData
      latitude: result.geometry.lat,
      longitude: result.geometry.lng,
      raw: result, // Include raw result for potential further use
    };
  });
};

const searchPlaces = async (searchText, location) => {
  try {
    const params = {
      q: searchText,
      key: API_KEY,
      limit: 20, // Default limit
      no_annotations: 0, // Ensure we get annotations for ID generation if possible
    };

    if (location && location.latitude && location.longitude) {
      params.proximity = `${location.latitude},${location.longitude}`;
    }

    const response = await axios.get(API_URL, { params });

    if (response.data && response.data.results) {
      return _formatPlacesResponse(response.data);
    } else {
      console.warn('OpenCageData: No results found in response', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error searching places with OpenCageData:', error.response ? error.response.data : error.message);
    // You might want to throw a custom error or return a specific error object
    return { error: true, message: error.message, details: error.response ? error.response.data : null };
  }
};

export default {
  searchPlaces,
};
