import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, ListItem } from 'react-native-elements'; // Icon removed for now, can be re-added if needed
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import AsyncStorage from '@react-native-async-storage/async-storage'; // Still used for settings
import UserService from '../services/UserService';

// Copied from PreferencesScreen.js - ideally, move to a shared constants file
const moodsArray = [
  { id: 'relaxed', label: 'Relajado', icon: 'customerservice' },
  { id: 'adventurous', label: 'Aventurero', icon: 'rocket1' },
  { id: 'romantic', label: 'Romántico', icon: 'heart' },
  { id: 'cultural', label: 'Cultural', icon: 'book' },
  { id: 'party', label: 'Fiestero', icon: 'star' },
  { id: 'foodie', label: 'Gourmet', icon: 'coffee' },
  { id: 'nature', label: 'Amante de la naturaleza', icon: 'tree' },
  { id: 'shopping', label: 'Compras', icon: 'shoppingcart' },
];

const placeTypesArray = [
  { id: 'restaurants', label: 'Restaurantes' },
  { id: 'museums', label: 'Museos' },
  { id: 'parks', label: 'Parques' },
  { id: 'bars', label: 'Bares' },
  { id: 'beaches', label: 'Playas' },
  { id: 'historical', label: 'Sitios históricos' },
  { id: 'shopping', label: 'Centros comerciales' },
  { id: 'entertainment', label: 'Entretenimiento' },
];


