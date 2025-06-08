import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';

export const lightThemeColors = {
  background: '#FFFFFF', // Pure white for a cleaner light mode
  text: '#121212', // Dark text for readability
  primary: '#FF6B35', // Main brand orange
  secondary: '#007bff', // Secondary blue for user messages

  // Chat specific
  botBubbleBackground: '#FF6B35',
  userBubbleBackground: '#007bff',
  botBubbleText: '#FFFFFF',
  userBubbleText: '#FFFFFF',

  inputBackground: '#f0f0f0', // Light gray for input field
  inputTextColor: '#121212',

  headerBackground: ['#FF6B35', '#F7931E', '#FFD23F'], // Gradient
  headerText: '#FFFFFF',

  buttonBackground: '#FF6B35',
  buttonIconColor: '#FFFFFF',

  disabledButtonBackground: '#ccc',

  // Markdown specific, relative to bubble
  markdownLink: '#E0F7FA', // Light blue for links in bot messages
};

export const darkThemeColors = {
  background: '#121212', // Standard dark background
  text: '#E0E0E0', // Light gray text
  primary: '#E65100', // Darker, less vibrant orange for dark mode
  secondary: '#2979FF', // A more vibrant blue for dark mode contrast

  // Chat specific
  botBubbleBackground: '#333333', // Dark gray for bot bubbles
  userBubbleBackground: '#0052cc', // Darker blue for user bubbles
  botBubbleText: '#E0E0E0',
  userBubbleText: '#E0E0E0',

  inputBackground: '#1E1E1E', // Very dark gray for input
  inputTextColor: '#E0E0E0',

  headerBackground: ['#B24A26', '#AD6614', '#B2912C'], // Darker gradient
  // Or a solid dark color for header in dark mode if gradient is too much:
  // headerBackground: '#1E1E1E',
  headerText: '#E0E0E0',

  buttonBackground: '#E65100', // Darker orange for button
  buttonIconColor: '#E0E0E0',

  disabledButtonBackground: '#424242',

  // Markdown specific
  markdownLink: '#81D4FA', // Lighter blue for links in bot messages (dark theme)
};

export const ThemeContext = createContext({
  theme: 'light', // default theme
  colors: lightThemeColors,
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Get device's current color scheme
  const systemColorScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState(systemColorScheme || 'light');

  const currentColors = theme === 'light' ? lightThemeColors : darkThemeColors;

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme || 'light');
    });
    return () => subscription.remove();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, colors: currentColors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext);
