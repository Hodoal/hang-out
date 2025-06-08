import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Image, Button, Divider, Rating } from 'react-native-elements';
import AuthContext from '../context/AuthContext';
import PlacesService from '../services/PlacesService';

const PlaceDetailScreen = ({ route, navigation }) => {
  const { placeId } = route.params;
  const { userId } = useContext(AuthContext);
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchPlaceDetails();
  }, [placeId]);

  const fetchPlaceDetails = async () => {
    setLoading(true);
    try {
      const placeDetails = await PlacesService.getPlaceById(placeId);
      setPlace(placeDetails);

      const placeReviews = await PlacesService.getPlaceReviews(placeId);
      setReviews(placeReviews);
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (userRating === 0) {
      alert('Por favor, selecciona una calificación');
      return;
    }

    try {
      await PlacesService.addReview(placeId, userId, userReview, userRating);
      // Crear un identificador único para la revisión
      const newReview = {
        id: `temp_${Date.now()}`,
        userId: userId,
        text: userReview,
        rating: userRating,
        date: new Date().toISOString(),
        isAnonymous: true,
      };

      setReviews([newReview, ...reviews]);
      setUserReview('');
      setUserRating(0);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('No se pudo enviar la reseña. Intente nuevamente más tarde.');
    }
  };

  if (loading || !place) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando detalles del lugar...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: place.imageUrl }}
        style={styles.image}
        PlaceholderContent={<Text>Cargando imagen...</Text>}
      />

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{place.name}</Text>

        <View style={styles.ratingContainer}>
          <Rating readonly startingValue={place.rating} imageSize={20} />
          <Text style={styles.ratingText}>({place.ratingCount} reseñas)</Text>
        </View>

        <Text style={styles.category}>{place.category}</Text>
        <Text style={styles.address}>{place.address}</Text>

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>{place.description}</Text>

        <View style={styles.moodMatchContainer}>
          <Text style={styles.sectionTitle}>
            Recomendado para estados de ánimo:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.moodTagsContainer}
          >
            {place.matchingMoods.map((mood) => (
              <View key={mood} style={styles.moodTag}>
                <Text style={styles.moodTagText}>
                  {getMoodDisplayName(mood)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Deja tu reseña (anónima)</Text>
        <Rating
          showRating
          onFinishRating={setUserRating}
          style={styles.userRating}
        />

        <TextInput
          placeholder="Escribe tu reseña aquí..."
          value={userReview}
          onChangeText={setUserReview}
          multiline
          textAlignVertical="top"
          style={styles.reviewInput}
        />

        <Button
          title="Enviar Reseña"
          onPress={submitReview}
          buttonStyle={styles.submitButton}
        />

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Reseñas de usuarios</Text>

        {reviews.length > 0 ? (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>Usuario anónimo</Text>
                <Rating readonly startingValue={review.rating} imageSize={16} />
              </View>
              <Text style={styles.reviewDate}>
                {new Date(review.date).toLocaleDateString()}
              </Text>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noReviewsText}>
            No hay reseñas disponibles. ¡Sé el primero en opinar!
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

// Función auxiliar para mostrar los nombres de estado de ánimo en español
const getMoodDisplayName = (moodId) => {
  const moodMap = {
    happy: 'Feliz',
    relaxed: 'Relajado',
    romantic: 'Romántico',
    adventurous: 'Aventurero',
    hungry: 'Hambriento',
    social: 'Social',
    creative: 'Creativo',
    stressed: 'Estresado',
  };
  return moodMap[moodId] || moodId;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    marginLeft: 10,
    color: '#666',
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 15,
  },
  moodMatchContainer: {
    marginVertical: 10,
  },
  moodTagsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  moodTag: {
    backgroundColor: '#4ecdc4',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  moodTagText: {
    color: 'white',
    fontWeight: 'bold',
  },
  userRating: {
    paddingVertical: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    height: 100,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 5,
  },
  reviewItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewUser: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
export default PlaceDetailScreen;
