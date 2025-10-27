import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interfaces para las respuestas de la API
interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

interface AuthResponse {
  token: string;
  user: any;
  message: string;
}

interface UserResponse {
  user: any;
}

interface WorkersResponse {
  workers: any[];
}

interface CategoriesResponse {
  categories: any[];
}

// IMPORTANTE: Cambiar por tu IP local si estás en dispositivo físico
const API_BASE_URL = 'http://localhost:3001/api'; 

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas - CORREGIDO
api.interceptors.response.use(
  (response) => {
    // Retornamos solo los datos, no toda la respuesta de axios
    return response.data;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        // Token expirado o inválido
        AsyncStorage.removeItem('userToken');
        AsyncStorage.removeItem('userData');
      }
      
      // Retornamos el error de la API
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('Network Error - No response received:', error.request);
      return Promise.reject({ 
        error: 'No se pudo conectar al servidor. Verifica que esté ejecutándose.' 
      });
    } else {
      console.error('Request Error:', error.message);
      return Promise.reject({ error: error.message });
    }
  }
);

// API endpoints organizados por módulos - CON TIPOS CORRECTOS
export const authAPI = {
  login: (email: string, password: string): Promise<AuthResponse> => 
    api.post('/auth/login', { email, password }),
  
  register: (userData: any): Promise<AuthResponse> => 
    api.post('/auth/register', userData),
  
  verifyToken: (): Promise<ApiResponse> => 
    api.get('/auth/verify'),
};

export const usersAPI = {
  getProfile: (): Promise<UserResponse> => 
    api.get('/users/profile'),
  
  updateProfile: (userData: any): Promise<UserResponse> => 
    api.put('/users/profile', userData),
  
  updatePassword: (currentPassword: string, newPassword: string): Promise<ApiResponse> =>
    api.put('/users/password', { currentPassword, newPassword }),
  
  updateAvatar: (avatarUrl: string): Promise<ApiResponse> =>
    api.put('/users/avatar', { avatar_url: avatarUrl }),
  
  getWorkers: (filters?: any): Promise<WorkersResponse> => 
    api.get('/users/workers', { params: filters }),
  
  getWorkerProfile: (workerId: number): Promise<UserResponse> =>
    api.get(`/users/workers/${workerId}`),
  
  updateAvailability: (availability: string): Promise<ApiResponse> =>
    api.put('/users/workers/availability', { availability }),
};

export const categoriesAPI = {
  getAll: (): Promise<CategoriesResponse> => 
    api.get('/categories'),
  
  getById: (id: number): Promise<{ category: any }> => 
    api.get(`/categories/${id}`),
};

// Utility functions
export const handleAPIError = (error: any): string => {
  if (error && error.error) {
    return error.error;
  }
  if (error && error.message) {
    return error.message;
  }
  return 'Error de conexión. Por favor intenta de nuevo.';
};

export const isNetworkError = (error: any): boolean => {
  return error.message && error.message.includes('Network Error');
};

export default api;