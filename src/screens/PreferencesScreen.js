import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';

const API_URL = 'http://your-backend-url.com/api'; // Reemplazar con tu URL real

const moods = [
  { id: 'relaxed', label: 'Relajado', icon: 'customerservice' },
  { id: 'adventurous', label: 'Aventurero', icon: 'rocket1' },
  { id: 'romantic', label: 'Romántico', icon: 'heart' },
  { id: 'cultural', label: 'Cultural', icon: 'book' },
  { id: 'party', label: 'Fiestero', icon: 'star' },
  { id: 'foodie', label: 'Gourmet', icon: 'coffee' },
  { id: 'nature', label: 'Amante de la naturaleza', icon: 'tree' },
  { id: 'shopping', label: 'Compras', icon: 'shoppingcart' }
];

const placeTypes = [
  { id: 'restaurants', label: 'Restaurantes' },
  { id: 'museums', label: 'Museos' },
  { id: 'parks', label: 'Parques' },
  { id: 'bars', label: 'Bares' },
  { id: 'beaches', label: 'Playas' },
  { id: 'historical', label: 'Sitios históricos' },
  { id: 'shopping', label: 'Centros comerciales' },
  { id: 'entertainment', label: 'Entretenimiento' }
];

const PreferencesSetupScreen = ({ navigation }) => {
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedPlaceTypes, setSelectedPlaceTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleMood = (moodId) => {
    if (selectedMoods.includes(moodId)) {
      setSelectedMoods(selectedMoods.filter(id => id !== moodId));
    } else {
      // Limitar a máximo 3 estados de ánimo
      if (selectedMoods.length < 3) {
        setSelectedMoods([...selectedMoods, moodId]);
      } else {
        Alert.alert('Límite alcanzado', 'Puedes seleccionar hasta 3 estados de ánimo');
      }
    }
  };

  const togglePlaceType = (placeTypeId) => {
    if (selectedPlaceTypes.includes(placeTypeId)) {
      setSelectedPlaceTypes(selectedPlaceTypes.filter(id => id !== placeTypeId));
    } else {
      // Limitar a máximo 5 tipos de lugares
      if (selectedPlaceTypes.length < 5) {
        setSelectedPlaceTypes([...selectedPlaceTypes, placeTypeId]);
      } else {
        Alert.alert('Límite alcanzado', 'Puedes seleccionar hasta 5 tipos de lugares');
      }
    }
  };

  const savePreferences = async () => {
    if (selectedMoods.length === 0 || selectedPlaceTypes.length === 0) {
      Alert.alert('Selección incompleta', 'Por favor selecciona al menos un estado de ánimo y un tipo de lugar');
      return;
    }

    setLoading(true);

    try {
      // Obtener token y datos del usuario
      const token = await AsyncStorage.getItem('userToken');
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));

      // Enviar preferencias al backend
      const response = await axios.post(
        `${API_URL}/users/${userData.id}/preferences`,
        {
          moods: selectedMoods,
          placeTypes: selectedPlaceTypes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Actualizar datos del usuario en AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify({
        ...userData,
        hasCompletedPreferences: true,
        preferences: response.data.preferences
      }));

      // Navegar a la pantalla principal
      navigation.replace('Home');

    } catch (error) {
      console.error('Error al guardar preferencias:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Ocurrió un error al guardar tus preferencias'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tus Preferencias</Text>
        <Text style={styles.subtitle}>
          Personaliza tu experiencia para recibir recomendaciones según tu estado de ánimo
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Qué estados de ánimo te describen mejor?</Text>
        <Text style={styles.sectionSubtitle}>Selecciona hasta 3 opciones</Text>
        
        <View style={styles.optionsGrid}>
          {moods.map(mood => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.optionCard,
                selectedMoods.includes(mood.id) && styles.selectedOption
              ]}
              onPress={() => toggleMood(mood.id)}
            >
              <AntDesign 
                name={mood.icon} 
                size={24} 
                color={selectedMoods.includes(mood.id) ? '#fff' : '#4C68D7'} 
              />
              <Text style={[
                styles.optionText,
                selectedMoods.includes(mood.id) && styles.selectedOptionText
              ]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Qué lugares te gustaría visitar?</Text>
        <Text style={styles.sectionSubtitle}>Selecciona hasta 5 opciones</Text>
        
        <View style={styles.optionsGrid}>
          {placeTypes.map(place => (
            <TouchableOpacity
              key={place.id}
              style={[
                styles.optionCard,
                selectedPlaceTypes.includes(place.id) && styles.selectedOption
              ]}
              onPress={() => togglePlaceType(place.id)}
            >
              <Text style={[
                styles.optionText,
                selectedPlaceTypes.includes(place.id) && styles.selectedOptionText
              ]}>
                {place.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={savePreferences}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar Preferencias</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  selectedOption: {
    backgroundColor: '#4C68D7',
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#4C68D7',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginVertical: 30,
    marginHorizontal: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PreferencesSetupScreen;