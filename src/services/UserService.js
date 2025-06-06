import AsyncStorage from '@react-native-async-storage/async-storage';

class UserService {
  // Obtener estadísticas del usuario
  static async getUserStats(userId) {
    try {
      // En producción, aquí se haría una llamada a API real
      // const response = await axios.get(`${API_BASE_URL}/users/${userId}/stats`);
      // return response.data;
      
      // Para desarrollo, generamos datos de estadísticas simulados
      const mockStats = {
        visitedPlaces: Math.floor(Math.random() * 10),
        reviewsCount: Math.floor(Math.random() * 5),
        favoriteCategories: [
          { name: 'Cafeterías', count: 3 },
          { name: 'Restaurantes', count: 2 },
        ],
        preferredMoods: [
          { name: 'relaxed', count: 5 },
          { name: 'creative', count: 3 },
        ],
      };
      
      // Intentar recuperar estadísticas almacenadas localmente
      const storedStats = await AsyncStorage.getItem(`stats_${userId}`);
      if (storedStats) {
        return JSON.parse(storedStats);
      }
      
      // Si no hay estadísticas almacenadas, guardamos las mock y las devolvemos
      await AsyncStorage.setItem(`stats_${userId}`, JSON.stringify(mockStats));
      return mockStats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        visitedPlaces: 0,
        reviewsCount: 0,
        favoriteCategories: [],
        preferredMoods: [],
      };
    }
  }

  // Limpiar datos de feedback del usuario
  static async clearUserFeedback(userId) {
    try {
      // En producción, aquí se haría una llamada a API real
      // await axios.delete(`${API_BASE_URL}/users/${userId}/feedback`);
      
      // Para desarrollo, eliminamos los datos almacenados localmente
      await AsyncStorage.removeItem(`feedback_${userId}`);
      await AsyncStorage.removeItem(`stats_${userId}`);
      return true;
    } catch (error) {
      console.error('Error clearing user feedback:', error);
      throw error;
    }
  }
}

export default UserService;