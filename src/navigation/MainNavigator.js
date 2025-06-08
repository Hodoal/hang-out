import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import HomeScreen from '../screens/HomeScreen';
import MoodSelectionScreen from '../screens/MoodSelectionScreen';
import RecommendationScreen from '../screens/RecommendationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const MoodStack = createStackNavigator();
const RootStack = createStackNavigator();

// Navegador de Home Stack
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
      <HomeStack.Screen name="Chatbot" component={ChatbotScreen} /> {/* ✅ CORRECTO */}
    </HomeStack.Navigator>
  );
};

// Navegador de Mood Stack
const MoodStackNavigator = () => {
  return (
    <MoodStack.Navigator screenOptions={{ headerShown: false }}>
      <MoodStack.Screen name="MoodMain" component={MoodSelectionScreen} />
    </MoodStack.Navigator>
  );
};

// Navegador de Tabs
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Mood') {
            iconName = 'emoji-emotions';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'Chatbot') {
            iconName = 'chat';
          }
          return (
            <Icon name={iconName} type="material" size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
      <Tab.Screen name="Mood" component={MoodStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Navegador Principal (Root)
const MainNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={TabNavigator} />
      {/* Pantallas accesibles desde cualquier parte de la app */}
      <RootStack.Screen
        name="Recommendation"
        component={RecommendationScreen}
      />
    </RootStack.Navigator>
  );
};

export default MainNavigator;
