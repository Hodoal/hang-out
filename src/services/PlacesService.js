import AsyncStorage from '@react-native-async-storage/async-storage';
import OpenCageService from './OpenCageService'; // Import OpenCageService

// Placeholder para la API Key, el usuario debe reemplazarla en OpenCageService.js
// Nota: axios ya no es necesario aquí si OpenCageService usa fetch

class PlacesService {
  // Obtener lugares populares
  static async getPopularPlaces() {
    try {
      // Usar una consulta genérica para lugares populares, por ejemplo, "puntos de interés"
      // o una ubicación específica si estuviera disponible (ej. "atracciones en Nueva York")
      // OpenCageService.getPlaces ya devuelve el formato esperado.
      const places = await OpenCageService.getPlaces("points of interest", { limit: 10 });
      return places;
    } catch (error) {
      console.error('Error fetching popular places from OpenCage:', error);
      return [];
    }
  }

  // Buscar lugares por término
  static async searchPlaces(query) {
    try {
      const placesData = await OpenCageService.getPlaces(query);
      // Simulate an image URL if not provided by the API
      const placesWithImages = placesData.map((place) => ({
        ...place,
        imageUrl: place.imageUrl || `https://picsum.photos/seed/${place.id}/300/200`,
      }));
      return placesWithImages;
    } catch (error) { // Double-check this block
      console.error('Error searching places with OpenCage:', error);
      return [];
    }
  }

  // Obtener recomendaciones basadas en estado de ánimo
  static async getRecommendationsByMood(mood, userId) {
    try {
      // Para OpenCage, podríamos buscar tipos de lugares generales que se alineen con los estados de ánimo.
      // O, si OpenCageService.determineMoodsFromPlaceType es suficientemente bueno,
      // podríamos obtener una lista más amplia de lugares y filtrarlos.
      // Por ahora, buscaremos lugares relacionados con el estado de ánimo.
      // Esta es una simplificación y podría necesitar una lógica más avanzada.
      let queryForMood = mood; // Usar el estado de ánimo directamente como consulta
      switch (mood.toLowerCase()) {
        case 'relaxed':
          queryForMood = 'parques o cafes tranquilos';
          break;
        case 'creative':
          queryForMood = 'museos o galerias de arte';
          break;
        case 'social':
          queryForMood = 'bares o lugares de encuentro populares';
          break;
        case 'adventurous':
          queryForMood = 'lugares de aventura o actividades al aire libre';
          break;
        case 'happy':
          queryForMood = 'lugares divertidos o de entretenimiento';
          break;
        case 'hungry':
          queryForMood = 'restaurantes o comida';
          break;
        case 'romantic':
          queryForMood = 'restaurantes romanticos o vistas panoramicas';
          break;
        case 'stressed':
          queryForMood = 'spas o lugares de relajacion';
          break;
        default:
          queryForMood = `lugares ${mood}`; // Consulta genérica
      }

      let recommendations = await OpenCageService.getPlaces(queryForMood, { limit: 10 });

      // Añadir matchPercentage y filtrar por matchingMoods si es necesario
      recommendations = recommendations
        .filter(place => place.matchingMoods && place.matchingMoods.includes(mood.toLowerCase()))
        .map((place) => ({
          ...place,
          matchPercentage: Math.floor(Math.random() * 20) + 80, // Simular porcentaje
          userFeedback: null,
        }));

      // Si después de filtrar por mood, no quedan recomendaciones, podemos buscar de nuevo
      // con una consulta más genérica o simplemente devolver una lista vacía.
      // Por ahora, si el filtro inicial no devuelve nada, podría ser que la consulta
      // y el `determineMoodsFromPlaceType` no están perfectamente alineados.

      // Recuperar feedback previo del usuario (esta lógica puede permanecer)
      try {
        const storedFeedback = await AsyncStorage.getItem(`feedback_${userId}`);
        if (storedFeedback) {
          const feedbackData = JSON.parse(storedFeedback);
          return recommendations.map((place) => ({
            ...place,
            userFeedback: feedbackData[place.id] || null, // place.id ahora es de OpenCage
          }));
        }
      } catch (err) {
        console.error('Error retrieving feedback', err);
      }

      return recommendations;
    } catch (error) {
      console.error('Error fetching recommendations with OpenCage:', error);
      return [];
    }
  }

