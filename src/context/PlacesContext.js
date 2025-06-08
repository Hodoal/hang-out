import React from 'react';

const PlacesContext = React.createContext({
  places: [],
  setPlaces: () => {},
  preferences: {
    mood: null,
    categories: [],
    location: null,
  },
  setPreferences: () => {},
});

export default PlacesContext;
