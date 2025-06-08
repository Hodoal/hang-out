import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Configuración de la API de OpenTripMap
const OPENTRIPMAP_API_KEY =
  '5ae2e3f221c38a28845f05b68e8857c24cfd3e0eb5603c3e4c696d0c';
const OPENTRIPMAP_BASE_URL = 'https://api.opentripmap.com/0.1/en';

// Mapeo de estados de ánimo a categorías de OpenTripMap
const moodToCategoryMap = {
  relaxed: ['natural', 'gardens_and_parks', 'museums'],
  creative: ['museums', 'cultural', 'architecture'],
  social: ['foods', 'amusements', 'cafes'],
  adventurous: ['natural', 'sport', 'amusements'],
  happy: ['amusements', 'interesting_places', 'foods'],
  hungry: ['foods', 'cafes', 'restaurants'],
  romantic: ['gardens_and_parks', 'historic', 'natural'],
  stressed: ['gardens_and_parks', 'natural', 'beaches'],
};

class PlacesService {
  // Método de prueba para verificar la conexión a la API
  static async testApiConnection() {
    try {
      const response = await axios.get(
        `${OPENTRIPMAP_BASE_URL}/places/radius`,
        {
          params: {
            radius: 1000,
            lon: -74.006, // Nueva York
            lat: 40.7128,
            limit: 1,
            apikey: OPENTRIPMAP_API_KEY,
          },
        }
      );

      console.log('Prueba de conexión API exitosa:', response.status);
      return true;
    } catch (error) {
      console.error(
        'Prueba de conexión API fallida:',
        error.response ? error.response.status : error.message
      );
      console.error(
        'Detalles del error:',
        error.response ? error.response.data : error
      );
      return false;
    }
  }

  // Obtener ubicación actual del dispositivo
  static async getCurrentLocation() {
    try {
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      // Obtener la ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      // Devolver una ubicación por defecto en caso de error
      return {
        latitude: 40.7128, // Nueva York como fallback
        longitude: -74.006,
      };
    }
  }

  // Buscar lugares cercanos a la ubicación actual
  static async getNearbyPlaces(radius = 1000, limit = 15, kinds = []) {
    try {
      // Obtener la ubicación actual
      const currentLocation = await this.getCurrentLocation();

      // Preparar parámetros para la búsqueda
      const params = {
        radius: radius, // Radio en metros
        lon: currentLocation.longitude,
        lat: currentLocation.latitude,
        limit: limit,
        rate: 2, // Lugares con calificación buena
        format: 'json',
        apikey: OPENTRIPMAP_API_KEY,
      };

      // Añadir tipos si se especifican
      if (kinds && kinds.length > 0) {
        params.kinds = kinds.join(',');
      }

      // Realizar la solicitud a la API
      const response = await axios.get(
        `${OPENTRIPMAP_BASE_URL}/places/radius`,
        {
          params: params,
        }
      );

      // Obtener detalles adicionales para cada lugar
      const places = response.data.features;
      const detailedPlaces = [];

      for (const place of places.slice(0, limit)) {
        try {
          const details = await this._getPlaceDetails(place.properties.xid);
          detailedPlaces.push(details);
        } catch (detailError) {
          console.error('Error fetching place details:', detailError);
          // Añadir lugar con datos limitados si no se pueden obtener detalles
          detailedPlaces.push(this._formatBasicPlace(place));
        }
      }

      return detailedPlaces;
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return [];
    }
  }

  // Obtener detalles de un lugar por su XID
  static async _getPlaceDetails(xid) {
    try {
      const response = await axios.get(
        `${OPENTRIPMAP_BASE_URL}/places/xid/${xid}`,
        {
          params: {
            apikey: OPENTRIPMAP_API_KEY,
          },
        }
      );

      return this._formatPlaceDetails(response.data);
    } catch (error) {
      console.error(`Error fetching details for place ${xid}:`, error);
      throw error;
    }
  }