  // Proporcionar feedback sobre un lugar (la lógica de AsyncStorage puede permanecer)
  static async provideFeedback(placeId, userId, liked) {
    try {
      let feedbackData = {};
      const storedFeedback = await AsyncStorage.getItem(`feedback_${userId}`);

      if (storedFeedback) {
        feedbackData = JSON.parse(storedFeedback);
      }

      feedbackData[placeId] = liked ? 'liked' : 'disliked'; // placeId ahora es de OpenCage

      await AsyncStorage.setItem(
        `feedback_${userId}`,
        JSON.stringify(feedbackData)
      );
      return true;
    } catch (err) {
      console.error('Error storing feedback', err);
      throw new Error('Error storing feedback');
    }
  }

  // Obtener detalles de un lugar por ID
  // OpenCage no tiene un endpoint "details" separado como Google o Foursquare.
  // La información principal ya viene en la respuesta de `getPlaces`.
  // Si el ID es una coordenada o geohash, podríamos hacer una búsqueda específica.
  static async getPlaceById(placeId) {
    try {
      // Asumimos que placeId podría ser una query específica (nombre, dirección, o geohash)
      // Y esperamos que OpenCage devuelva el lugar más relevante como primer resultado.
      const places = await OpenCageService.getPlaces(placeId, { limit: 1 });
      if (places && places.length > 0) {
        // Podríamos añadir información adicional si OpenCageService la proveyera para "detalles"
        // Por ahora, el formato es el mismo que el de la lista.
        return places[0];
      }
      throw new Error('Place not found or ID not specific enough for OpenCage');
    } catch (error) {
      console.error('Error fetching place details with OpenCage:', error);
      throw error;
    }
  }

  // Obtener reseñas de un lugar - OpenCage no provee reseñas.
  // Esta función dependerá de cómo se manejen las reseñas (localmente o con otro servicio).
  // Por ahora, la dejamos devolviendo un array vacío o manteniendo la lógica local si existe.
  static async getPlaceReviews(placeId) {
    console.warn("OpenCage does not provide place reviews. Review functionality might be local.");
    // Si las reseñas se almacenan localmente (como en el código original para Foursquare)
    // esa lógica podría adaptarse aquí. Por ahora, devolvemos vacío.
    try {
        const storedReviews = await AsyncStorage.getItem('user_reviews');
        if (storedReviews) {
            const allReviews = JSON.parse(storedReviews);
            // Filtrar reseñas por placeId (el ID ahora es de OpenCage)
            return allReviews.filter(review => review.placeId === placeId);
        }
        return [];
    } catch (err) {
        console.error('Error retrieving local reviews', err);
        return [];
    }
  }

  // Añadir reseña a un lugar - Esta lógica es local y puede permanecer.
  static async addReview(placeId, userId, text, rating) {
    try {
      const newReview = {
        id: `review_${Date.now()}`,
        placeId, // placeId ahora es de OpenCage
        userId,
        text,
        rating,
        date: new Date().toISOString(),
        isAnonymous: true, // O según la lógica de la app
      };

      const storedReviews = await AsyncStorage.getItem('user_reviews');
      let reviews = storedReviews ? JSON.parse(storedReviews) : [];
      reviews.push(newReview);
      await AsyncStorage.setItem('user_reviews', JSON.stringify(reviews));

      return {
        success: true,
        reviewId: newReview.id,
      };
    } catch (err) {
      console.error('Error storing review locally', err);
      throw new Error('Error storing review');
    }
  }

  // Ya no se necesitan los métodos _formatPlacesResponse, _formatPlaceDetails,
  // _formatReviews, _formatAddress, _getMoodsFromCategories de Foursquare
  // ya que OpenCageService se encarga de su propio formato y mapeo de moods.
}

export default PlacesService;
