import axios from 'axios';

// NOTA: Esta es una implementación conceptual, necesitarías una API key de Google Places
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';

class GooglePlacesService {
  // Buscar lugares cercanos en Google
  static async searchNearbyPlaces(latitude, longitude, radius = 1500) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${GOOGLE_API_KEY}`
      );
      
      // Transformar los resultados de Google al formato de nuestra aplicación
      const places = response.data.results.map(place => ({
        id: place.place_id,
        name: place.name,
        category: place.types[0],
        rating: place.rating || 0,
        ratingCount: place.user_ratings_total || 0,
        description: '', // Google no proporciona descripciones en esta API
        address: place.vicinity,
        imageUrl: place.photos && place.photos[0] 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` 
          : 'https://via.placeholder.com/600',
        matchingMoods: determineMoodsFromPlaceType(place.types),
      }));
      
      return places;
    } catch (error) {
      console.error('Error fetching Google Places:', error);
      return [];
    }
  }

  // Obtener detalles de un lugar específico
  static async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,photos,types,reviews,price_level&key=${GOOGLE_API_KEY}`
      );
      
      const place = response.data.result;
      
      return {
        id: place.place_id,
        name: place.name,
        category: place.types[0],
        rating: place.rating || 0,
        ratingCount: place.user_ratings_total || 0,
        description: '', // Podríamos combinar reseñas para generar una descripción
        address: place.formatted_address,
        imageUrl: place.photos && place.photos[0] 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}` 
          : 'https://via.placeholder.com/600',
        matchingMoods: determineMoodsFromPlaceType(place.types),
        reviews: transformGoogleReviews(place.reviews),
        priceLevel: place.price_level,
      };
    } catch (error) {
      console.error('Error fetching place details from Google:', error);
      throw error;
    }
  }
}

// Función auxiliar para asignar estados de ánimo según tipo de lugar
function determineMoodsFromPlaceType(types) {
  const moodMap = {
    cafe: ['relaxed', 'creative'],
    restaurant: ['hungry', 'social', 'romantic'],
    bar: ['social'],
    park: ['relaxed', 'happy'],
    amusement_park: ['happy', 'adventurous'],
    aquarium: ['happy', 'adventurous'],
    art_gallery: ['creative'],
    bakery: ['happy', 'hungry'],
    beauty_salon: ['relaxed'],
    book_store: ['relaxed', 'creative'],
    movie_theater: ['social', 'relaxed'],
    museum: ['creative'],
    night_club: ['social'],
    spa: ['relaxed', 'stressed'],
    gym: ['stressed'],
    shopping_mall: ['happy', 'social'],
    tourist_attraction: ['adventurous'],
    zoo: ['happy', 'adventurous'],
    library: ['relaxed', 'creative'],
  };
  
  let moods = new Set();
  
  types.forEach(type => {
    if (moodMap[type]) {
      moodMap[type].forEach(mood => moods.add(mood));
    }
  });
  
  return Array.from(moods);
}

// Transformar reseñas de Google al formato de nuestra aplicación
function transformGoogleReviews(googleReviews) {
  if (!googleReviews) return [];
  
  return googleReviews.map((review, index) => ({
    id: `google_${index}`,
    userId: `google_user_${index}`,
    text: review.text,
    rating: review.rating,
    date: review.time * 1000, // Convertir tiempo UNIX a timestamp
    isAnonymous: true, // Tratamos todas las reseñas de Google como anónimas
    authorName: review.author_name,
  }));
}

export default GooglePlacesService;