  // Buscar lugares cercanos basados en el estado de ánimo
  static async getNearbyPlacesByMood(mood, radius = 1000, limit = 15) {
    try {
      // Obtener categorías relacionadas con el estado de ánimo
      const kinds = moodToCategoryMap[mood.toLowerCase()] || [];

      if (kinds.length === 0) {
        return [];
      }

      // Usar la función de lugares cercanos con las categorías del estado de ánimo
      return await this.getNearbyPlaces(radius, limit, kinds);
    } catch (error) {
      console.error('Error fetching nearby places by mood:', error);
      return [];
    }
  }

  // Obtener lugares populares
  static async getPopularPlaces() {
    try {
      // Obtener la ubicación actual para mejorar los resultados
      const currentLocation = await this.getCurrentLocation();

      const response = await axios.get(
        `${OPENTRIPMAP_BASE_URL}/places/radius`,
        {
          params: {
            radius: 5000, // Radio más amplio para lugares populares
            lon: currentLocation.longitude,
            lat: currentLocation.latitude,
            limit: 10,
            rate: 3, // Solo lugares con calificación alta
            format: 'json',
            apikey: OPENTRIPMAP_API_KEY,
          },
        }
      );

      // Obtener detalles adicionales para cada lugar
      const places = response.data.features;
      const detailedPlaces = [];

      for (const place of places.slice(0, 10)) {
        try {
          const details = await this._getPlaceDetails(place.properties.xid);
          detailedPlaces.push(details);
        } catch (detailError) {
          console.error('Error fetching place details:', detailError);
          detailedPlaces.push(this._formatBasicPlace(place));
        }
      }

      return detailedPlaces;
    } catch (error) {
      console.error('Error fetching popular places:', error);
      return [];
    }
  }

