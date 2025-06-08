import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { User } from '../types/user'; // Import the User interface

const API_URL = 'http://localhost:3000/api'; // Make this configurable if needed

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email, password) => Promise<void>;
  register: (name, email, password) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfileContext: (updatedUser: Partial<User>) => Promise<void>; // Changed to Promise
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true to check token
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const loadToken = async () => {
      setIsLoading(true);
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          // Validate token by fetching user profile
          const response = await axios.get<User>(`${API_URL}/user/profile`);
          if (response.data) {
            setToken(storedToken);
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            // Token might be invalid or expired
            await AsyncStorage.removeItem('userToken');
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } catch (error) {
        console.error('Failed to load or validate token:', error);
        await AsyncStorage.removeItem('userToken'); // Clear potentially bad token
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token: newToken, user: loggedInUser } = response.data;

      await AsyncStorage.setItem('userToken', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(loggedInUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      // Consider showing an alert to the user here
      throw error; // Re-throw to be caught in the component
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      const { token: newToken, user: registeredUser } = response.data;

      await AsyncStorage.setItem('userToken', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(registeredUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      throw error; // Re-throw
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('userToken');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if storage removal fails, clear state
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfileContext = async (updatedFields: Partial<User>) => {
    if (!token) {
      throw new Error('No token available for updating profile.');
    }
    // No need to set isLoading here unless it's a very long operation
    // and you want global loading state. PreferencesScreen has its own.
    try {
      // Ensure Authorization header is set (should be by login/loadToken)
      // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Already set

      const response = await axios.put<User>(`${API_URL}/user/profile`, updatedFields);

      if (response.data) {
        setUser(response.data); // Update user state with response from backend
        // If user object was stored in AsyncStorage, update it here.
        // Example: await AsyncStorage.setItem('userData', JSON.stringify(response.data));
      } else {
        // Fallback or error if backend doesn't return the updated user
        setUser(prevUser => prevUser ? { ...prevUser, ...updatedFields } : null);
      }
    } catch (error) {
      console.error('Failed to update user profile:', error.response?.data?.message || error.message);
      throw error; // Re-throw for the calling component to handle
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, isAuthenticated, login, register, logout, updateUserProfileContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
