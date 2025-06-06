import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Button, Icon, ListItem } from 'react-native-elements';
import AuthContext from '../context/AuthContext';
import PlacesContext from '../context/PlacesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserService from '../services/UserService';

const ProfileScreen = () => {
  const { userId } = useContext(AuthContext);
  const { preferences, setPreferences } = useContext(PlacesContext);
  const [userStats, setUserStats] = useState({
    visitedPlaces: 0,
    reviewsCount: 0,
    favoriteCategories: [],
    preferredMoods: [],
  });
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserSettings();
    fetchUserStats();
  }, []);

  const loadUserSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(`settings_${userId}`);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setNotifications(settings.notifications);
        setLocationTracking(settings.locationTracking);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveUserSettings = async () => {
    try {
      const settings = {
        notifications,
        locationTracking,
      };
      await AsyncStorage.setItem(`settings_${userId}`, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const stats = await UserService.getUserStats(userId);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = (value) => {
    setNotifications(value);
    saveUserSettings();
  };

  const toggleLocationTracking = (value) => {
    setLocationTracking(value);
    saveUserSettings();
  };

  const clearUserData = async () => {
    try {
      // Limpiar preferencias de usuario
      setPreferences({
        mood: null,
        categories: [],
        location: null,
      });
      // Limpiar feedback almacenado
      await UserService.clearUserFeedback(userId);
      // Limpiar estadísticas locales
      setUserStats({
        visitedPlaces: 0,
        reviewsCount: 0,
        favoriteCategories: [],
        preferredMoods: [],
      });
      alert('Tus datos han sido eliminados con éxito');
    } catch (error) {
      console.error('Error clearing user data:', error);
      alert('Error al eliminar datos. Intente nuevamente más tarde.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Icon name="person-circle-outline" type="ionicon" size={80} color="#ff6b6b" />
        <Text style={styles.anonymousText}>Usuario Anónimo</Text>
        <Text style={styles.userIdText}>ID: {userId.slice(0, 8)}...</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Tus Estadísticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.visitedPlaces}</Text>
            <Text style={styles.statLabel}>Lugares Visitados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.reviewsCount}</Text>
            <Text style={styles.statLabel}>Reseñas</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Tus Categorías Favoritas</Text>
        {userStats.favoriteCategories.length > 0 ? (
          <View style={styles.tagsContainer}>
            {userStats.favoriteCategories.map((category, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{category.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Aún no tienes categorías favoritas</Text>
        )}

        <Text style={styles.subsectionTitle}>Tus Estados de Ánimo Preferidos</Text>
        {userStats.preferredMoods.length > 0 ? (
          <View style={styles.tagsContainer}>
            {userStats.preferredMoods.map((mood, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{getMoodDisplayName(mood.name)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Aún no tienes estados de ánimo preferidos</Text>
        )}
      </View>

      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>Notificaciones</ListItem.Title>
            <ListItem.Subtitle>Recibir notificaciones de recomendaciones</ListItem.Subtitle>
          </ListItem.Content>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: "#767577", true: "#4ecdc4" }}
          />
        </ListItem>
        
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>Seguimiento de ubicación</ListItem.Title>
            <ListItem.Subtitle>Usar tu ubicación para recomendaciones</ListItem.Subtitle>
          </ListItem.Content>
          <Switch
            value={locationTracking}
            onValueChange={toggleLocationTracking}
            trackColor={{ false: "#767577", true: "#4ecdc4" }}
          />
        </ListItem>
      </View>

      <View style={styles.privacyContainer}>
        <Text style={styles.sectionTitle}>Privacidad</Text>
        <Text style={styles.privacyText}>
          Tus datos permanecen completamente anónimos. No almacenamos información personal que pueda identificarte directamente.
        </Text>
        
        <Button
          title="Eliminar mis datos"
          type="outline"
          buttonStyle={styles.deleteButton}
          titleStyle={styles.deleteButtonText}
          icon={{
            name: 'delete',
            type: 'material',
            size: 20,
            color: '#ff6b6b'
          }}
          onPress={clearUserData}
        />
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
  headerContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  anonymousText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  userIdText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tag: {
    backgroundColor: '#4ecdc4',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
  },
  tagText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  settingsContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  privacyContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  privacyText: {
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  deleteButton: {
    borderColor: '#ff6b6b',
    borderRadius: 5,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#ff6b6b',
  },
});

export default ProfileScreen;