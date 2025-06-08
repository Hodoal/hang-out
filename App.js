import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';
import AuthContext from './src/context/AuthContext';
import PlacesContext from './src/context/PlacesContext';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createStackNavigator();

export default function App() {
  const [userId, setUserId] = React.useState(null); // Elimina el tipo "string | null"
  const [places, setPlaces] = React.useState([]); // No se especifica el tipo
  const [preferences, setPreferences] = React.useState({
    mood: null,
    categories: [],
    location: null,
  });

  // Generar ID anónimo al iniciar la app si no existe
  React.useEffect(() => {
    if (!userId) {
      const anonymousId = 'anon_' + Math.random().toString(36).substring(2, 15);
      setUserId(anonymousId);
    }
  }, [userId]);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthContext.Provider value={{ userId, setUserId }}>
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
        </AuthContext.Provider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
