import React, { useState, useEffect } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

const PlacesContext = React.createContext({
  places: [],
  setPlaces: () => {},
  preferences: {
    mood: null,
    categories: [],
    location: null, // This might be user-defined location, not device location
  },
  setPreferences: () => {},
  userLocation: null,
  locationPermissionGranted: false,
  requestLocationPermission: async () => false,
  getUserLocation: () => {},
});

export const PlacesProvider = ({ children }) => {
  const [places, setPlaces] = useState([]);
  const [preferences, setPreferences] = useState({
    mood: null,
    categories: [],
    location: null,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      if (auth === 'granted') {
        setLocationPermissionGranted(true);
        return true;
      }
      setLocationPermissionGranted(false);
      return false;
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to recommend places.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setLocationPermissionGranted(true);
        return true;
      }
      setLocationPermissionGranted(false);
      return false;
    }
    return false; // Should not happen
  };

  const getUserLocation = () => {
    if (locationPermissionGranted) {
      Geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log(error.code, error.message);
          setUserLocation(null); // Clear location on error
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    } else {
      setUserLocation(null); // Clear location if permission not granted
    }
  };

  // Request permission on mount
  useEffect(() => {
    requestLocationPermission().then(granted => {
      if (granted) {
        getUserLocation();
      }
    });
  }, []);

  // Update location if permission is granted later
  useEffect(() => {
    if (locationPermissionGranted) {
      getUserLocation();
    } else {
      setUserLocation(null); // Clear location if permission revoked or not granted initially
    }
  }, [locationPermissionGranted]);


  return (
    <PlacesContext.Provider
      value={{
        places,
        setPlaces,
        preferences,
        setPreferences,
        userLocation,
        locationPermissionGranted,
        requestLocationPermission,
        getUserLocation,
      }}
    >
      {children}
    </PlacesContext.Provider>
  );
};

export default PlacesContext;