import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';
// import AuthContext from './src/context/AuthContext'; // Changed to AuthProvider
import { AuthProvider } from './src/context/AuthContext'; // Import AuthProvider
import PlacesContext from './src/context/PlacesContext';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createStackNavigator(); // This Stack navigator isn't used here, can be removed if not used elsewhere from App.js

export default function App() {
  // Local userId state and useEffect for anonymousId are removed
  const [places, setPlaces] = React.useState([]);
  const [preferences, setPreferences] = React.useState({
    mood: null,
    categories: [],
    location: null,
    ambiance: null, // Added as per PlacesContext update
    priceRange: null, // Added as per PlacesContext update
  });

  // useEffect for anonymousId is removed. AuthProvider handles auth state.

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthProvider> {/* AuthProvider now wraps PlacesContext and Navigation */}
          <PlacesContext.Provider
            value={{
              places,
              setPlaces,
              preferences,
              setPreferences,
            }}
          >
            <NavigationContainer>
              <MainNavigator />
            </NavigationContainer>
          </PlacesContext.Provider>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
