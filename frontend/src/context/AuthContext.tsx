import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, handleAPIError } from '../services/api';
import { router } from 'expo-router';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'client' | 'worker' | 'admin' | null;
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
  auth_provider?: 'local' | 'google';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  checkEmailExists: (email: string) => Promise<any>;
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
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);

  // ✅ CALCULAR isAuthenticated como variable, no como función
  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    checkAuthState();
  }, []);

  // 🔥 Effect para manejar redirección después del login - CORREGIDO
  useEffect(() => {
    if (loginSuccess && user && isAuthenticated) {
      console.log('✅ Login exitoso detectado, redirigiendo...', { 
        email: user.email, 
        role: user.role,
        auth_provider: user.auth_provider 
      });
      
      const timer = setTimeout(() => {
        handlePostLoginRedirect();
        setLoginSuccess(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, user, isAuthenticated]); // ✅ isAuthenticated ya está definido

  // ✅ Función para manejar redirección post-login
  const handlePostLoginRedirect = () => {
    if (!user) return;

    console.log('🎯 Determinando redirección para usuario:', {
      email: user.email,
      role: user.role,
      auth_provider: user.auth_provider
    });

    if (user.role === null) {
      console.log('🎯 Usuario sin rol, redirigiendo a selección...');
      router.replace('/auth/select-role');
    } else if (user.role === 'worker') {
      console.log('➡️ Usuario trabajador, redirigiendo a /worker');
      router.replace('/worker');
    } else if (user.role === 'client') {
      console.log('➡️ Usuario cliente, redirigiendo a /client');
      router.replace('/client');
    } else if (user.role === 'admin') {
      console.log('➡️ Usuario admin, redirigiendo a /admin');
      router.replace('/admin');
    } else {
      console.log('➡️ Rol no reconocido, redirigiendo a /client por defecto');
      router.replace('/client');
    }
  };

  // Effect para debug del estado de autenticación
  useEffect(() => {
    console.log('🔄 AuthContext actualizado:', { 
      user: user?.email, 
      role: user?.role, 
      auth_provider: user?.auth_provider,
      isAuthenticated: isAuthenticated, // ✅ Usar la variable, no la función
      loading,
      loginSuccess
    });
  }, [user, token, loading, loginSuccess, isAuthenticated]); // ✅ Agregar isAuthenticated a las dependencias

  const checkAuthState = async (): Promise<void> => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      const storedAuthProvider = await AsyncStorage.getItem('authProvider');

      console.log('📦 Datos almacenados encontrados:', { 
        hasToken: !!storedToken, 
        hasUser: !!storedUser,
        authProvider: storedAuthProvider
      });

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        console.log('✅ Usuario restaurado desde storage:', { 
          role: parsedUser.role, 
          auth_provider: parsedUser.auth_provider 
        });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setError('Error verificando sesión');
    } finally {
      setLoading(false);
    }
  };

  // Función genérica para manejar login exitoso
  const handleSuccessfulLogin = async (token: string, userData: User) => {
    console.log('✅ Login exitoso - procesando datos:', { 
      user: userData, 
      hasToken: !!token,
      auth_provider: userData.auth_provider,
      role: userData.role
    });
    
    setUser(userData);
    setToken(token);
    
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    await AsyncStorage.setItem('authProvider', userData.auth_provider || 'local');
    
    console.log('💾 Datos guardados en storage - AuthProvider:', userData.auth_provider);
    
    setLoginSuccess(true);
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setLoginSuccess(false);
      
      console.log('🔐 Iniciando proceso de login local...');
      const response = await authAPI.login(email, password);
      
      await handleSuccessfulLogin(response.token, response.user);
      
    } catch (error: any) {
      const errorMessage = handleAPIError(error);
      setError(errorMessage);
      setLoginSuccess(false);
      console.error('❌ Error en login local:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setLoginSuccess(false);
      
      console.log('🔐 Iniciando proceso de login con Google...');
      
      const response = await fetch('http://localhost:3001/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: googleToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en autenticación con Google');
      }

      await handleSuccessfulLogin(data.token, data.user);
      
      console.log('✅ Login con Google exitoso');
      
    } catch (error: any) {
      const errorMessage = error.message || 'Error en autenticación con Google';
      setError(errorMessage);
      setLoginSuccess(false);
      console.error('❌ Error en login con Google:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (email: string): Promise<any> => {
    try {
      console.log('📧 Verificando existencia de email:', email);
      
      const response = await fetch('http://localhost:3001/api/auth/google/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error verificando email');
      }

      return data;
      
    } catch (error: any) {
      console.error('❌ Error verificando email:', error.message);
      throw new Error(error.message);
    }
  };

  const register = async (userData: any): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      setLoginSuccess(false);
      
      console.log('📝 Enviando datos de registro al backend:', userData);
      
      const response = await authAPI.register(userData);
      
      await handleSuccessfulLogin(response.token, response.user);
      
      console.log('✅ Registro completado - usuario:', response.user.role);
      
      return response.user;
      
    } catch (error: any) {
      const errorMessage = handleAPIError(error);
      console.error('❌ Error en registro:', errorMessage);
      setError(errorMessage);
      setLoginSuccess(false);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext: Iniciando logout...');
      
      setLoginSuccess(false);
      
      await AsyncStorage.multiRemove(['userToken', 'userData', 'authProvider']);
      console.log('✅ AuthContext: AsyncStorage limpiado');
      
      setUser(null);
      setToken(null);
      setError(null);
      
      console.log('✅ AuthContext: Estado limpiado');
      console.log('✅ AuthContext: Logout completado exitosamente');
      
    } catch (error) {
      console.error('❌ AuthContext: Error durante logout:', error);
      setUser(null);
      setToken(null);
      setError(null);
      setLoginSuccess(false);
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
    isAuthenticated, // ✅ Esto ahora es una variable, no una función
    error,
    clearError,
    loginWithGoogle,
    checkEmailExists
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