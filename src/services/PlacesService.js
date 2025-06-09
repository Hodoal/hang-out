import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GeoapifyService from './GeoapifyService';
import OpenCageDataService from './OpenCageDataService';

// Configuración de la API de Foursquare
const FOURSQUARE_API_KEY = 'fsq37BHNc1hwc8F7vuLO+tXjE8vck+JuJzkiLyGtRBPabUc='; // Reemplazar con tu API key de Foursquare
const FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3';

// Headers requeridos para la API de Foursquare
const foursquareHeaders = {
  'Accept': 'application/json',
  'Authorization': FOURSQUARE_API_KEY
};

// Mapeo de estados de ánimo a categorías de Foursquare
const moodToCategoryMap = {
  'relaxed': ['11086', '13003', '10000'], // Salones de té, parques, arte
  'creative': ['10000', '13300', '11000'], // Arte, música, comida
  'social': ['13003', '13065', '12063'], // Parques, bares, eventos
  'adventurous': ['10056', '16000', '16032'], // Senderos, recreación al aire libre, deportes
  'happy': ['10000', '13003', '12063'], // Arte, parques, eventos
  'hungry': ['13065', '13000'], // Restaurantes, comida
  'romantic': ['13065', '10056', '13003'], // Restaurantes, naturaleza, parques
  'stressed': ['11086', '10000', '14000'] // Spa, arte, fitness
};

// Helper function to calculate distance (Haversine formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // Distance in meters
  return distance;
};

class PlacesService {
  static _deDuplicatePlaces(placesArray) {
    const uniquePlaces = [];
    const ids = new Set();
    const nameCoordKeys = new Set(); // For places without stable IDs or from different sources

    for (const place of placesArray) {
      if (place.error) continue; // Skip error objects

      let uniqueKey;
      if (place.id && !ids.has(place.id)) {
        ids.add(place.id);
        uniquePlaces.push(place);
        // Add a name-coord key as well to catch duplicates with different IDs but same location/name
        if (place.name && place.latitude && place.longitude) {
           const name = place.name.toLowerCase().trim();
           const lat = parseFloat(place.latitude).toFixed(4); // Rounded to ~10m precision
           const lon = parseFloat(place.longitude).toFixed(4);
           nameCoordKeys.add(`${name}-${lat}-${lon}`);
        }
      } else if (place.name && place.latitude && place.longitude) {
        const name = place.name.toLowerCase().trim();
        // Round coordinates to ~4 decimal places (approx 10-meter precision) for comparison
        const lat = parseFloat(place.latitude).toFixed(4);
        const lon = parseFloat(place.longitude).toFixed(4);
        uniqueKey = `${name}-${lat}-${lon}`;

        if (!nameCoordKeys.has(uniqueKey)) {
          nameCoordKeys.add(uniqueKey);
          // If ID was already present but this is a different place by name/coords, add it.
          // Or if ID was missing.
          if (!place.id || !ids.has(place.id)) {
             uniquePlaces.push(place);
             if(place.id) ids.add(place.id); // Add ID if it exists
          } else {
            // If ID exists and was already added, but this one has a slightly different name/coords key,
            // we need to check if it's a true duplicate or a distinct place from a different source.
            // For simplicity, if ID is already processed, we assume it's a duplicate for now.
            // More sophisticated logic could compare distances.
          }
        }
      } else {
        // If no ID and no sufficient name/coordinate data, we cannot reliably deduplicate.
        // Add it, or decide on a strategy (e.g. skip if name is missing)
        // For now, adding if it has a name.
        if (place.name) {
            uniquePlaces.push(place);
        }
      }
    }
    return uniquePlaces;
  }
  // Obtener lugares populares
  static async getPopularPlaces(location = null) {
    let popularPlaces = [];
    try {
      if (location && location.latitude && location.longitude) {
        // Fetch from Geoapify if location is provided
        const geoapifyPopular = await GeoapifyService.searchPlaces(
          null, // No specific search text, rely on categories and location
          location,
          ['tourism', 'entertainment', 'catering', 'landmark', 'accommodation.hotel'] // Broader categories for popular
        );
        if (geoapifyPopular && !geoapifyPopular.error) {
          popularPlaces = popularPlaces.concat(geoapifyPopular);
        }
      } else {
        // Fallback to Foursquare if no location or if Geoapify fails (though Geoapify handles its own errors)
        const response = await axios.get(`${FOURSQUARE_BASE_URL}/places/search`, {
          headers: foursquareHeaders,
          params: {
            sort: 'POPULARITY',
            limit: 10
          }
        });
        if (response.data && response.data.results) {
          popularPlaces = popularPlaces.concat(this._formatPlacesResponse(response.data.results));
        }
      }
      return this._deDuplicatePlaces(popularPlaces);
    } catch (error) {
      console.error('Error fetching popular places:', error.response ? error.response.data : error.message);
      return []; // Return empty or an error object
    }
  }

