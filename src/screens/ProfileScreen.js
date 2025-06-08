import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Image, TouchableOpacity, Platform } from 'react-native'; // Added Image, TouchableOpacity, Platform
import { Button, Icon, ListItem } from 'react-native-elements';
import * as ImagePicker from 'expo-image-picker'; // Added ImagePicker
import { useAuth } from '../context/AuthContext'; // Import useAuth
import PlacesContext from '../context/PlacesContext';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Still used for local settings
import UserService from '../services/UserService'; // Still used for stats and clearUserData

const ProfileScreen = () => {
  // Use the new AuthContext
  const { userId, userName, userEmail, logout, isAuthenticated, userProfileImageUrl, updateUserProfileImage } = useAuth(); // Added userProfileImageUrl, updateUserProfileImage
  const { preferences, setPreferences } = useContext(PlacesContext); // Stays as is

  const [profileImage, setProfileImage] = useState(null); // State for newly selected image URI
  const [userStats, setUserStats] = useState({
    visitedPlaces: 0,
    reviewsCount: 0,
    favoriteCategories: [],
    preferredMoods: [],
  });
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [loading, setLoading] = useState(true); // For user stats

  useEffect(() => {
    if (userId) { // Only load if userId is available
      loadUserSettings();
      fetchUserStats();
      if (userProfileImageUrl) {
        setProfileImage(userProfileImageUrl);
      }
    }
  }, [userId, userProfileImageUrl]); // Reload if userId or userProfileImageUrl changes

  const loadUserSettings = async () => {
    if (!userId) return;
    try {
      const storedSettings = await AsyncStorage.getItem(`settings_${userId}`);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setNotifications(settings.notifications !== undefined ? settings.notifications : true);
        setLocationTracking(settings.locationTracking !== undefined ? settings.locationTracking : true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveUserSettings = async () => {
    if (!userId) return;
    try {
      const settings = {
        notifications,
        locationTracking,
      };
      await AsyncStorage.setItem(
        `settings_${userId}`,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Ensure UserService.getUserStats can handle potentially null/undefined userId if called before auth
      const stats = await UserService.getUserStats(userId);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // setUserStats to default if error
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = (value) => {
    setNotifications(value);
    saveUserSettings(); // Save immediately on change
  };

  const toggleLocationTracking = (value) => {
    setLocationTracking(value);
    saveUserSettings(); // Save immediately on change
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation to LoginScreen should be handled by MainNavigator automatically
      // due to isAuthenticated becoming false.
    } catch (error) {
      Alert.alert("Error", "Failed to logout: " + error.message);
    }
  };

  const clearUserData = async () => {
    if (!userId) return;
    try {
      setPreferences({ mood: null, categories: [], location: null });
      await UserService.clearUserFeedback(userId);
      setUserStats({ visitedPlaces: 0, reviewsCount: 0, favoriteCategories: [], preferredMoods: [] });
      Alert.alert('Éxito', 'Tus datos han sido eliminados.');
      // Consider if logout should also happen here or if it's a separate action
    } catch (error) {
      console.error('Error clearing user data:', error);
      Alert.alert('Error', 'Error al eliminar datos. Intente nuevamente más tarde.');
    }
  };

  const handleChoosePhoto = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "You've refused to allow this app to access your photos!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.5, // Compress image a bit
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedImageUri = pickerResult.assets[0].uri;
      setProfileImage(selectedImageUri); // Update local state for immediate display
      try {
        await updateUserProfileImage(selectedImageUri); // Update in context and AsyncStorage
        Alert.alert("Success", "Profile image updated!");
      } catch (error) {
        Alert.alert("Error", "Failed to update profile image: " + error.message);
        // Optionally revert local state if context update fails:
        // setProfileImage(userProfileImageUrl);
      }
    }
  };

  if (!isAuthenticated || !userId) {
    // Optionally, show a loading indicator or a message if user is not authenticated yet
    // This case should ideally be handled by the navigator (not showing this screen at all)
    return (
      <View style={styles.container_centered}>
        <Text>Por favor, inicia sesión para ver tu perfil.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleChoosePhoto}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Icon name="person-circle-outline" type="ionicon" size={80} color="#ff6b6b" />
              <View style={styles.editIconContainer}>
                <Icon name="camera-alt" type="material" size={20} color="white" />
              </View>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.userNameText}>{userName || 'Usuario'}</Text>
        <Text style={styles.userEmailText}>{userEmail || 'No email provided'}</Text>
      </View>

      {/* Stats Section - remains similar but ensure it handles loading/empty states gracefully */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Tus Estadísticas</Text>
        {loading ? <Text>Cargando estadísticas...</Text> : (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.visitedPlaces || 0}</Text>
              <Text style={styles.statLabel}>Lugares Visitados</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.reviewsCount || 0}</Text>
              <Text style={styles.statLabel}>Reseñas</Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>Tus Categorías Favoritas</Text>
          {userStats.favoriteCategories && userStats.favoriteCategories.length > 0 ? (
            <View style={styles.tagsContainer}>
              {userStats.favoriteCategories.map((category) => (
                <View key={category.name} style={styles.tag}>
                  <Text style={styles.tagText}>{category.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Aún no tienes categorías favoritas</Text>
          )}

          <Text style={styles.subsectionTitle}>Tus Estados de Ánimo Preferidos</Text>
          {userStats.preferredMoods && userStats.preferredMoods.length > 0 ? (
            <View style={styles.tagsContainer}>
              {userStats.preferredMoods.map((mood) => (
                <View key={mood.name} style={styles.tag}>
                  <Text style={styles.tagText}>{getMoodDisplayName(mood.name)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Aún no tienes estados de ánimo preferidos</Text>
          )}
        </>
        )}
      </View>

      <View style={styles.settingsContainer}>
        {/* ... Settings ListItems remain the same ... */}
        <Text style={styles.sectionTitle}>Configuración</Text>

        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>Notificaciones</ListItem.Title>
            <ListItem.Subtitle>
              Recibir notificaciones de recomendaciones
            </ListItem.Subtitle>
          </ListItem.Content>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#767577', true: '#4ecdc4' }}
          />
        </ListItem>

        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>Seguimiento de ubicación</ListItem.Title>
            <ListItem.Subtitle>
              Usar tu ubicación para recomendaciones
            </ListItem.Subtitle>
          </ListItem.Content>
          <Switch
            value={locationTracking}
            onValueChange={toggleLocationTracking}
            trackColor={{ false: '#767577', true: '#4ecdc4' }}
          />
        </ListItem>
      </View>

      <View style={styles.privacyContainer}>
        <Text style={styles.sectionTitle}>Privacidad</Text>
        <Text style={styles.privacyText}>
          Tus datos permanecen completamente anónimos. No almacenamos
          información personal que pueda identificarte directamente.
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
            color: '#ff6b6b',
          }}
          onPress={clearUserData}
        />
      </View>

      {/* Logout Button Added */}
      <View style={styles.logoutContainer}>
        <Button
          title="Cerrar Sesión"
          buttonStyle={styles.logoutButton}
          titleStyle={styles.logoutButtonText}
          icon={{
            name: 'logout',
            type: 'material-community',
            size: 20,
            color: 'white',
            style: { marginRight: 10 }
          }}
          onPress={handleLogout}
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
    paddingVertical: 20, // Adjusted padding
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileImage: { // New Style
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10
  },
  profileImagePlaceholder: { // New Style
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative'
  },
  editIconContainer: { // New Style
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 15
  },
  userNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 0, // Adjusted from 10, as image has margin
  },
  userEmailText: {
    fontSize: 16,
    color: '#555',
    marginTop: 5
  },
  // userIdText style can be removed if not used
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
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
    paddingVertical: 10, // Adjusted padding
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
    marginBottom: 15, // Adjusted margin for logout button
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
  logoutContainer: { // New container for logout button
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    marginTop: 0,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: '#d9534f',
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default ProfileScreen;
