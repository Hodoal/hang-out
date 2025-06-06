import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Button, Card, Rating } from 'react-native-elements';
import PlacesContext from '../context/PlacesContext';
import AuthContext from '../context/AuthContext';
import PlacesService from '../services/PlacesService';

const RecommendationScreen = ({ navigation }) => {
  const { preferences } = useContext(PlacesContext);
  const { userId } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [preferences.mood]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Obtener recomendaciones basadas en el estado de ánimo
      const recommendedPlaces = await PlacesService.getRecommendationsByMood(
        preferences.mood,
        userId
      );
      setRecommendations(recommendedPlaces);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (placeId, liked) => {
    try {
      await PlacesService.provideFeedback(placeId, userId, liked);
      // Actualizar la lista después del feedback
      const updatedRecommendations = recommendations.map(place => {
        if (place.id === placeId) {
          return {
            ...place,
            userFeedback: liked ? 'liked' : 'disliked'
          };
        }
        return place;
      });
      setRecommendations(updatedRecommendations);
    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  };

  const renderRecommendationItem = ({ item }) => (
    <Card containerStyle={styles.card}>
      <Card.Title>{item.name}</Card.Title>
      <Card.Divider />
      <Card.Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.category}>{item.category}</Text>
      <Rating
        readonly
        startingValue={item.rating}
        imageSize={20}
        style={styles.rating}
      />
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.matchText}>
        Coincide con tu estado de ánimo: {item.matchPercentage}%
      </Text>
      <View style={styles.feedbackContainer}>
        <Button
          title="Me gusta"
          type={item.userFeedback === 'liked' ? 'solid' : 'outline'}
          buttonStyle={[
            styles.feedbackButton,
            { backgroundColor: item.userFeedback === 'liked' ? '#4CAF50' : 'white' }
          ]}
          titleStyle={{
            color: item.userFeedback === 'liked' ? 'white' : '#4CAF50'
          }}
          onPress={() => handleFeedback(item.id, true)}
          icon={{
            name: 'thumb-up',
            type: 'material',
            color: item.userFeedback === 'liked' ? 'white' : '#4CAF50',
            size: 16
          }}
        />
        <Button
          title="No me gusta"
          type={item.userFeedback === 'disliked' ? 'solid' : 'outline'}
          buttonStyle={[
            styles.feedbackButton,
            { backgroundColor: item.userFeedback === 'disliked' ? '#F44336' : 'white' }
          ]}
          titleStyle={{
            color: item.userFeedback === 'disliked' ? 'white' : '#F44336'
          }}
          onPress={() => handleFeedback(item.id, false)}
          icon={{
            name: 'thumb-down',
            type: 'material',
            color: item.userFeedback === 'disliked' ? 'white' : '#F44336',
            size: 16
          }}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Recomendaciones para cuando te sientes{' '}
        <Text style={styles.moodHighlight}>{getMoodDisplayName(preferences.mood)}</Text>
      </Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <>
          {recommendations.length > 0 ? (
            <FlatList
              data={recommendations}
              renderItem={renderRecommendationItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No hay recomendaciones para este estado de ánimo por el momento.
              </Text>
              <Button
                title="Cambiar estado de ánimo"
                onPress={() => navigation.navigate('Mood')}
                buttonStyle={styles.changeButton}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
};

// Función auxiliar para mostrar los nombres de estado de ánimo en español
const getMoodDisplayName = (moodId) => {
  const moodMap = {
    happy: 'feliz',
    relaxed: 'relajado',
    romantic: 'romántico',
    adventurous: 'aventurero',
    hungry: 'hambriento',
    social: 'social',
    creative: 'creativo',
    stressed: 'estresado',
  };
  return moodMap[moodId] || moodId;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  moodHighlight: {
    color: '#FF6B6B',
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 10,
    marginBottom: 15,
  },
  image: {
    height: 200,
    borderRadius: 5,
  },
  category: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  rating: {
    marginVertical: 10,
    alignItems: 'flex-start',
  },
  description: {
    marginBottom: 10,
    color: '#333',
  },
  matchText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  feedbackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  feedbackButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  changeButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingHorizontal: 20,
  },
});

export default RecommendationScreen;