  // Buscar lugares por término
  static async searchPlaces(searchTerm, location = null) {
    let allResults = [];
    const services = [
      { name: 'Foursquare', service: axios.get, paramsKey: 'fsq' },
      { name: 'Geoapify', service: GeoapifyService.searchPlaces, paramsKey: 'geo' },
      { name: 'OpenCageData', service: OpenCageDataService.searchPlaces, paramsKey: 'ocd' }
    ];

    const fsqParams = {
      query: searchTerm,
      limit: 15
    };
    if (location && location.latitude && location.longitude) {
      fsqParams.ll = `${location.latitude},${location.longitude}`;
    }

    try {
      const fsqResponse = await axios.get(`${FOURSQUARE_BASE_URL}/places/search`, {
        headers: foursquareHeaders,
        params: fsqParams
      });
      if (fsqResponse.data && fsqResponse.data.results) {
        allResults = allResults.concat(this._formatPlacesResponse(fsqResponse.data.results));
      }
    } catch (error) {
      console.error('Error searching Foursquare:', error.response ? error.response.data : error.message);
    }

    try {
      const geoapifyResults = await GeoapifyService.searchPlaces(searchTerm, location);
      if (geoapifyResults && !geoapifyResults.error) {
        allResults = allResults.concat(geoapifyResults);
      } else if (geoapifyResults && geoapifyResults.error) {
        console.error('Error searching Geoapify:', geoapifyResults.message);
      }
    } catch (error) { // Catch errors if GeoapifyService itself throws
        console.error('Error calling GeoapifyService.searchPlaces:', error.message);
    }

    try {
      const openCageResults = await OpenCageDataService.searchPlaces(searchTerm, location);
      if (openCageResults && !openCageResults.error) {
        allResults = allResults.concat(openCageResults);
      } else if (openCageResults && openCageResults.error) {
        console.error('Error searching OpenCageData:', openCageResults.message);
      }
    } catch (error) { // Catch errors if OpenCageDataService itself throws
        console.error('Error calling OpenCageDataService.searchPlaces:', error.message);
    }

    return this._deDuplicatePlaces(allResults);
  }

