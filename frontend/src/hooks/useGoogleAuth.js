import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, checkEmailExists } = useAuth(); // ✅ Usar las nuevas funciones

  const signInWithGoogle = async (googleToken) => {
    setLoading(true);
    
    try {
      console.log('🔐 useGoogleAuth: Iniciando autenticación...');
      
      // Usar la función del contexto en lugar de fetch directo
      await loginWithGoogle(googleToken);
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error en Google Sign-In:', error);
      return { 
        success: false, 
        error: error.message || 'Error en autenticación con Google' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithGoogle,
    checkEmailExists, // ✅ Exportar esta función también
    loading
  };
};