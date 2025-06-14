
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Icon } from 'react-native-elements';
import PlacesContext from '../context/PlacesContext';

const MoodSelectionScreen = ({ navigation }) => {
  const { preferences, setPreferences } = useContext(PlacesContext);
  
  const moods = [
    { id: 'happy', label: 'Feliz', icon: 'sentiment-very-satisfied', color: '#FFDE03' },
    { id: 'relaxed', label: 'Relajado', icon: 'spa', color: '#0336FF' },
    { id: 'romantic', label: 'Romántico', icon: 'favorite', color: '#FF0266' },
    { id: 'adventurous', label: 'Aventurero', icon: 'terrain', color: '#00C853' },
    { id: 'hungry', label: 'Hambriento', icon: 'restaurant', color: '#FF3D00' },
    { id: 'social', label: 'Social', icon: 'people', color: '#AA00FF' },
    { id: 'creative', label: 'Creativo', icon: 'palette', color: '#2979FF' },
    { id: 'stressed', label: 'Estresado', icon: 'sentiment-very-dissatisfied', color: '#FF6D00' },
  ];

  const handleMoodSelection = (moodId) => {
    setPreferences({
      ...preferences,
      mood: moodId,
    });
    navigation.navigate('Recommendation');
  };

  const renderMoodItem = (mood) => (
    <TouchableOpacity
      key={mood.id}
      style={[styles.moodItem, { backgroundColor: mood.color }]}
      onPress={() => handleMoodSelection(mood.id)}
    >
      <Icon name={mood.icon} type="material" color="white" size={40} />
      <Text style={styles.moodLabel}>{mood.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cómo te sientes hoy?</Text>
      <Text style={styles.subtitle}>
        Selecciona un estado de ánimo y te recomendaremos lugares acordes
      </Text>
      
      <ScrollView contentContainerStyle={styles.moodGrid}>
        {moods.map(renderMoodItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  moodItem: {
    width: '48%',
    height: 120,
    borderRadius: 10,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  moodLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default MoodSelectionScreen;