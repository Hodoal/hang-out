import React, { useState, useRef, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

// APIs Configuration
const OPENROUTER_API_KEY =
  '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';
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Reemplazar con tu API key
const NLP_SERVER_URL = 'http://localhost:5000'; // Updated port for Flask NLP service
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

  const markdownStyle = {
    body: { color: '#ffffff', fontSize: 16 }, // Matches botText color and approximate size
    heading1: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginVertical: 5 },
    heading2: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginVertical: 4 },
    strong: { fontWeight: 'bold', color: '#ffffff' },
    em: { fontStyle: 'italic', color: '#ffffff' },
    bullet_list: { color: '#ffffff' },
    ordered_list: { color: '#ffffff' },
    list_item: { marginVertical: 2, color: '#ffffff' },
    link: { color: '#E0F7FA', textDecorationLine: 'underline' }, // A slightly different color for links
    text: { color: '#ffffff' }, // Default text color within markdown
    paragraph: { marginTop: 5, marginBottom: 5, color: '#ffffff' }
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
            model: 'deepseek/deepseek-r1:free',
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
        colors={['#FF6B35', '#F7931E', '#FFD23F']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Hang out</Text>
        <Text style={styles.headerSubtitle}>
          Tu asistente turístico inteligente
        </Text>
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
              <Text style={styles.sendButtonText}>Enviar</Text>
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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    maxHeight: 120,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: '#FF6B35',
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
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
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ChatbotBarranquilla;
