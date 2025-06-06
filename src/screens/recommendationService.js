// recommendationService.js
import axios from 'axios';

// Configura la URL base de la API - Corregido el puerto para que coincida con main.py
const API_URL = 'http://localhost:5050'; // Actualizado al puerto 5050 donde se ejecuta la API

// Opcional: Configuración de axios para manejar errores de CORS o autenticación
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
// Si la API requiere algún token o autenticación, puedes agregarlo aquí
// axios.defaults.headers.common['Authorization'] = 'Bearer tu-token';

/**
 * Servicio para gestionar las interacciones con la API de recomendaciones
 */
class RecommendationService {
  /**
   * Verifica que la API esté funcionando correctamente
   * @returns {Promise} Objeto con estado de la API
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Error al verificar estado de la API:', error);
      // Añadir más detalles sobre el error
      if (error.response) {
        // La respuesta del servidor contiene información
        console.error('Respuesta del servidor:', error.response.data);
        console.error('Código de estado:', error.response.status);
      } else if (error.request) {
        // La solicitud se realizó pero no se recibió respuesta
        console.error('No se recibió respuesta del servidor');
      }
      throw error;
    }
  }

  /**
   * Obtiene recomendaciones de lugares basadas en actividad, ciudad y estado de ánimo
   * @param {string} activity - Actividad que el usuario desea realizar
   * @param {string} city - Ciudad donde buscar lugares
   * @param {string} mood - Estado de ánimo del usuario (opcional)
   * @param {number} limit - Número máximo de recomendaciones (opcional, por defecto 5)
   * @returns {Promise} Lista de lugares recomendados
   */
  async getRecommendations(activity, city, mood = null, limit = 5) {
    try {
      const response = await axios.post(`${API_URL}/recommend`, {
        activity,
        city,
        mood,
        limit
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener recomendaciones:', error);
      this._logDetailedError(error);
      throw error;
    }
  }

  /**
   * Analiza el texto del usuario para detectar su estado de ánimo
   * @param {string} text - Texto del usuario a analizar
   * @returns {Promise} Estado de ánimo detectado y nivel de confianza
   */
  async analyzeMood(text) {
    try {
      const response = await axios.post(`${API_URL}/analyze-mood`, { text });
      return response.data;
    } catch (error) {
      console.error('Error al analizar estado de ánimo:', error);
      this._logDetailedError(error);
      throw error;
    }
  }

  /**
   * Analiza el texto del usuario para detectar la actividad deseada
   * @param {string} text - Texto del usuario a analizar
   * @returns {Promise} Actividad detectada y nivel de confianza
   */
  async analyzeActivity(text) {
    try {
      const response = await axios.post(`${API_URL}/analyze-activity`, { text });
      return response.data;
    } catch (error) {
      console.error('Error al analizar actividad:', error);
      this._logDetailedError(error);
      throw error;
    }
  }

  /**
   * Procesa un mensaje completo del usuario para extraer intenciones
   * @param {string} message - Mensaje completo del usuario
   * @returns {Promise} Objeto con estado de ánimo y actividad detectados
   */
  async processUserMessage(message) {
    try {
      // Verificar primero que la API esté disponible
      try {
        await this.checkHealth();
      } catch (healthError) {
        console.warn('API no disponible, usando procesamiento local:', healthError);
        // Si la API no está disponible, devolver datos predeterminados
        return this._processMessageLocally(message);
      }
      
      // Si la API está disponible, proceder normalmente
      const moodResult = await this.analyzeMood(message);
      const activityResult = await this.analyzeActivity(message);
      
      return {
        mood: moodResult.detected_mood,
        moodConfidence: moodResult.confidence,
        activity: activityResult.detected_activity,
        activityText: activityResult.activity_text,
        activityConfidence: activityResult.confidence,
        allDetectedActivities: activityResult.all_detected_activities || []
      };
    } catch (error) {
      console.error('Error al procesar mensaje del usuario:', error);
      this._logDetailedError(error);
      
      // Si falla, usar el procesamiento local como respaldo
      console.warn('Usando procesamiento local como respaldo');
      return this._processMessageLocally(message);
    }
  }
  
  /**
   * Método privado para procesar mensajes localmente cuando la API no está disponible
   * @param {string} message - Mensaje del usuario
   * @returns {Object} Resultados similares a los que devolvería la API
   */
  _processMessageLocally(message) {
    const lowerMessage = message.toLowerCase();
    
    // Detección simple de estado de ánimo
    let mood = 'neutral';
    let moodConfidence = 0.5;
    
    if (lowerMessage.includes('feliz') || lowerMessage.includes('contento') || lowerMessage.includes('bien')) {
      mood = 'happy';
      moodConfidence = 0.8;
    } else if (lowerMessage.includes('triste') || lowerMessage.includes('mal')) {
      mood = 'sad';
      moodConfidence = 0.8;
    } else if (lowerMessage.includes('aburrido')) {
      mood = 'bored';
      moodConfidence = 0.8;
    } else if (lowerMessage.includes('estresado') || lowerMessage.includes('cansado')) {
      mood = 'stressed';
      moodConfidence = 0.8;
    }
    
    // Detección simple de actividad
    let activity = 'general';
    let activityConfidence = 0.5;
    
    if (lowerMessage.includes('comer') || lowerMessage.includes('restaurante')) {
      activity = 'food';
      activityConfidence = 0.8;
    } else if (lowerMessage.includes('pasear') || lowerMessage.includes('caminar')) {
      activity = 'nature';
      activityConfidence = 0.8;
    } else if (lowerMessage.includes('museo') || lowerMessage.includes('arte')) {
      activity = 'culture';
      activityConfidence = 0.8;
    } else if (lowerMessage.includes('relaj') || lowerMessage.includes('descansar')) {
      activity = 'relax';
      activityConfidence = 0.8;
    }
    
    return {
      mood: mood,
      moodConfidence: moodConfidence,
      activity: activity,
      activityText: message.substring(0, 100),
      activityConfidence: activityConfidence,
      allDetectedActivities: [activity]
    };
  }
  
  /**
   * Método privado para registrar errores detallados
   * @param {Error} error - Objeto de error
   */
  _logDetailedError(error) {
    if (error.response) {
      // La respuesta del servidor contiene información
      console.error('Respuesta del servidor:', error.response.data);
      console.error('Código de estado:', error.response.status);
      console.error('Cabeceras:', error.response.headers);
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor');
    } else {
      // Algo ocurrió al configurar la solicitud
      console.error('Error de configuración:', error.message);
    }
    console.error('Configuración:', error.config);
  }
}

// Exportar una instancia del servicio
export default new RecommendationService();