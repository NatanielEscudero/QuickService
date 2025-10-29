import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, handleAPIError } from '../services/api';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'client' | 'worker' | 'admin';
  phone?: string;
  avatar_url?: string;
  is_verified?: boolean;
  profession?: string;
  rating?: number;
  completed_services?: number;
  description?: string;
  experience_years?: number;
  hourly_rate?: number;
  availability?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  // 🔥 NUEVO: Effect para debug del estado de autenticación
  useEffect(() => {
    console.log('🔄 AuthContext actualizado:', { 
      user: user?.email, 
      role: user?.role, 
      isAuthenticated: !!user && !!token,
      loading 
    });
  }, [user, token, loading]);

  const checkAuthState = async (): Promise<void> => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');

      console.log('📦 Datos almacenados encontrados:', { 
        hasToken: !!storedToken, 
        hasUser: !!storedUser 
      });

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        console.log('✅ Usuario restaurado desde storage:', parsedUser.role);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setError('Error verificando sesión');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Iniciando proceso de login...');
      const response = await authAPI.login(email, password);
      
      console.log('✅ Respuesta del servidor:', { 
        user: response.user, 
        hasToken: !!response.token 
      });
      
      setUser(response.user);
      setToken(response.token);
      
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.user));
      
      console.log('💾 Datos guardados en storage');
      
    } catch (error: any) {
      const errorMessage = handleAPIError(error);
      setError(errorMessage);
      console.error('❌ Error en login:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

 const register = async (userData: any): Promise<User> => { // ✅ Ahora retorna User
  try {
    setLoading(true);
    setError(null);
    
    console.log('📝 Enviando datos de registro al backend:', userData);
    
    const response = await authAPI.register(userData);
    
    console.log('✅ Registro exitoso - respuesta del backend:', { 
      user: response.user, 
      hasToken: !!response.token 
    });
    
    setUser(response.user);
    setToken(response.token);
    
    await AsyncStorage.setItem('userToken', response.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.user));
    
    console.log('💾 Datos de registro guardados en storage');
    console.log('✅ Registro completado - usuario:', response.user.role);
    
    // ✅ RETORNAR el usuario para redirección inmediata
    return response.user;
    
  } catch (error: any) {
    const errorMessage = handleAPIError(error);
    console.error('❌ Error en registro:', errorMessage);
    setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext: Iniciando logout...');
      
      // 1. Limpiar AsyncStorage PRIMERO
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      console.log('✅ AuthContext: AsyncStorage limpiado');
      
      // 2. Luego limpiar estado
      setUser(null);
      setToken(null);
      setError(null);
      
      console.log('✅ AuthContext: Estado limpiado');
      console.log('✅ AuthContext: Logout completado exitosamente');
      
    } catch (error) {
      console.error('❌ AuthContext: Error durante logout:', error);
      // Limpiar estado incluso si hay error con AsyncStorage
      setUser(null);
      setToken(null);
      setError(null);
      throw error;
    }
  };

  const updateUser = async (updatedUser: User): Promise<void> => {
    try {
      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      console.log('✅ Usuario actualizado en contexto y storage');
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Error actualizando usuario');
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};