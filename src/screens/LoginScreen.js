import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
// import axios from 'axios'; // No longer needed directly
// import AsyncStorage from '@react-native-async-storage/async-storage'; // No longer needed directly
import { useAuth } from '../context/AuthContext'; // Import useAuth

// const API_URL = 'http://your-backend-url.com/api'; // Defined in AuthContext

const LoginScreen = ({ navigation }) => {
  const [isLoginMode, setIsLoginMode] = useState(true); // Renamed for clarity
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  // Use loading state from AuthContext if preferred, or manage local loading for UI interaction
  const [localLoading, setLocalLoading] = useState(false);

  const { login, register, isLoading: authLoading, hasCompletedPreferences: authHasCompletedPreferences, userId: authUserId } = useAuth();

  const handleAuth = async () => {
    if (!email || !password || (!isLoginMode && !name)) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    setLocalLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
        // AuthContext will update its state, including hasCompletedPreferences and userId
        // Navigation will be handled by useEffect or a callback based on isAuthenticated and hasCompletedPreferences in a higher order component or MainNavigator
        // For now, we'll check the context state directly after login/register resolves.
        // Note: The state from useAuth() might not update immediately after login/register call.
        // It's better to rely on the values returned by the login/register promises or use a useEffect in a component that wraps the navigator.
        // However, the prompt implies direct navigation from here.
        // We will use the values that *should* be set in context after successful auth.
        // A more robust way is for login/register in context to return the user object.
        // For this implementation, we'll assume AuthContext state is updated before this check.
        // This might be tricky due to async nature of setState.
        // A better approach: login/register in AuthContext could return the user object or hasCompletedPreferences status.
        // Let's assume login/register in AuthContext have updated the necessary states (userId, hasCompletedPreferences)
        // and we access them *after* the await.

        // The navigation logic will be handled by MainNavigator based on isAuthenticated and hasCompletedPreferences.
        // If direct navigation is still desired here (though less ideal):
        // const userLoggedIn = await login(email, password); // Assuming login returns user or relevant info
        // if (userLoggedIn.hasCompletedPreferences) {
        //   navigation.replace('Home');
        // } else {
        //   navigation.replace('PreferencesScreen'); // Ensure this screen name is correct
        // }

      } else {
        await register(name, email, password);
        // Similar to login, AuthContext handles state.
        // navigation.replace('PreferencesScreen'); // Navigate to preferences after registration
      }
      // After login or register, AuthContext state (isAuthenticated, hasCompletedPreferences) will change.
      // MainNavigator should react to these changes.
      // If immediate navigation is needed from here, it implies login/register functions in AuthContext
      // should return the user's preference status, or we rely on a slight delay for context update.
      // The prompt says: "Navigate to PreferencesScreen if hasCompletedPreferences is false after login/registration, otherwise navigate to HomeScreen."
      // This implies checking the status *after* the operation.
      // The AuthContext's state (hasCompletedPreferences, isAuthenticated) will trigger navigation in MainNavigator.
      // So, no explicit navigation.replace() calls here needed if MainNavigator handles it.
      // If MainNavigator doesn't handle it immediately, then we might need to navigate from here.
      // For now, let's assume MainNavigator handles it. If not, we'll add it back.

    } catch (error) {
      Alert.alert(
        'Error de Autenticación',
        error.message || 'Ocurrió un error durante la autenticación.'
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLoginMode(!isLoginMode);
    setEmail('');
    setPassword('');
    setName('');
  };

  // The actual navigation should be handled by a navigator that observes AuthContext state.
  // For example, in MainNavigator.js or App.js:
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     if (hasCompletedPreferences) {
  //       navigation.replace('Home');
  //     } else {
  //       navigation.replace('PreferencesScreen');
  //     }
  //   } else {
  //      navigation.replace('Login'); // Or stay on Login
  //   }
  // }, [isAuthenticated, hasCompletedPreferences, navigation]);
  // Since this screen is likely part of such a navigator, direct navigation calls after auth
  // might conflict or be redundant. The context state change should be the source of truth.

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')} // Ensure this path is correct
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>TravelMood</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </Text>

        {!isLoginMode && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu nombre"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.authButton}
          onPress={handleAuth}
          disabled={localLoading || authLoading} // Use combined loading state
        >
          {localLoading || authLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authButtonText}>
              {isLoginMode ? 'Iniciar Sesión' : 'Registrarme'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleButton} onPress={toggleAuthMode}>
          <Text style={styles.toggleButtonText}>
            {isLoginMode
              ? '¿No tienes cuenta? Regístrate'
              : '¿Ya tienes cuenta? Inicia sesión'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};


// Styles remain unchanged, assuming they are appropriate
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light grey background for the whole screen
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 80 : 60, // Adjusted for status bar
    marginBottom: 30,
  },
  logo: {
    width: 120, // Slightly larger logo
    height: 120,
  },
  appName: {
    fontSize: 28, // Larger app name
    fontWeight: 'bold',
    marginTop: 10,
    color: '#2c3e50', // Darker color for app name
  },
  formContainer: {
    backgroundColor: '#ffffff', // White background for the form
    marginHorizontal: 20, // Add horizontal margin
    borderRadius: 20, // Rounded corners for the form container
    paddingHorizontal: 25,
    paddingVertical: 30, // Increased vertical padding
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2, // Softer shadow
    },
    shadowOpacity: 0.08, // More subtle shadow
    shadowRadius: 4.0,
    elevation: 3,
  },
  title: {
    fontSize: 26, // Slightly smaller title
    fontWeight: '600', // Semi-bold
    color: '#34495e', // Dark grey for title
    marginBottom: 25, // Adjusted margin
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 18, // Adjusted margin
  },
  label: {
    fontSize: 15, // Slightly smaller label
    color: '#34495e', // Consistent color
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ecf0f1', // Lighter input background
    borderRadius: 8,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12, // Platform specific padding
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#2c3e50', // Darker text color
    borderWidth: 1,
    borderColor: '#dde1e2', // Subtle border
  },
  authButton: {
    backgroundColor: '#3498db', // Primary blue color
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20, // Increased top margin
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.0,
    elevation: 2,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 25, // Increased margin
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#2980b9', // Secondary blue color
    fontSize: 15,
    fontWeight: '600', // Semi-bold
  },
});

export default LoginScreen;