const ProfileScreen = ({ navigation }) => { // Added navigation for logout potentially
  const { user, token, updateUserProfileContext, logout } = useAuth(); // Use AuthContext
  // const { preferences, setPreferences } = useContext(PlacesContext); // Removed PlacesContext

  const [userStats, setUserStats] = useState({
    visitedPlaces: 0,
    reviewsCount: 0,
    favoriteCategories: [],
    preferredMoods: [],
  });
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true); // Renamed loading for clarity
  const [profilePicLoading, setProfilePicLoading] = useState(false);


  useEffect(() => {
    if (user?.id) {
      loadUserSettings(user.id);
      fetchUserStats(user.id);
    }
  }, [user?.id]);

  const loadUserSettings = async (currentUserId) => {
    try {
      const storedSettings = await AsyncStorage.getItem(`settings_${currentUserId}`);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setNotifications(settings.notifications ?? true); // Default to true if undefined
        setLocationTracking(settings.locationTracking ?? true); // Default to true if undefined
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveUserSettings = async () => {
    if (!user?.id) return;
    try {
      const settings = {
        notifications,
        locationTracking,
      };
      await AsyncStorage.setItem(
        `settings_${user.id}`,
        JSON.stringify(settings)
      );
    } catch (error)
      console.error('Error saving settings:', error);
    }
  };

  const fetchUserStats = async (currentUserId) => {
    if (!currentUserId) return;
    setStatsLoading(true);
    try {
      const stats = await UserService.getUserStats(currentUserId);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const pickImage = async () => {
    setProfilePicLoading(true);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permiso denegado", "Se necesita permiso para acceder a la galería.");
      setProfilePicLoading(false);
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (pickerResult.canceled === true || !pickerResult.assets || pickerResult.assets.length === 0) {
      setProfilePicLoading(false);
      return;
    }

    if (pickerResult.assets[0].base64) {
      const base64Uri = `data:image/jpeg;base64,${pickerResult.assets[0].base64}`;
      try {
        await updateUserProfileContext({ profilePicture: base64Uri });
        Alert.alert("Éxito", "Foto de perfil actualizada.");
      } catch (error) {
        Alert.alert("Error", "No se pudo actualizar la foto de perfil.");
        console.error("Profile picture update error:", error);
      }
    }
    setProfilePicLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    // Navigation to login screen will be handled by RootNavigator in App.js
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
    if (!user?.id) return;
    try {
      // Limpiar preferencias de usuario via context (if applicable, or directly if not part of user object)
      // For now, this function in UserService only clears local feedback/stats
      await UserService.clearUserFeedback(user.id);
      // If preferences are part of the user object in context, clearing them would be:
      // await updateUserProfileContext({ preferences: null, hasCompletedPreferences: false });
      // However, the existing clearUserFeedback seems to only affect local mock data.

      setUserStats({ // Reset local stats display
        visitedPlaces: 0,
        reviewsCount: 0,
        favoriteCategories: [],
        preferredMoods: [],
      });
      Alert.alert('Datos locales eliminados', 'Las estadísticas y feedback simulados han sido reseteados.');
    } catch (error) {
      console.error('Error clearing user data:', error);
      Alert.alert('Error', 'No se pudieron eliminar los datos locales.');
    }
  };

  const getPreferenceLabel = (id, typeArray) => {
    const item = typeArray.find(item => item.id === id);
    return item ? item.label : id;
  };

  if (!user) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={pickImage} disabled={profilePicLoading}>
          {profilePicLoading ? (
            <ActivityIndicator size="large" color="#ff6b6b" style={styles.profileImage} />
          ) : (
            <Image
              source={user.profilePicture ? { uri: user.profilePicture } : require('../assets/default_profile.png')} // Ensure you have a default_profile.png
              style={styles.profileImage}
            />
          )}
        </TouchableOpacity>
        <Text style={styles.userNameText}>{user.name || 'Usuario'}</Text>
        <Text style={styles.userEmailText}>{user.email || 'No email'}</Text>
      </View>

      {statsLoading ? (
        <ActivityIndicator size="large" color="#ff6b6b" style={{ marginVertical: 20 }}/>
      ) : (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Estadísticas (Simuladas)</Text>
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

        {/* Displaying Mock Stats from UserService.js */}
        <Text style={styles.subsectionTitle}>Categorías Favoritas (Simuladas)</Text>
        {userStats.favoriteCategories && userStats.favoriteCategories.length > 0 ? (
          <View style={styles.tagsContainer}>
            {userStats.favoriteCategories.map((category) => (
              <View key={category.id} style={styles.tag}>
                <Text style={styles.tagText}>{category.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No hay categorías favoritas (simuladas).</Text>
        )}

        <Text style={styles.subsectionTitle}>Estados de Ánimo Preferidos (Simulados)</Text>
        {userStats.preferredMoods && userStats.preferredMoods.length > 0 ? (
          <View style={styles.tagsContainer}>
            {userStats.preferredMoods.map((mood) => (
              <View key={mood.id} style={styles.tag}>
                {/* Assuming mood.name from mock data is an ID that can be mapped by getPreferenceLabel */}
                <Text style={styles.tagText}>{getPreferenceLabel(mood.name, moodsArray)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No hay estados de ánimo preferidos (simulados).</Text>
        )}
      </View>
      )}

      <View style={styles.preferencesContainer}>
        <Text style={styles.sectionTitle}>Tus Preferencias Guardadas</Text>
        <Text style={styles.subsectionTitle}>Estados de Ánimo</Text>
        {user.preferences?.moods && user.preferences.moods.length > 0 ? (
          <View style={styles.tagsContainer}>
            {user.preferences.moods.map((moodId) => (
              <View key={moodId} style={styles.tag}>
                <Text style={styles.tagText}>{getPreferenceLabel(moodId, moodsArray)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No has guardado estados de ánimo.</Text>
        )}

        <Text style={styles.subsectionTitle}>Tipos de Lugares</Text>
        {user.preferences?.placeTypes && user.preferences.placeTypes.length > 0 ? (
          <View style={styles.tagsContainer}>
            {user.preferences.placeTypes.map((placeTypeId) => (
              <View key={placeTypeId} style={styles.tag}>
                <Text style={styles.tagText}>{getPreferenceLabel(placeTypeId, placeTypesArray)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No has guardado tipos de lugares.</Text>
        )}
         <Button
            title="Editar Preferencias"
            type="outline"
            buttonStyle={styles.editPrefsButton}
            titleStyle={styles.editPrefsButtonText}
            onPress={() => navigation.navigate('PreferencesSetup')} // Assuming PreferencesScreen is named PreferencesSetup in navigator
          />
      </View>


      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Ajustes de la App</Text>

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
        <Text style={styles.sectionTitle}>Privacidad de Datos Locales</Text>
        <Text style={styles.privacyText}>
          Las estadísticas y el feedback simulado se almacenan localmente.
          Puedes eliminarlos si lo deseas.
        </Text>

        <Button
          title="Resetear Datos Locales"
          type="outline"
          buttonStyle={styles.deleteButton}
          titleStyle={styles.deleteButtonText}
          icon={{
            name: 'delete-sweep', // Changed icon
            type: 'material',
            size: 20,
            color: '#ff6b6b',
          }}
          onPress={clearUserData}
        />
      </View>

      <View style={styles.authActionsContainer}>
        <Button
          title="Cerrar Sesión"
          buttonStyle={styles.logoutButton}
          titleStyle={styles.logoutButtonText}
          icon={{
            name: 'logout',
            type: 'material',
            size: 20,
            color: 'white',
          }}
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
};

// Removed getMoodDisplayName as preferences are now displayed using moodsArray/placeTypesArray

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  profileImage: {
    width: 100, // Increased size
    height: 100, // Increased size
    borderRadius: 50, // Circular image
    marginBottom: 10,
    backgroundColor: '#e0e0e0', // Placeholder bg
  },
  userNameText: { // Renamed from anonymousText
    fontSize: 22,
    fontWeight: 'bold',
    // marginTop: 10, // Removed, spacing handled by profileImage margin
  },
  userEmailText: { // Renamed from userIdText
    fontSize: 16, // Slightly larger
    color: '#666',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20, // Added padding for section titles not in cards
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    // paddingHorizontal: 20, // For titles within cards
  },
  statsContainer: { // This is now for the mock stats
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  preferencesContainer: { // New container for actual user preferences
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
    // paddingHorizontal: 20, // If title is outside card
  },
  tag: {
    backgroundColor: '#4ecdc4',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8, // Adjusted margin
    marginBottom: 8, // Adjusted margin
  },
  tagText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    // textAlign: 'center', // Not always centered if part of a card
    marginVertical: 10,
    // paddingHorizontal: 20, // If title is outside card
  },
  settingsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 0, // ListItem handles padding
    paddingVertical: 10,
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
    marginBottom: 15, // Adjusted margin
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
  editPrefsButton: {
    borderColor: '#4C68D7',
    borderRadius: 5,
    marginTop: 20,
  },
  editPrefsButtonText: {
    color: '#4C68D7',
  },
  authActionsContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 30, // Ensure it's the last item or adjust margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: '#ff6b6b', // Consistent with delete button color theme
    borderRadius: 5,
  },
  logoutButtonText: {
    color: 'white',
  },
});

export default ProfileScreen;