  // Obtener recomendaciones basadas en estado de ánimo
  static async getRecommendationsByMood(mood, userId, location = null) {
    let recommendations = [];
    const fsqCategories = moodToCategoryMap[mood.toLowerCase()] || [];

    // Foursquare recommendations
    if (fsqCategories.length > 0) {
      const fsqParams = {
        categories: fsqCategories.join(','),
        sort: 'RATING', // Keep rating sort for Foursquare
        limit: 10
      };
      if (location && location.latitude && location.longitude) {
        fsqParams.ll = `${location.latitude},${location.longitude}`;
        fsqParams.radius = 10000; // 10km radius for mood-based recommendations
      }
      try {
        const response = await axios.get(`${FOURSQUARE_BASE_URL}/places/search`, {
          headers: foursquareHeaders,
          params: fsqParams
        });
        if (response.data && response.data.results) {
          recommendations = recommendations.concat(this._formatPlacesResponse(response.data.results));
        }
      } catch (error) {
        console.error('Error fetching Foursquare recommendations:', error.response ? error.response.data : error.message);
      }
    }

    // Geoapify recommendations
    // Map Foursquare mood to Geoapify categories or use mood as search term
    let geoapifySearchText = mood; // Default to mood as search text
    let geoapifyCategories = [];

    // Example: Simple mapping for "relaxed" mood, can be expanded
    if (mood.toLowerCase() === 'relaxed') {
      geoapifyCategories = ['leisure.park', 'natural.nature_reserve', 'amenity.cafe', 'tourism.attraction'];
      geoapifySearchText = 'quiet places'; // More specific search text
    } else if (mood.toLowerCase() === 'adventurous') {
        geoapifyCategories = ['sport', 'natural', 'tourism.attraction', 'activity'];
        geoapifySearchText = 'adventure activities';
    } else if (mood.toLowerCase() === 'hungry') {
        geoapifyCategories = ['catering.restaurant', 'catering.fast_food', 'catering.cafe', 'catering.food_court'];
        geoapifySearchText = 'food';
    } else if (mood.toLowerCase() === 'creative') {
        geoapifyCategories = ['entertainment.culture', 'building.historic', 'tourism.artwork', 'education.library'];
        geoapifySearchText = 'art gallery museum';
    }
    // Add more mappings as needed

    if (location && location.latitude && location.longitude) {
      try {
        const geoapifyRecs = await GeoapifyService.searchPlaces(
          geoapifySearchText,
          location,
          geoapifyCategories.length > 0 ? geoapifyCategories : ['tourism', 'entertainment', 'catering', 'leisure'] // Default broad if no specific mapping
        );
        if (geoapifyRecs && !geoapifyRecs.error) {
          recommendations = recommendations.concat(geoapifyRecs);
        } else if (geoapifyRecs && geoapifyRecs.error) {
          console.error('Error fetching Geoapify recommendations:', geoapifyRecs.message);
        }
      } catch (error) {
         console.error('Error calling GeoapifyService for recommendations:', error.message);
      }
    }

    let uniqueRecommendations = this._deDuplicatePlaces(recommendations);
      
      // Añadir matchPercentage a cada recomendación
      uniqueRecommendations = uniqueRecommendations.map(place => ({
        ...place,
        matchPercentage: Math.floor(Math.random() * 20) + 80, // Simular porcentaje entre 80-100%
        userFeedback: null // Initialize feedback
      }));
      
      // Recuperar feedback previo del usuario
      try {
        const storedFeedback = await AsyncStorage.getItem(`feedback_${userId}`);
        if (storedFeedback) {
          const feedbackData = JSON.parse(storedFeedback);
          
          uniqueRecommendations = uniqueRecommendations.map(place => ({
            ...place,
            userFeedback: feedbackData[place.id] || null
          }));
        }
      } catch (err) {
        console.error('Error retrieving feedback', err);
      }
      
      return uniqueRecommendations;
    // } catch (error) { // This was the original end of the try block for getRecommendationsByMood
    //   console.error('Error fetching recommendations:', error);
    //   return [];
    // }
    // The try-catch for getRecommendationsByMood was implicitly closed by the previous SEARCH block end.
    // For safety, explicitly ending the function here if the above was the intended scope.
    // However, the original code structure implies the try-catch should wrap the feedback logic too.
    // The following line was the original end of the function, assuming the try-catch is correctly scoped by the initial part of the function.
  } // This closes getRecommendationsByMood. The try-catch is handled by the surrounding structure.

  // Proporcionar feedback sobre un lugar
  static async provideFeedback(placeId, userId, liked) {
    try {
      // Almacenar feedback localmente ya que Foursquare no admite esta función
      try {
        let feedbackData = {};
        const storedFeedback = await AsyncStorage.getItem(`feedback_${userId}`);
        
        if (storedFeedback) {
          feedbackData = JSON.parse(storedFeedback);
        }
        
        feedbackData[placeId] = liked ? 'liked' : 'disliked';
        
        await AsyncStorage.setItem(`feedback_${userId}`, JSON.stringify(feedbackData));
        return true;
      } catch (err) {
        console.error('Error storing feedback', err);
        throw new Error('Error storing feedback');
      }
    } catch (error) {
      console.error('Error providing feedback:', error);
      throw error;
    }
  }

