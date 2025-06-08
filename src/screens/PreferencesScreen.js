import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
// import axios from 'axios'; // Will be removed
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Will be removed for user data
import { AntDesign } from '@expo/vector-icons'; // Keep for icons if still used
import { Button as ElementsButton, CheckBox, Card, Divider } from 'react-native-elements'; // For new UI elements

import { useAuth } from '../context/AuthContext';
import PlacesContext from '../context/PlacesContext';

// const API_URL = 'http://your-backend-url.com/api'; // Will be removed

// Define new preference options as per subtask
const ALL_CATEGORIES = [ // Replaces placeTypes, or adapt placeTypes
  "Restaurants", "Cafes", "Parks", "Museums", "Nightlife", "Shopping", "Fitness", "Spas"
];
const ALL_AMBIANCES = ["Quiet", "Lively", "Casual", "Formal", "Cozy", "Modern"];
const ALL_PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

// Original placeTypes and moods constants are no longer needed with the new UI structure.

const PreferencesSetupScreen = ({ navigation }) => {
  const { userId, updatePreferencesStatus, userName } = useAuth(); // Get userId and update function
  const { preferences: currentGlobalPreferences, setPreferences: setGlobalPreferences } = useContext(PlacesContext);

  // States for user selections based on new definitions
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAmbiance, setSelectedAmbiance] = useState(null); // Single select for ambiance
  const [selectedPriceRange, setSelectedPriceRange] = useState(null); // Single select for price

  const [isLoading, setIsLoading] = useState(false); // Local loading state for save operation

  // Initialize state with existing global preferences from PlacesContext
  useEffect(() => {
    if (currentGlobalPreferences) {
      setSelectedCategories(currentGlobalPreferences.categories || []);
      setSelectedAmbiance(currentGlobalPreferences.ambiance || null);
      setSelectedPriceRange(currentGlobalPreferences.priceRange || null);
    }
  }, [currentGlobalPreferences]);

  // Removed old toggleMood and togglePlaceType functions as they are replaced by
  // direct state updates or specific handlers like toggleCategory.

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(item => item !== category)
        : [...prev, category]
    );
  };

  // Save preferences to PlacesContext and update AuthContext status
  const handleSavePreferences = async () => {
    if (!userId) {
      Alert.alert("Error", "User not identified. Please re-login.");
      return;
    }
    if (selectedCategories.length === 0) {
       Alert.alert("Incomplete", "Please select at least one category.");
       return;
    }
    // Ambiance and Price Range can be optional

    setIsLoading(true);
    try {
      // Update PlacesContext
      setGlobalPreferences({
        ...currentGlobalPreferences, // Preserve other preferences like mood, location
        categories: selectedCategories,
        ambiance: selectedAmbiance,
        priceRange: selectedPriceRange,
      });

      // Mark preferences as completed in AuthContext
      await updatePreferencesStatus(userId, true);

      // Navigation to HomeScreen will be handled by MainNavigator
      // Alert.alert("Preferences Saved", "Your preferences have been updated!");
    } catch (error) {
      console.error("Failed to save preferences or update status:", error);
      Alert.alert("Error", `Failed to save preferences: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render sections, similar to the planned PreferencesScreen
  const renderSection = (title, items, selectedState, toggleFunction, multiSelect = true, ItemComponent = CheckBox, itemProps = {}) => (
    <Card containerStyle={styles.card}>
      <Card.Title style={styles.cardTitle}>{title}</Card.Title>
      <Card.Divider />
      <View style={styles.optionsContainer}>
        {items.map((item) => (
          <ItemComponent
            key={item}
            title={item}
            checked={multiSelect ? selectedState.includes(item) : selectedState === item}
            onPress={() => toggleFunction(item)}
            containerStyle={styles.checkboxContainer}
            textStyle={styles.checkboxText}
            checkedIcon="check-square-o" // Example, works for CheckBox
            uncheckedIcon="square-o"     // Example, works for CheckBox
            checkedColor="#4C68D7"        // Example, works for CheckBox
            {...itemProps}
          />
        ))}
      </View>
    </Card>
  );


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Your Preferences {userName ? `for ${userName}` : ''}</Text>
        <Text style={styles.subtitle}>
          Help us tailor recommendations for you.
        </Text>
      </View>

      {renderSection("Favorite Categories", ALL_CATEGORIES, selectedCategories, toggleCategory, true, CheckBox)}

      {renderSection("Preferred Ambiance", ALL_AMBIANCES, selectedAmbiance, setSelectedAmbiance, false, CheckBox)}

      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>Price Range</Card.Title>
        <Card.Divider />
        <View style={styles.optionsContainer_row}>
          {ALL_PRICE_RANGES.map((range) => (
            <ElementsButton
              key={range}
              title={range}
              type={selectedPriceRange === range ? "solid" : "outline"}
              onPress={() => setSelectedPriceRange(range)}
              buttonStyle={styles.priceButton}
              titleStyle={selectedPriceRange === range ? styles.priceButtonText_selected : styles.priceButtonText}
              containerStyle={styles.priceButtonContainer}
            />
          ))}
        </View>
      </Card>

      <ElementsButton
        title="Save Preferences"
        onPress={handleSavePreferences}
        buttonStyle={styles.saveButton}
        titleStyle={styles.saveButtonText}
        icon={{ name: 'save', type: 'font-awesome', color: 'white', size:18, marginRight:10 }}
        loading={isLoading}
        disabled={isLoading}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8', // Lightened background
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30, // Adjust paddingTop for iOS status bar
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8, // Increased margin
    textAlign: 'center',
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    paddingBottom: 10, // Adjusted padding
    shadowColor: "#000", // Added shadow for cards
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4C68D7', // Primary color for titles
    textAlign: 'left', // Align title to left
    marginBottom: 10, // Add margin to title
  },
  optionsContainer: { // For Checkboxes
    flexDirection: 'column',
  },
  optionsContainer_row: { // For Price Buttons
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around', // Better distribution
    marginTop: 5, // Reduced margin
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingVertical: 6, // Reduced padding
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#333', // Darker text for better readability
  },
  priceButtonContainer: {
    marginHorizontal: 4, // Reduced margin
    marginBottom:10,
    flexGrow: 1, // Allow buttons to grow
    minWidth: '20%', // Ensure buttons don't get too small
  },
  priceButton: {
    paddingHorizontal: 10, // Adjusted padding
    borderRadius: 20, // More rounded
    borderWidth: 1.5, // Thicker border for outline
  },
  priceButtonText: {
     // Default color comes from button type 'outline'
  },
  priceButtonText_selected: {
    // Default color comes from button type 'solid'
  },
  saveButton: {
    backgroundColor: '#5cb85c', // Green color for save
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40, // More space at the bottom
    paddingVertical: 15,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', // Ensure text is white
  },
});

export default PreferencesSetupScreen;
