import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'; // For API calls

// Define the shape of the user object and context
interface User {
  id: string;
  name: string;
  email: string;
  hasCompletedPreferences: boolean;
}

interface AuthContextType {
  token: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userProfileImageUrl: string | null; // Added for profile image
  isAuthenticated: boolean;
  hasCompletedPreferences: boolean | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferencesStatus: (userId: string, status: boolean) => Promise<void>;
  updateUserProfileImage: (newImageUrl: string) => Promise<void>; // Added for profile image
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the backend URL
const API_URL = 'http://localhost:3000/api/auth'; // Adjust if your backend runs elsewhere

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfileImageUrl, setUserProfileImageUrl] = useState<string | null>(null); // Added for profile image
  const [hasCompletedPreferences, setHasCompletedPreferences] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    setIsLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUserName = await AsyncStorage.getItem('userName');
      const storedUserEmail = await AsyncStorage.getItem('userEmail');
      const storedPrefs = await AsyncStorage.getItem('hasCompletedPreferences');
      const storedProfileImageUrl = await AsyncStorage.getItem('userProfileImageUrl'); // Added

      if (storedToken && storedUserId) {
        setToken(storedToken);
        setUserId(storedUserId);
        setUserName(storedUserName);
        setUserEmail(storedUserEmail);
        setUserProfileImageUrl(storedProfileImageUrl); // Added
        setHasCompletedPreferences(storedPrefs ? JSON.parse(storedPrefs) : false);
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } else {
        // Ensure everything is cleared if token or crucial user info is missing
        await clearAsyncStorage(); // Helper function to avoid code duplication
        resetContextState(); // Helper function
      }
    } catch (error) {
      console.error('Error loading auth state from storage:', error);
      await clearAsyncStorage();
      resetContextState();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      const { token: newToken, user } = response.data;

      await AsyncStorage.setItem('userToken', newToken);
      await AsyncStorage.setItem('userId', user.id.toString());
      await AsyncStorage.setItem('userName', user.name);
      await AsyncStorage.setItem('userEmail', user.email);
      // Assuming backend returns profileImageUrl, if not, it will be null
      await AsyncStorage.setItem('userProfileImageUrl', user.profileImageUrl || '');
      await AsyncStorage.setItem('hasCompletedPreferences', JSON.stringify(user.hasCompletedPreferences));

      setToken(newToken);
      setUserId(user.id.toString());
      setUserName(user.name);
      setUserEmail(user.email);
      setUserProfileImageUrl(user.profileImageUrl || null); // Added
      setHasCompletedPreferences(user.hasCompletedPreferences);
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      resetContextState(); // Clear context on login failure
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/register`, { name, email, password });
      const { token: newToken, user } = response.data;

      await AsyncStorage.setItem('userToken', newToken);
      await AsyncStorage.setItem('userId', user.id.toString());
      await AsyncStorage.setItem('userName', user.name);
      await AsyncStorage.setItem('userEmail', user.email);
      // Assuming backend returns profileImageUrl for new user, if not, it will be null
      await AsyncStorage.setItem('userProfileImageUrl', user.profileImageUrl || '');
      await AsyncStorage.setItem('hasCompletedPreferences', JSON.stringify(user.hasCompletedPreferences));

      setToken(newToken);
      setUserId(user.id.toString());
      setUserName(user.name);
      setUserEmail(user.email);
      setUserProfileImageUrl(user.profileImageUrl || null); // Added
      setHasCompletedPreferences(user.hasCompletedPreferences);
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      resetContextState(); // Clear context on registration failure
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await clearAsyncStorage();
    resetContextState();
    setIsLoading(false);
  };

  const clearAsyncStorage = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userProfileImageUrl'); // Added
      await AsyncStorage.removeItem('hasCompletedPreferences');
    } catch (error) {
      console.error('Error clearing auth state from storage:', error);
    }
  };

  const resetContextState = () => {
    setToken(null);
    setUserId(null);
    setUserName(null);
    setUserEmail(null);
    setUserProfileImageUrl(null); // Added
    setHasCompletedPreferences(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };


  const updatePreferencesStatus = async (currentUserId: string, status: boolean) => {
    if (!currentUserId) {
        console.error("User ID is required to update preferences status");
        throw new Error("User ID is required");
    }
    setIsLoading(true);
    try {
      // Ensure token is included for protected routes
      if(token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await axios.put(`${API_URL}/user/${currentUserId}/preferences`, { hasCompletedPreferences: status });
      const { user } = response.data;

      await AsyncStorage.setItem('hasCompletedPreferences', JSON.stringify(user.hasCompletedPreferences));
      setHasCompletedPreferences(user.hasCompletedPreferences);

      if (userId === currentUserId) { // Check if the updated user is the currently logged-in user
        setUserName(user.name);
        setUserEmail(user.email);
        // Note: user.id should be the same as currentUserId, so no need to setUserId again unless it could change
      }

    } catch (error) {
      console.error('Failed to update preferences status:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update preferences status');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfileImage = async (newImageUrl: string) => {
    if (!userId) {
      throw new Error("User not authenticated. Cannot update profile image.");
    }
    setIsLoading(true);
    try {
      // TODO: Future backend call to upload/save image URL
      // For now, just update locally in context and AsyncStorage
      // Example: await axios.put(`${API_URL}/user/${userId}/profile-image`, { imageUrl: newImageUrl });

      await AsyncStorage.setItem('userProfileImageUrl', newImageUrl);
      setUserProfileImageUrl(newImageUrl);

      // Optionally, if the backend returns the full updated user object:
      // const { user } = response.data;
      // setUserName(user.name);
      // setUserEmail(user.email);
      // setHasCompletedPreferences(user.hasCompletedPreferences);
      // setUserProfileImageUrl(user.profileImageUrl);

    } catch (error) {
      console.error('Failed to update profile image:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update profile image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        userName,
        userEmail,
        userProfileImageUrl, // Added
        isAuthenticated,
        hasCompletedPreferences,
        isLoading,
        login,
        register,
        logout,
        updatePreferencesStatus,
        updateUserProfileImage, // Added
      }}
    >
      <React.Fragment>{children}</React.Fragment>
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
