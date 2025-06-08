// src/constants/preferences.js

// moodsArray primarily based on MoodSelectionScreen.js for icons and colors
// PreferencesScreen and ProfileScreen will adapt to use these icons if necessary,
// or we might need to add another icon property if they use different icon sets (e.g., AntDesign vs Material).
// For now, assuming one icon set is sufficient or will be adapted.
export const moodsArray = [
  {
    id: 'happy',
    label: 'Feliz',
    icon: 'sentiment-very-satisfied', // Material icon name
    color: '#FFDE03',
  },
  {
    id: 'relaxed',
    label: 'Relajado',
    icon: 'spa', // Material icon name (used in MoodSelection)
    // AntDesign icon in PreferencesScreen was 'customerservice'
    color: '#0336FF',
  },
  {
    id: 'romantic',
    label: 'Romántico',
    icon: 'favorite', // Material icon name
    // AntDesign icon in PreferencesScreen was 'heart'
    color: '#FF0266',
  },
  {
    id: 'adventurous',
    label: 'Aventurero',
    icon: 'terrain', // Material icon name
    // AntDesign icon in PreferencesScreen was 'rocket1'
    color: '#00C853',
  },
  {
    id: 'hungry', // Was 'foodie' in PreferencesScreen
    label: 'Hambriento', // Label from MoodSelectionScreen
    // PreferencesScreen label was 'Gourmet'
    icon: 'restaurant', // Material icon name
    // AntDesign icon in PreferencesScreen was 'coffee'
    color: '#FF3D00',
  },
  {
    id: 'social',
    label: 'Social',
    icon: 'people', // Material icon name
    color: '#AA00FF',
  },
  {
    id: 'creative',
    label: 'Creativo',
    icon: 'palette', // Material icon name
    color: '#2979FF',
  },
  {
    id: 'stressed',
    label: 'Estresado',
    icon: 'sentiment-very-dissatisfied', // Material icon name
    color: '#FF6D00',
  },
  // Adding moods from PreferencesScreen that might be missing, matching structure
  {
    id: 'cultural',
    label: 'Cultural',
    icon: 'book', // Assuming Material 'book' icon, AntDesign was 'book'
    color: '#795548', // Placeholder color, adjust as needed
  },
  {
    id: 'party', // Was 'party' in PreferencesScreen
    label: 'Fiestero',
    icon: 'star', // Assuming Material 'star' icon, AntDesign was 'star'
    color: '#FFC107', // Placeholder color, adjust as needed
  },
  {
    id: 'nature', // Was 'nature' in PreferencesScreen
    label: 'Amante de la naturaleza',
    icon: 'eco', // Assuming Material 'eco' or 'filter_vintage', AntDesign was 'tree'
    color: '#4CAF50', // Placeholder color, adjust as needed
  },
  {
    id: 'shopping_mood', // Renamed from 'shopping' to avoid clash with placeType, if necessary
    label: 'De Compras', // Adjusted label
    icon: 'shopping', // Assuming Material 'shopping' icon, AntDesign was 'shoppingcart'
    color: '#E91E63', // Placeholder color, adjust as needed
  },
];

export const placeTypesArray = [
  { id: 'restaurants', label: 'Restaurantes' },
  { id: 'museums', label: 'Museos' },
  { id: 'parks', label: 'Parques' },
  { id: 'bars', label: 'Bares' },
  { id: 'beaches', label: 'Playas' },
  { id: 'historical', label: 'Sitios históricos' },
  { id: 'shopping', label: 'Centros comerciales' }, // Note: 'shopping' id also used in moods, ensure distinction if used as keys in same context
  { id: 'entertainment', label: 'Entretenimiento' },
];