  // Buscar lugares por término
  static async searchPlaces(searchTerm) {
    try {
      // Obtener la ubicación actual para mejorar los resultados
      const currentLocation = await this.getCurrentLocation();

      // La API no tiene búsqueda por texto, usamos el endpoint de radio
      // y filtramos por nombre en el cliente
      const response = await axios.get(
        `${OPENTRIPMAP_BASE_URL}/places/radius`,
        {
          params: {
            radius: 10000, // Radio más amplio para búsquedas
            lon: currentLocation.longitude,
            lat: currentLocation.latitude,
            limit: 50, // Pedimos más resultados para luego filtrar
            format: 'json',
            apikey: OPENTRIPMAP_API_KEY,
          },
        }
      );

      // Filtrar resultados que contengan el término de búsqueda
      const searchTermLower = searchTerm.toLowerCase();
      const filteredPlaces = response.data.features.filter(
        (place) =>
          place.properties.name &&
          place.properties.name.toLowerCase().includes(searchTermLower)
      );

      // Obtener detalles de los lugares filtrados (limitado a 15)
      const detailedPlaces = [];
      for (const place of filteredPlaces.slice(0, 15)) {
        try {
          const details = await this._getPlaceDetails(place.properties.xid);
          detailedPlaces.push(details);
        } catch (detailError) {
          console.error('Error fetching place details:', detailError);
          detailedPlaces.push(this._formatBasicPlace(place));
        }
      }

      return detailedPlaces;
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  // Obtener recomendaciones basadas en estado de ánimo
  static async getRecommendationsByMood(mood, userId) {
    try {
      // Obtener lugares por estado de ánimo
      const places = await this.getNearbyPlacesByMood(mood, 5000, 10);

      // Añadir matchPercentage a cada recomendación
      let recommendations = places.map((place) => ({
        ...place,
        matchPercentage: Math.floor(Math.random() * 20) + 80, // Simular porcentaje entre 80-100%
        userFeedback: null,
      }));

      // Recuperar feedback previo del usuario
      try {
        const storedFeedback = await AsyncStorage.getItem(`feedback_${userId}`);
        if (storedFeedback) {
          const feedbackData = JSON.parse(storedFeedback);

          return recommendations.map((place) => ({
            ...place,
            userFeedback: feedbackData[place.id] || null,
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

  // Obtener imágenes de un lugar
  static async getPlacePhotos(placeId) {
    try {
      // OpenTripMap no tiene un endpoint específico para fotos adicionales
      // Las imágenes ya se incluyen en los detalles del lugar
      const placeDetails = await this.getPlaceById(placeId);

      if (placeDetails.photos && placeDetails.photos.length > 0) {
        return placeDetails.photos;
      }

      // Si el lugar tiene al menos una imagen, la devolvemos como array
      if (
        placeDetails.imageUrl &&
        !placeDetails.imageUrl.includes('placeholder')
      ) {
        return [
          {
            id: `${placeId}_main`,
            url: placeDetails.imageUrl,
            thumbnailUrl: placeDetails.imageUrl,
            width: 800,
            height: 600,
          },
        ];
      }

      return [];
    } catch (error) {
      console.error('Error fetching place photos:', error);
      return [];
    }
  }

  // Proporcionar feedback sobre un lugar
  static async provideFeedback(placeId, userId, liked) {
    try {
      // Almacenar feedback localmente
      try {
        let feedbackData = {};
        const storedFeedback = await AsyncStorage.getItem(`feedback_${userId}`);

        if (storedFeedback) {
          feedbackData = JSON.parse(storedFeedback);
        }

        feedbackData[placeId] = liked ? 'liked' : 'disliked';

        await AsyncStorage.setItem(
          `feedback_${userId}`,
          JSON.stringify(feedbackData)
        );
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
      const response = await axios.get(
        `${OPENTRIPMAP_BASE_URL}/places/xid/${placeId}`,
        {
          params: {
            apikey: OPENTRIPMAP_API_KEY,
          },
        }
      );

      return this._formatPlaceDetails(response.data);
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  }

  // Obtener reseñas de un lugar
  static async getPlaceReviews(placeId) {
    // OpenTripMap no proporciona reseñas de usuarios
    // Devolvemos datos simulados o almacenados localmente
    try {
      // Intentar obtener reseñas guardadas localmente
      const storedReviews = await AsyncStorage.getItem('user_reviews');
      if (storedReviews) {
        const allReviews = JSON.parse(storedReviews);
        const placeReviews = allReviews.filter(
          (review) => review.placeId === placeId
        );

        if (placeReviews.length > 0) {
          return placeReviews;
        }
      }

      // Si no hay reseñas guardadas, devolvemos un array vacío
      return [];
    } catch (error) {
      console.error('Error fetching place reviews:', error);
      return [];
    }
  }

  // Añadir reseña a un lugar - almacenamiento local
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
        isAnonymous: true,
      };

      // Guardar en AsyncStorage
      try {
        const storedReviews = await AsyncStorage.getItem('user_reviews');
        let reviews = storedReviews ? JSON.parse(storedReviews) : [];

        reviews.push(newReview);
        await AsyncStorage.setItem('user_reviews', JSON.stringify(reviews));

        return {
          success: true,
          reviewId: newReview.id,
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

  // Formatear lugar con datos básicos cuando no se pueden obtener detalles completos
  static _formatBasicPlace(placeData) {
    const properties = placeData.properties;
    const geometry = placeData.geometry;

    return {
      id: properties.xid,
      name: properties.name || 'Lugar sin nombre',
      category: properties.kinds
        ? this._getCategoryFromKinds(properties.kinds)
        : 'Lugar',
      rating: properties.rate || 4.0,
      ratingCount: 0,
      description: `Un interesante lugar para visitar en la categoría ${this._getCategoryFromKinds(properties.kinds)}.`,
      address: properties.address || 'Dirección no disponible',
      imageUrl: 'https://via.placeholder.com/600/92c952',
      distance: properties.dist
        ? `${(properties.dist / 1000).toFixed(1)} km`
        : null,
      matchingMoods: this._getMoodsFromKinds(properties.kinds),
      latitude: geometry.coordinates[1],
      longitude: geometry.coordinates[0],
    };
  }

  // Formatear detalles completos de un lugar
  static _formatPlaceDetails(place) {
    // Verificar si tenemos todos los datos necesarios
    if (!place || !place.name) {
      return {
        id: place?.xid || 'unknown',
        name: 'Lugar sin detalles disponibles',
        category: 'Lugar',
        rating: 4.0,
        ratingCount: 0,
        description: 'No hay información detallada disponible para este lugar.',
        address: 'Dirección no disponible',
        imageUrl: 'https://via.placeholder.com/600/92c952',
        matchingMoods: ['social'],
        latitude: null,
        longitude: null,
      };
    }

    // Preparar la información de imágenes
    let imageUrl = 'https://via.placeholder.com/600/92c952';
    let photos = [];

    if (place.preview && place.preview.source) {
      imageUrl = place.preview.source;
    }

    if (place.image) {
      imageUrl = place.image;
      photos.push({
        id: `${place.xid}_main`,
        url: place.image,
        thumbnailUrl: place.image,
        width: place.preview?.width || 800,
        height: place.preview?.height || 600,
      });
    }

    // Formatear dirección
    let address = 'Dirección no disponible';
    if (place.address) {
      const addressParts = [
        place.address.road,
        place.address.house_number,
        place.address.city,
        place.address.state,
        place.address.postcode,
        place.address.country,
      ].filter(Boolean);

      if (addressParts.length > 0) {
        address = addressParts.join(', ');
      }
    }

    // Determinar categorías y estados de ánimo
    const category = this._getCategoryFromKinds(place.kinds);
    const matchingMoods = this._getMoodsFromKinds(place.kinds);

    // Crear objeto de lugar formateado
    return {
      id: place.xid,
      name: place.name,
      category: category,
      rating: place.rate || 4.0,
      ratingCount: place.wikidata ? 5 : 0, // Simulado: asumimos que lugares con datos de Wikipedia tienen algunas reseñas
      description: place.wikipedia_extracts
        ? place.wikipedia_extracts.text
        : `${place.name} es un lugar interesante en la categoría ${category}.`,
      address: address,
      imageUrl: imageUrl,
      matchingMoods: matchingMoods,
      latitude: place.point?.lat,
      longitude: place.point?.lon,
      hours: place.opening_hours || 'Horario no disponible',
      tel: place.phone || 'Teléfono no disponible',
      website: place.url || '',
      photos: photos,
    };
  }

  // Obtener categoría principal a partir de los tipos (kinds)
  static _getCategoryFromKinds(kinds) {
    if (!kinds) return 'Lugar';

    const kindsList = kinds.split(',');

    // Mapeo de tipos a categorías más amigables
    const kindToCategory = {
      foods: 'Restaurante',
      cafes: 'Café',
      museums: 'Museo',
      historic: 'Sitio Histórico',
      natural: 'Naturaleza',
      gardens_and_parks: 'Parque',
      cultural: 'Cultura',
      architecture: 'Arquitectura',
      amusements: 'Entretenimiento',
      sport: 'Deporte',
      beaches: 'Playa',
      interesting_places: 'Lugar de Interés',
    };

    // Buscar la primera categoría que coincida
    for (const kind of kindsList) {
      if (kindToCategory[kind]) {
        return kindToCategory[kind];
      }
    }

    // Si no hay coincidencias, usar el primer tipo
    return kindsList[0].charAt(0).toUpperCase() + kindsList[0].slice(1);
  }

  // Obtener estados de ánimo a partir de los tipos (kinds)
  static _getMoodsFromKinds(kinds) {
    if (!kinds) return ['social']; // Default mood

    const kindsList = kinds.split(',');
    const moods = new Set();

    // Mapeo inverso para encontrar estados de ánimo basados en categorías
    for (const kind of kindsList) {
      for (const [mood, kindTypes] of Object.entries(moodToCategoryMap)) {
        if (kindTypes.includes(kind)) {
          moods.add(mood);
        }
      }
    }

    // Si no se encontraron coincidencias, devuelve algunos estados de ánimo por defecto
    if (moods.size === 0) {
      if (kinds.includes('foods') || kinds.includes('cafes')) {
        moods.add('hungry');
      }
      if (kinds.includes('gardens_and_parks') || kinds.includes('natural')) {
        moods.add('relaxed');
        moods.add('happy');
      }
      if (kinds.includes('amusements')) {
        moods.add('social');
      }
      if (kinds.includes('museums') || kinds.includes('cultural')) {
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
