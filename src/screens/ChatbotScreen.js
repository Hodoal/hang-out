import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from "../context/ThemeContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import Markdown from "react-native-markdown-display";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from 'expo-linear-gradient';

// APIs Configuration
const OPENROUTER_API_KEY ='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';
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Reemplazar con tu API key
const NLP_SERVER_URL = 'http://localhost:6000'; // Updated port for Flask NLP service
const SITE_URL = 'barranquilla-guide.com';
const SITE_NAME = 'Guía Barranquilla';

const { width } = Dimensions.get('window');
const BUBBLE_MAX_WIDTH = width * 0.75;

const ChatbotBarranquilla = () => {
  const [messages, setMessages] = useState([
    {
      id: '0',
      text: "¡Hola! Soy tu **guía turístico personal** de Barranquilla 🌴\n\nCuéntame cómo te sientes hoy o qué tipo de experiencia buscas, y te recomendaré los mejores lugares de nuestra hermosa ciudad. \n\nPor ejemplo, puedes decir:\n* _'Quiero algo relajante'_\n* _'Busco aventura'_\n* _'Necesito un buen restaurante'_\n\n¡Empecemos!",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState({
    preferences: [],
    mood_history: [],
    location_ratings: {},
    conversation_count: 0,
  });
  const [conversationHistory, setConversationHistory] = useState([]);
  const [awaitingRating, setAwaitingRating] = useState(null);

  const flatListRef = useRef(null);

  const { theme, colors, setTheme } = useTheme();

  const getDynamicStyles = (colors) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoidingView: { flex: 1 },
    header: {
      paddingVertical: 20, paddingHorizontal: 20,
      borderBottomLeftRadius: 25, borderBottomRightRadius: 25,
      elevation: 8, shadowColor: '#000', // Shadow might need theme adjustment too
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65,
      // backgroundColor: colors.headerBackground, // For solid, if gradient not themed yet
    },
    headerTitle: { color: colors.headerText, fontSize: 26, fontWeight: "bold", textAlign: "center" },
    headerSubtitle: { color: colors.headerText, fontSize: 14, textAlign: "center", marginTop: 5, opacity: 0.9 },
    chatContainer: { flex: 1, paddingHorizontal: 15 },
    messageList: { paddingTop: 20, paddingBottom: 10 },
    messageBubbleContainer: { flexDirection: "row", marginBottom: 15, paddingHorizontal: 5 },
    botBubbleContainer: { justifyContent: "flex-start" },
    userBubbleContainer: { justifyContent: "flex-end" },
    messageBubble: {
      maxWidth: BUBBLE_MAX_WIDTH,
      paddingHorizontal: 14, // Slightly adjusted padding
      paddingVertical: 10,   // Slightly adjusted padding
      elevation: 1, // Reduced elevation for a flatter look if desired, or keep original
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, // Softer shadow
      shadowOpacity: 0.1,
      shadowRadius: 1.5,
      // General borderRadius, specific corners will be overridden by bot/user styles
      borderRadius: 18, // General rounding
    },
    botBubble: {
      backgroundColor: colors.botBubbleBackground,
      borderTopRightRadius: 18,
      borderBottomRightRadius: 18,
      borderTopLeftRadius: 18, // Keep this more rounded
      borderBottomLeftRadius: 4, // Less rounded on the side it points from (left)
      marginRight: 'auto', // Ensures it stays left
    },
    userBubble: {
      backgroundColor: colors.userBubbleBackground,
      borderTopLeftRadius: 18,
      borderBottomLeftRadius: 18,
      borderTopRightRadius: 18, // Keep this more rounded
      borderBottomRightRadius: 4, // Less rounded on the side it points from (right)
      marginLeft: 'auto', // Ensures it stays right
    },
    messageText: { fontSize: 16, lineHeight: 22 }, // Color will be from markdownStyle or userText
    botText: { color: colors.botBubbleText }, // Used if not markdown
    userText: { color: colors.userBubbleText },
    typingBubble: { flexDirection: "row", alignItems: "center", paddingVertical: 15 },
    typingText: { marginLeft: 10, color: colors.botBubbleText }, // Assuming typing bubble is like bot bubble
    placeInfoContainer: { marginTop: 12, borderRadius: 12, overflow: "hidden" },
    placeImage: { width: "100%", height: 160, borderRadius: 12, marginBottom: 8 },
    mapsButton: { backgroundColor: "rgba(255, 255, 255, 0.9)", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignItems: "center" }, // May need theme
    mapsButtonText: { color: colors.primary, fontSize: 14, fontWeight: "bold" },
    inputContainer: { flexDirection: "row", padding: 15, backgroundColor: colors.inputBackground, borderTopWidth: 1, borderTopColor: theme === "light" ? "#e9ecef" : "#333333", alignItems: "center" }, // Conditional border
    input: { flex: 1, backgroundColor: colors.inputBackground, color: colors.inputTextColor, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 12 : 8, borderRadius: 25, maxHeight: 120, fontSize: 16, borderWidth: 1, borderColor: theme === "light" ? "#e9ecef" : "#333333", marginRight: 0 },
    sendButton: { marginLeft: 12, backgroundColor: colors.buttonBackground, width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
    disabledButton: { backgroundColor: colors.disabledButtonBackground, elevation: 0 },
    themeToggleButton: {
      position: "absolute",
      top: Platform.OS === "ios" ? 40 : 20, // Adjust top for header context
      right: 15, // Adjust right for header context
      padding: 8, // Padding for the touchable area
      borderRadius: 25, // Make it circular if desired, or remove for just icon
      zIndex: 1000, // Keep on top
      // backgroundColor: colors.primary, // Optional: if icon needs a background circle
    },
    // themeToggleButtonText style removed
  });

  const styles = getDynamicStyles(colors);

  const markdownStyle = {
    body: { color: colors.botBubbleText, fontSize: 16 },
    heading1: { fontSize: 22, fontWeight: 'bold', color: colors.botBubbleText, marginVertical: 5 },
    heading2: { fontSize: 20, fontWeight: 'bold', color: colors.botBubbleText, marginVertical: 4 },
    strong: { fontWeight: 'bold', color: colors.botBubbleText },
    em: { fontStyle: 'italic', color: colors.botBubbleText },
    bullet_list: { color: colors.botBubbleText },
    ordered_list: { color: colors.botBubbleText },
    list_item: { marginVertical: 2, color: colors.botBubbleText },
    link: { color: colors.markdownLink, textDecorationLine: 'underline' },
    text: { color: colors.botBubbleText }, // Default text color within markdown
    paragraph: { marginTop: 5, marginBottom: 5, color: colors.botBubbleText }
  };

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  // Función para enviar datos al modelo NLP
  const updateUserProfile = async (
    userMessage,
    feedback = null,
    rating = null
  ) => {
    const userId = 'default_user'; // Using a default user ID for now
    try {
      const profileData = {
        message: userMessage,
        feedback: feedback,
        rating: rating,
      };

      // The NLP service now manages the profile internally
      const response = await fetch(`${NLP_SERVER_URL}/profile/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        // The Python service returns the full updated profile
        // We need to ensure setUserProfile is called with the correct structure
        // The Python model returns the profile directly, not nested under 'user_profile'
        setUserProfile(updatedProfile);
        return updatedProfile; // Return the updated profile for generateRecommendation
      } else {
        const errorData = await response.json();
        console.error('Error updating user profile (server):', errorData);
      }
    } catch (error) {
      console.error('Error updating user profile (network/client):', error);
    }
    return null;
  };

  // Función para buscar lugares en Google Places
  const searchGooglePlaces = async (placeName) => {
    try {
      const query = encodeURIComponent(`${placeName} Barranquilla Colombia`);
      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(placesUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const place = data.results[0];
        return {
          place_id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: place.geometry.location,
          rating: place.rating,
          photo_reference: place.photos
            ? place.photos[0].photo_reference
            : null,
          maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        };
      }
      return null;
    } catch (error) {
      console.error('Error searching Google Places:', error);
      return null;
    }
  };

  // Función para obtener imagen de Google Places
  const getPlacePhotoUrl = (photoReference) => {
    if (!photoReference) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  };

  // Función principal para generar recomendaciones con DeepSeek R1
  const generateRecommendation = async (userMessage) => {
    setIsTyping(true);

    // Actualizar perfil del usuario
    const profileUpdate = await updateUserProfile(userMessage);

    // Construir contexto personalizado basado en el perfil del usuario
    const userContext = profileUpdate
      ? `Perfil del usuario:
      - Preferencias: ${userProfile.preferences.join(', ')}
      - Historial de estados de ánimo: ${userProfile.mood_history.slice(-3).join(', ')}
      - Lugares con mejor calificación: ${Object.entries(
        userProfile.location_ratings
      )
        .filter(([_, rating]) => rating >= 4)
        .map(([place, _]) => place)
        .join(', ')}
      - Número de conversaciones: ${userProfile.conversation_count}`
      : 'Usuario nuevo sin historial previo.';

    const prompt = `Eres un guía turístico experto y amigable de Barranquilla, Colombia. Tu misión es recomendar lugares específicos basándote en el estado de ánimo o interés del usuario.

${userContext}

Usuario dice: "${userMessage}"

IMPORTANTE: 
- Solo habla sobre lugares en Barranquilla, Colombia
- Detecta el estado de ánimo/intención del usuario
- Recomienda 1 lugar principal + 2 alternativas
- Sé específico con nombres reales de lugares
- Mantén un tono amigable y local

Responde en este formato JSON exacto:
{
  "mood_detected": "estado de ánimo detectado",
  "main_recommendation": {
    "name": "Nombre exacto del lugar principal",
    "type": "tipo de lugar",
    "description": "descripción atractiva en 2 frases",
    "why_perfect": "por qué es perfecto para su estado de ánimo",
    "best_time": "mejor momento para visitar"
  },
  "alternatives": [
    {
      "name": "Nombre exacto alternativa 1",
      "type": "tipo de lugar",
      "description": "descripción breve"
    },
    {
      "name": "Nombre exacto alternativa 2", 
      "type": "tipo de lugar",
      "description": "descripción breve"
    }
  ],
  "local_tip": "consejo local especial"
}

Responde SOLO con JSON válido, sin texto adicional.`;

    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': SITE_URL,
            'X-Title': SITE_NAME,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        }
      );

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const rawContent = data.choices[0].message.content;
        console.log("---- RAW CONTENT FROM OPENROUTER/DEEPSEEK ----");
        console.log(rawContent);
        console.log("-----------------------------------------------");

        try {
          // Attempt to make JSON extraction more robust by trimming and looking for first/last braces
          const trimmedContent = rawContent.trim();
          const jsonStart = trimmedContent.indexOf('{');
          const jsonEnd = trimmedContent.lastIndexOf('}') + 1;

          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonStr = trimmedContent.substring(jsonStart, jsonEnd);
            console.log("---- EXTRACTED JSON STRING TO PARSE ----");
            console.log(jsonStr);
            console.log("----------------------------------------");

            const recommendationData = JSON.parse(jsonStr);

            // Buscar información del lugar principal en Google Places
            const placeInfo = await searchGooglePlaces(recommendationData.main_recommendation.name);

            // Crear mensaje de recomendación
            let recommendationText = `🎯 **${recommendationData.main_recommendation.name}**\n`;
            recommendationText += `📍 ${recommendationData.main_recommendation.type}\n\n`;
            recommendationText += `${recommendationData.main_recommendation.description}\n\n`;
            recommendationText += `✨ **¿Por qué es perfecto para ti?**\n${recommendationData.main_recommendation.why_perfect}\n\n`;
            recommendationText += `⏰ **Mejor momento:** ${recommendationData.main_recommendation.best_time}\n\n`;

            if (placeInfo) {
              recommendationText += `⭐ Calificación: ${placeInfo.rating || 'N/A'}\n`;
              recommendationText += `📍 ${placeInfo.address}\n\n`;
            }

            recommendationText += `🎁 **Consejo local:** ${recommendationData.local_tip}\n\n`;
            recommendationText += `**Otras opciones:**\n`;
            recommendationData.alternatives.forEach((alt, index) => {
              recommendationText += `${index + 1}. **${alt.name}** - ${alt.description}\n`;
            });

            const recommendationMessage = {
              id: `rec-${Date.now()}`,
              text: recommendationText,
              sender: 'bot',
              timestamp: new Date(),
              placeInfo: placeInfo,
              recommendationData: recommendationData,
              requiresRating: true
            };

            setMessages(prevMessages => [...prevMessages, recommendationMessage]);

            // Guardar en historial de conversación
            setConversationHistory(prev => [...prev, {
              user_message: userMessage,
              bot_response: recommendationData,
              timestamp: new Date().toISOString()
            }]);

            // Establecer que esperamos calificación
            setAwaitingRating(recommendationData.main_recommendation.name);

            // Mensaje para solicitar calificación
            setTimeout(() => {
              const ratingMessage = {
                id: `rating-${Date.now()}`,
                text: '¿Qué te parece esta recomendación? 🌟\n\nCalifica del 1 al 5 (siendo 5 excelente) o cuéntame qué piensas. Tu feedback me ayuda a conocerte mejor y darte mejores sugerencias.',
                sender: 'bot',
                timestamp: new Date(),
                awaitingRating: true
              };
              setMessages(prevMessages => [...prevMessages, ratingMessage]);
            }, 2000);

          } else {
            console.error('Could not find valid JSON structure in the content:', trimmedContent);
            throw new Error('No se pudo extraer JSON válido del contenido.');
          }
        } catch (jsonError) {
          console.error('Error parsing JSON from DeepSeek response:', jsonError);
          console.error('Original content that failed to parse:', data.choices[0].message.content);
          // Fallback: respuesta directa sin JSON
          const fallbackMessage = {
            id: `fallback-${Date.now()}`,
            text: data.choices[0].message.content, // Show raw content if parsing fails
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prevMessages => [...prevMessages, fallbackMessage]);
        }
      } else {
        console.error('Invalid response structure from OpenRouter/DeepSeek:', data);
        throw new Error('Respuesta inválida del modelo');
      }
    } catch (error) {
      console.error('Error generating recommendation:', error);

      const errorMessage = {
        id: `error-${Date.now()}`,
        text: 'Lo siento, tuve un problema técnico. ¿Puedes contarme de nuevo qué tipo de lugar buscas en Barranquilla?',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Función para procesar calificaciones
  const processRating = async (ratingText) => {
    let numericRating = null;

    // Extraer calificación numérica
    const ratingMatch = ratingText.match(/[1-5]/);
    if (ratingMatch) {
      numericRating = parseInt(ratingMatch[0]);
    } else {
      // Interpretar texto como calificación
      const lowerText = ratingText.toLowerCase();
      if (
        lowerText.includes('excelente') ||
        lowerText.includes('perfecto') ||
        lowerText.includes('increíble')
      ) {
        numericRating = 5;
      } else if (
        lowerText.includes('muy bien') ||
        lowerText.includes('genial')
      ) {
        numericRating = 4;
      } else if (lowerText.includes('bien') || lowerText.includes('bueno')) {
        numericRating = 3;
      } else if (
        lowerText.includes('regular') ||
        lowerText.includes('normal')
      ) {
        numericRating = 2;
      } else if (
        lowerText.includes('malo') ||
        lowerText.includes('no me gusta')
      ) {
        numericRating = 1;
      }
    }

    // Actualizar perfil con el feedback
    await updateUserProfile('', ratingText, numericRating);

    // Actualizar calificaciones locales
    if (awaitingRating && numericRating) {
      setUserProfile((prev) => ({
        ...prev,
        location_ratings: {
          ...prev.location_ratings,
          [awaitingRating]: numericRating,
        },
      }));
    }

    setAwaitingRating(null);

    // Respuesta de agradecimiento
    let thankYouText = '¡Gracias por tu feedback! ';
    if (numericRating) {
      if (numericRating >= 4) {
        thankYouText += 'Me alegra que te haya gustado la recomendación. 😊';
      } else if (numericRating === 3) {
        thankYouText += 'Tomaré en cuenta tus comentarios para mejorar.';
      } else {
        thankYouText +=
          'Lamento que no haya sido de tu agrado. La próxima vez te daré algo mejor.';
      }
    } else {
      thankYouText += 'Tus comentarios me ayudan a conocerte mejor.';
    }

    thankYouText +=
      '\n\n¿Hay algo más que quieras descubrir en Barranquilla? 🌴';

    const thankYouMessage = {
      id: `thanks-${Date.now()}`,
      text: thankYouText,
      sender: 'bot',
      timestamp: new Date(),
    };

    setTimeout(() => {
      setMessages((prevMessages) => [...prevMessages, thankYouMessage]);
    }, 1000);
  };

  // Función principal para enviar mensajes
  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const messageText = inputText;
    setInputText('');

    // Si estamos esperando una calificación
    if (awaitingRating) {
      await processRating(messageText);
      return;
    }

    // Generar recomendación normal
    await generateRecommendation(messageText);
  };

  // Función para abrir Google Maps
  const openGoogleMaps = (placeInfo) => {
    if (placeInfo && placeInfo.maps_url) {
      Linking.openURL(placeInfo.maps_url).catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'No se pudo abrir Google Maps');
      });
    }
  };

  // Renderizado de mensajes
  const renderItem = ({ item }) => {
    const isBot = item.sender === 'bot';

    return (
      <View
        style={[
          styles.messageBubbleContainer,
          isBot ? styles.botBubbleContainer : styles.userBubbleContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isBot ? styles.botBubble : styles.userBubble,
          ]}
        >
          {isBot ? (
            <Markdown style={markdownStyle}>
              {item.text}
            </Markdown>
          ) : (
            <Text style={[styles.messageText, styles.userText]}>
              {item.text}
            </Text>
          )}

          {/* Mostrar imagen y botón de mapa si hay información del lugar */}
          {item.placeInfo && (
            <View style={styles.placeInfoContainer}>
              {item.placeInfo.photo_reference && (
                <Image
                  source={{
                    uri: getPlacePhotoUrl(item.placeInfo.photo_reference),
                  }}
                  style={styles.placeImage}
                  resizeMode="cover"
                />
              )}

              <TouchableOpacity
                style={styles.mapsButton}
                onPress={() => openGoogleMaps(item.placeInfo)}
              >
                <Text style={styles.mapsButtonText}>📍 Ver en Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.headerBackground}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Hang out</Text>
        <Text style={styles.headerSubtitle}>
          Tu asistente turístico inteligente
        </Text>
        <TouchableOpacity onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')} style={styles.themeToggleButton}>
          <Icon name={theme === "light" ? "moon-outline" : "sunny-outline"} size={26} color={colors.headerText} />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          {isTyping && (
            <View
              style={[styles.messageBubbleContainer, styles.botBubbleContainer]}
            >
              <View
                style={[
                  styles.messageBubble,
                  styles.botBubble,
                  styles.typingBubble,
                ]}
              >
                <ActivityIndicator size="small" color="#ffffff" />
                <Text
                  style={[
                    styles.messageText,
                    styles.botText,
                    styles.typingText,
                  ]}
                >
                  Buscando el lugar perfecto...
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Cuéntame cómo te sientes o qué buscas..."
            placeholderTextColor="#999"
            multiline
            disabled={isTyping}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (isTyping || inputText.trim() === '') && styles.disabledButton,
            ]}
            onPress={handleSendMessage}
            disabled={isTyping || inputText.trim() === ''}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Icon name="paper-plane-outline" size={24} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messageList: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  botBubbleContainer: {
    justifyContent: 'flex-start',
  },
  userBubbleContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: BUBBLE_MAX_WIDTH,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  botBubble: {
    backgroundColor: '#FF6B35',
    borderBottomLeftRadius: 8,
  },
  userBubble: {
    backgroundColor: '#007bff',
    borderBottomRightRadius: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#ffffff',
  },
  userText: {
    color: '#ffffff',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  typingText: {
    marginLeft: 10,
  },
  placeInfoContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  mapsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  mapsButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 25,
    maxHeight: 120,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginRight: 0,
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: '#FF6B35',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  sendButtonText: { // This style might no longer be used if Text is removed
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ChatbotBarranquilla;
