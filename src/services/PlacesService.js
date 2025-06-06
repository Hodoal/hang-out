import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

class PlacesService {
  // Obtener lugares populares
  static async getPopularPlaces() {
    try {
      const response = await axios.get(`${FOURSQUARE_BASE_URL}/places/search`, {
        headers: foursquareHeaders,
        params: {
          sort: 'POPULARITY',
          limit: 10
        }
      });
      
      return this._formatPlacesResponse(response.data.results);
    } catch (error) {
      console.error('Error fetching popular places:', error);
      return [];
    }
  }

  // Buscar lugares por término
  static async searchPlaces(searchTerm) {
    try {
      const response = await axios.get(`${FOURSQUARE_BASE_URL}/places/search`, {
        headers: foursquareHeaders,
        params: {
          query: searchTerm,
          limit: 15
        }
      });
      
      return this._formatPlacesResponse(response.data.results);
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  // Obtener recomendaciones basadas en estado de ánimo
  static async getRecommendationsByMood(mood, userId) {
    try {
      // Obtener las categorías relacionadas con el estado de ánimo
      const categories = moodToCategoryMap[mood.toLowerCase()] || [];
      
      if (categories.length === 0) {
        return [];
      }
      
      // Llamar a la API con las categorías relacionadas al estado de ánimo
      const response = await axios.get(`${FOURSQUARE_BASE_URL}/places/search`, {
        headers: foursquareHeaders,
        params: {
          categories: categories.join(','),
          sort: 'RATING',
          limit: 10
        }
      });
      
      let recommendations = this._formatPlacesResponse(response.data.results);
      
      // Añadir matchPercentage a cada recomendación
      recommendations = recommendations.map(place => ({
        ...place,
        matchPercentage: Math.floor(Math.random() * 20) + 80, // Simular porcentaje entre 80-100%
        userFeedback: null
      }));
      
      // Recuperar feedback previo del usuario
      try {
        const storedFeedback = await AsyncStorage.getItem(`feedback_${userId}`);
        if (storedFeedback) {
          const feedbackData = JSON.parse(storedFeedback);
          
          return recommendations.map(place => ({
            ...place,
            userFeedback: feedbackData[place.id] || null
          }));
        }
      } catch (err) {
        console.error('Error retrieving feedback', err);
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

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