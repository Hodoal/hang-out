import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext'; // Updated import
import PlacesContext from './src/context/PlacesContext'; // Assuming this is still needed
import { ThemeProvider } from './src/context/ThemeContext';

// Import your screens
import LoginScreen from './src/screens/LoginScreen';
import PreferencesScreen from './src/screens/PreferencesScreen'; // Corrected name

const Stack = createStackNavigator();
const AuthStack = createStackNavigator();
const PreferencesStackNav = createStackNavigator();

const AuthScreens = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

const PreferencesScreens = () => (
  <PreferencesStackNav.Navigator screenOptions={{ headerShown: false }}>
    <PreferencesStackNav.Screen name="PreferencesSetup" component={PreferencesScreen} /> {/* Corrected component */}
    {/* You might want to allow navigation to Home from here after setup is done */}
    {/* <PreferencesStackNav.Screen name="Home" component={MainNavigator} /> */}
  </PreferencesStackNav.Navigator>
);


const RootNavigator = () => {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (auth.isAuthenticated) {
    if (auth.user && !auth.user.hasCompletedPreferences) {
      return <PreferencesScreens />;
    }
    return <MainNavigator />; // This is your main app navigator
  }

  return <AuthScreens />;
};

export default function App() {
  // const [userId, setUserId] = React.useState(null); // Managed by AuthProvider
  const [places, setPlaces] = React.useState([]);
  const [preferences, setPreferences] = React.useState({
    mood: null,
    categories: [],
    location: null,
  });

  // The anonymousId logic might need rethinking in the context of authenticated users.
  // For now, it's removed as user identity will come from auth.user.id.
  // React.useEffect(() => {
  //   if (!userId) {
  //     const anonymousId = 'anon_' + Math.random().toString(36).substring(2, 15);
  //     setUserId(anonymousId);
  //   }
  // }, [userId]);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthProvider>
          {/* PlacesContext might need to be re-evaluated:
              Does it depend on user ID? If so, how does it get it now?
              Perhaps it should also use useAuth() internally if needed.
              For now, keeping its structure as is. */}
          <PlacesContext.Provider
            value={{
              places,
              setPlaces,
              preferences,
              setPreferences,
            }}
          >
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </PlacesContext.Provider>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
