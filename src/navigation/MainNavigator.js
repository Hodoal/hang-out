import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from '../context/AuthContext'; // Import useAuth

import HomeScreen from '../screens/HomeScreen';
import MoodSelectionScreen from '../screens/MoodSelectionScreen';
import RecommendationScreen from '../screens/RecommendationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import LoginScreen from '../screens/LoginScreen'; // Import LoginScreen
import PreferencesScreen from '../screens/PreferencesScreen'; // Import PreferencesScreen

const Tab = createBottomTabNavigator();
const AppStack = createStackNavigator(); // For the main app (tabs and other screens)
const AuthStack = createStackNavigator(); // For login/signup
const PreferencesStack = createStackNavigator(); // For preferences setup
const RootStack = createStackNavigator(); // The very top-level navigator

// Simple Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

// Stack for screens accessible when authenticated and preferences are completed
const HomeStackNavigator = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="HomeMain" component={HomeScreen} />
    <AppStack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
    {/* Chatbot can be here or in TabNavigator depending on desired navigation */}
  </AppStack.Navigator>
);

const MoodStackNavigator = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="MoodMain" component={MoodSelectionScreen} />
  </AppStack.Navigator>
);

// Main Tab Navigator for authenticated users with preferences
const MainAppTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false, // Hide header for tab screens
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Mood') iconName = 'emoji-emotions';
        else if (route.name === 'Profile') iconName = 'person';
        else if (route.name === 'Chatbot') iconName = 'chat';
        return <Icon name={iconName} type="material" size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeStackNavigator} />
    <Tab.Screen name="Chatbot" component={ChatbotScreen} />
    <Tab.Screen name="Mood" component={MoodStackNavigator} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// This stack includes the TabNavigator and any other full-screen modals or global screens
// that should be available when the user is logged in and preferences are set.
const AuthenticatedAppStack = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="MainTabs" component={MainAppTabNavigator} />
    <AppStack.Screen name="Recommendation" component={RecommendationScreen} />
    {/* PlaceDetail might be better inside HomeStackNavigator if it's part of that flow */}
    {/* <AppStack.Screen name="PlaceDetail" component={PlaceDetailScreen} /> */}
  </AppStack.Navigator>
);


// Navigator for the authentication flow
const AuthFlowNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    {/* Add RegisterScreen here if it's a separate screen from LoginScreen logic */}
  </AuthStack.Navigator>
);

// Navigator for the preferences setup flow
const PreferencesFlowNavigator = () => (
  <PreferencesStack.Navigator screenOptions={{ headerShown: false }}>
    <PreferencesStack.Screen name="PreferencesSetup" component={PreferencesScreen} />
  </PreferencesStack.Navigator>
);


// Root Navigator - Decides which flow to show
const MainNavigator = () => {
  const { isAuthenticated, isLoading, hasCompletedPreferences, userId } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="AuthFlow" component={AuthFlowNavigator} />
      ) : !hasCompletedPreferences || !userId ? ( // Ensure userId exists as well for safety before preferences
        // If userId is null/undefined even if authenticated (should not happen with proper context logic),
        // it might be safer to route to AuthFlow or a specific error/setup screen.
        // For now, if no userId, and authenticated, but no preferences, route to preferences.
        <RootStack.Screen name="PreferencesFlow" component={PreferencesFlowNavigator} />
      ) : (
        <RootStack.Screen name="App" component={AuthenticatedAppStack} />
      )}
    </RootStack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainNavigator;
