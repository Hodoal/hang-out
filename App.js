import 'react-native-gesture-handler'; 
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';
import AuthContext from './src/context/AuthContext';
import { PlacesProvider } from './src/context/PlacesContext'; // Import PlacesProvider

const Stack = createStackNavigator();

export default function App() {
  const [userId, setUserId] = React.useState(null); // Elimina el tipo "string | null"

  // Generar ID anónimo al iniciar la app si no existe
  React.useEffect(() => {
    if (!userId) {
      const anonymousId = 'anon_' + Math.random().toString(36).substring(2, 15);
      setUserId(anonymousId);
    }
  }, [userId]);

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ userId, setUserId }}>
        <PlacesProvider> {/* Use PlacesProvider */}
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </PlacesProvider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}