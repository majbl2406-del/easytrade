import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Choisir selon l'environnement :
const API_URL = 'https://easytrade-production-c515.up.railway.app/api';  // ← Téléphone réel / backend local
// const API_URL = 'http://192.168.1.5/api';      // ← Web navigateur (si votre backend est sur cette IP)
// const API_URL = 'http://10.0.2.2:3000/api';    // ← Émulateur Android

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      // Rediriger vers la page de connexion
    }
    return Promise.reject(error);
  }
);

export default api;