  // Obtener detalles de un lugar por ID
  static async getPlaceById(placeId) {
    try {
      const response = await axios.get(`${FOURSQUARE_BASE_URL}/places/${placeId}`, {
        headers: foursquareHeaders
      });
      
      return this._formatPlaceDetails(response.data);
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  }

  // Obtener reseñas de un lugar (Foursquare API v3 no ofrece endpoints para reseñas públicas,
  // pero podemos obtener algunas valoraciones y tips)
  static async getPlaceReviews(placeId) {
    try {
      const response = await axios.get(`${FOURSQUARE_BASE_URL}/places/${placeId}/tips`, {
        headers: foursquareHeaders,
        params: {
          limit: 10
        }
      });
      
      return this._formatReviews(response.data.results, placeId);
    } catch (error) {
      console.error('Error fetching place reviews:', error);
      return [];
    }
  }

  // Añadir reseña a un lugar - esto es solo local ya que Foursquare no permite añadir tips mediante API
  static async addReview(placeId, userId, text, rating) {
    try {
      // Almacenar la reseña localmente
      const newReview = {
        id: `review_${Date.now()}`,
        placeId,
        userId,
        text,
        rating,
        date: new Date().toISOString(),
        isAnonymous: true
      };
      
      // Guardar en AsyncStorage
      try {
        const storedReviews = await AsyncStorage.getItem('user_reviews');
        let reviews = storedReviews ? JSON.parse(storedReviews) : [];
        
        reviews.push(newReview);
        await AsyncStorage.setItem('user_reviews', JSON.stringify(reviews));
        
        return {
          success: true,
          reviewId: newReview.id
        };
      } catch (err) {
        console.error('Error storing review', err);
        throw new Error('Error storing review');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }

  // Métodos auxiliares para formatear las respuestas de la API
  static _formatPlacesResponse(places) {
    return places.map(place => ({
      id: place.fsq_id,
      name: place.name,
      category: place.categories && place.categories.length > 0 
        ? place.categories[0].name 
        : 'Lugar',
      rating: place.rating ? place.rating / 2 : 4.0, // Foursquare usa escala 0-10, convirtiendo a 0-5
      ratingCount: place.stats?.total_ratings || 0,
      description: place.description || `${place.name} es un lugar popular en la categoría ${place.categories?.[0]?.name || 'General'}.`,
      address: this._formatAddress(place.location),
      imageUrl: place.photos && place.photos.length > 0 
        ? `${place.photos[0].prefix}original${place.photos[0].suffix}` 
        : 'https://via.placeholder.com/600/92c952',
      matchingMoods: this._getMoodsFromCategories(place.categories),
      latitude: place.geocodes?.main?.latitude,
      longitude: place.geocodes?.main?.longitude
    }));
  }
  
  static _formatPlaceDetails(place) {
    return {
      id: place.fsq_id,
      name: place.name,
      category: place.categories && place.categories.length > 0 
        ? place.categories[0].name 
        : 'Lugar',
      rating: place.rating ? place.rating / 2 : 4.0,
      ratingCount: place.stats?.total_ratings || 0,
      description: place.description || `${place.name} es un lugar popular en la categoría ${place.categories?.[0]?.name || 'General'}.`,
      address: this._formatAddress(place.location),
      imageUrl: place.photos && place.photos.length > 0 
        ? `${place.photos[0].prefix}original${place.photos[0].suffix}` 
        : 'https://via.placeholder.com/600/92c952',
      matchingMoods: this._getMoodsFromCategories(place.categories),
      latitude: place.geocodes?.main?.latitude,
      longitude: place.geocodes?.main?.longitude,
      hours: place.hours?.display || 'Horario no disponible',
      tel: place.tel || 'Teléfono no disponible',
      website: place.website || ''
    };
  }
  
  static _formatReviews(tips, placeId) {
    return tips.map(tip => ({
      id: tip.id,
      placeId: placeId,
      userId: 'anon_user',
      rating: 4, // Los tips en Foursquare no incluyen valoración numérica
      text: tip.text,
      date: tip.created_at,
      isAnonymous: true
    }));
  }
  
  static _formatAddress(location) {
    if (!location) return 'Dirección no disponible';
    
    const addressParts = [
      location.address,
      location.locality,
      location.region,
      location.postcode,
      location.country
    ].filter(Boolean);
    
    return addressParts.join(', ');
  }
  
  static _getMoodsFromCategories(categories) {
    if (!categories || categories.length === 0) return ['social']; // Default mood
    
    const moods = new Set();
    
    // Mapeo inverso para encontrar estados de ánimo basados en categorías
    for (const category of categories) {
      for (const [mood, categoryIds] of Object.entries(moodToCategoryMap)) {
        if (categoryIds.includes(category.id)) {
          moods.add(mood);
        }
      }
    }
    
    // Si no se encontraron coincidencias, devuelve algunos estados de ánimo por defecto
    if (moods.size === 0) {
      // Mapeo básico basado en nombres comunes de categorías
      const categoryName = categories[0].name.toLowerCase();
      if (categoryName.includes('restaurant') || categoryName.includes('food')) {
        moods.add('hungry');
      }
      if (categoryName.includes('park') || categoryName.includes('nature')) {
        moods.add('relaxed');
        moods.add('happy');
      }
      if (categoryName.includes('bar') || categoryName.includes('club')) {
        moods.add('social');
      }
      if (categoryName.includes('museum') || categoryName.includes('art')) {
        moods.add('creative');
      }
      
      // Si todavía está vacío, añadir un estado de ánimo por defecto
      if (moods.size === 0) {
        moods.add('social');
      }
    }
    
    return [...moods];
  }
}

export default PlacesService;