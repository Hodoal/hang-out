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
// import axios from 'axios'; // Handled by AuthContext
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Handled by AuthContext
import { useAuth } from '../context/AuthContext'; // Import useAuth

// const API_URL = 'http://your-backend-url.com/api'; // Defined in AuthContext

const LoginScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  // const [loading, setLoading] = useState(false); // Replaced by auth.isLoading
  const auth = useAuth(); // Use the AuthContext

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    // setLoading(true); // Handled by AuthContext

    try {
      let user;
      if (isLogin) {
        await auth.login(email, password);
        user = auth.user; // Access user from context after login
      } else {
        await auth.register(name, email, password);
        user = auth.user; // Access user from context after register
      }

      // Navigation logic based on user state from context
      // This might be slightly delayed if user state update in context is not immediate
      // For more robust navigation, it's better to handle this in App.js or MainNavigator based on isAuthenticated and user state
      // However, per instructions, keeping immediate navigation here for now.
      if (user) { // Check if user is populated
        if (user.hasCompletedPreferences) {
          navigation.replace('Home');
        } else {
          navigation.replace('PreferencesSetup');
        }
      } else {
        // This case should ideally not be hit if login/register was successful
        // and user state was updated properly.
        console.warn("User data not available immediately after auth operation for navigation.");
      }

    } catch (error) {
      // Error is already logged in AuthContext, show alert here
      Alert.alert(
        'Error de Autenticación',
        error.response?.data?.message || error.message || 'Ocurrió un error'
      );
    } finally {
      // setLoading(false); // Handled by AuthContext
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    auth.error = null; // Clear any previous errors from context if you add an error state there
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>TravelMood</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </Text>

        {!isLogin && (
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
          disabled={auth.isLoading}
        >
          {auth.isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authButtonText}>
              {isLogin ? 'Iniciar Sesión' : 'Registrarme'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleButton} onPress={toggleAuthMode}>
          <Text style={styles.toggleButtonText}>
            {isLogin
              ? '¿No tienes cuenta? Regístrate'
              : '¿Ya tienes cuenta? Inicia sesión'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  authButton: {
    backgroundColor: '#4C68D7',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#4C68D7',
    fontSize: 16,
  },
});

export default LoginScreen;
