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

// Interfaces para servicios y appointments
export interface ServiceRequest {
  id: number;
  client_id: number;
  worker_id: number;
  service_type: string;
  urgency: string;
  description: string;
  status: string;
  budget_estimate: number;
  preferred_date: string;
  preferred_time: string;
  contact_method: string;
  client_phone: string;
  created_at: string;
  client_name: string;
  client_email: string;
}

export interface Appointment {
  id: number;
  client_id: number;
  worker_id: number;
  service_type: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_cost: number;
  address: string;
  contact_phone: string;
  special_instructions: string;
  created_at: string;
  client_name: string;
  client_email: string;
}

interface ServiceRequestsResponse {
  requests: ServiceRequest[];
}

interface AppointmentsResponse {
  appointments: Appointment[];
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

// NUEVO: API para servicios y appointments del trabajador
export const servicesAPI = {
  // Obtener todas las solicitudes de servicio
  getMyRequests: (): Promise<ServiceRequestsResponse> => 
    api.get('/worker/requests'),
  
  // Obtener appointments del trabajador
  getMyAppointments: (): Promise<AppointmentsResponse> => 
    api.get('/worker/appointments'),
  
  // Aceptar una solicitud de servicio
  acceptRequest: (requestId: number): Promise<ApiResponse> => 
    api.put(`/worker/requests/${requestId}/accept`),
  
  // Rechazar una solicitud de servicio
  rejectRequest: (requestId: number): Promise<ApiResponse> => 
    api.put(`/worker/requests/${requestId}/reject`),
  
  // Actualizar estado de un appointment
  updateAppointmentStatus: (appointmentId: number, status: string): Promise<ApiResponse> => 
    api.put(`/worker/appointments/${appointmentId}/status`, { status }),
  
  // Obtener estadísticas del trabajador
  getWorkerStats: (): Promise<{
    pendingRequests: number;
    upcomingAppointments: number;
    monthlyEarnings: number;
    totalCompleted: number;
  }> => api.get('/worker/stats'),
  
  // Obtener perfil completo del trabajador (incluye datos de workers table)
  getWorkerProfile: (): Promise<{ worker: any }> => 
    api.get('/worker/profile'),
  
  // Actualizar perfil del trabajador
  updateWorkerProfile: (profileData: any): Promise<ApiResponse> => 
    api.put('/worker/profile', profileData),
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

// Export principal para compatibilidad con código existente
export const clientAPI = {
  ...authAPI,
  ...usersAPI,
  ...categoriesAPI,
  ...servicesAPI,
};

export default api;