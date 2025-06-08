import React from 'react';

const PlacesContext = React.createContext({
  places: [],
  setPlaces: () => {},
  preferences: {
    mood: null, // User's current or selected mood
    categories: [], // Array of selected place categories (e.g., ['restaurant', 'park'])
    location: null, // User's current location {latitude, longitude} or selected search area
    ambiance: null, // Optional: User's preferred ambiance (e.g., 'quiet', 'lively')
    priceRange: null, // Optional: User's preferred price range (e.g., '$', '$$', '$$$', or 1, 2, 3)
  },
  setPreferences: () => {}, // This function would update parts or all of the preferences object
});

export default PlacesContext;
