import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Button, Card, SearchBar } from 'react-native-elements';
import PlacesContext from '../context/PlacesContext';
import PlacesService from '../services/PlacesService';

const HomeScreen = ({ navigation }) => {
  const { places, setPlaces, preferences } = useContext(PlacesContext);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    fetchInitialPlaces();
  }, []);

  const fetchInitialPlaces = async () => {
    setLoading(true);
    try {
      const placesData = await PlacesService.getPopularPlaces();
      setPlaces(placesData);
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (search.trim()) {
      setLoading(true);
      try {
        const searchResults = await PlacesService.searchPlaces(search);
        setPlaces(searchResults);
      } catch (error) {
        console.error('Error searching places:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderPlaceItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
    >
      <Card>
        <Card.Title>{item.name}</Card.Title>
        <Card.Divider />
        <Card.Image source={{ uri: item.imageUrl }} />
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.rating}>Rating: {item.rating}/5</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="Buscar lugares..."
        onChangeText={setSearch}
        value={search}
        onSubmitEditing={handleSearch}
        platform="default"
        containerStyle={styles.searchContainer}
      />

      {preferences.mood && (
        <TouchableOpacity
          style={styles.moodBanner}
          onPress={() => navigation.navigate('Recommendation')}
        >
          <Text style={styles.moodText}>
            Recomendaciones para tu estado de ánimo: {preferences.mood}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={places}
        renderItem={renderPlaceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <Button
        title="¿Cómo te sientes hoy?"
        onPress={() => navigation.navigate('Mood')}
        buttonStyle={styles.moodButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    paddingHorizontal: 0,
  },
  listContainer: {
    paddingBottom: 80,
  },
  moodButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  moodBanner: {
    backgroundColor: '#4ecdc4',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  moodText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  category: {
    marginTop: 5,
    color: '#666',
  },
  rating: {
    marginTop: 5,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 5,
    color: '#333',
  },
});

export default HomeScreen;

