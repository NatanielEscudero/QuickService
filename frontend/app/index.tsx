import { useAuth } from '../src/context/AuthContext';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { user, loading, isAuthenticated } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    console.log('🏠 Index - Estado actual:', { 
      user: user?.email, 
      role: user?.role, 
      loading, 
      isAuthenticated,
      hasChecked 
    });
    
    if (!loading) {
      console.log('🔄 Procesando redirección...');
      
      // Pequeño delay para asegurar que todo esté listo
      const timer = setTimeout(() => {
        if (!user) {
          console.log('➡️ No hay usuario, redirigiendo a login');
          router.replace('/auth/login');
        } else if (user.role === 'client') {
          console.log('➡️ Usuario cliente, redirigiendo a /client');
          router.replace('/client');
        } else if (user.role === 'worker') {
          console.log('➡️ Usuario trabajador, redirigiendo a /worker');
          router.replace('/worker');
        } else {
          console.log('❌ Rol no reconocido, redirigiendo a login');
          router.replace('/auth/login');
        }
        setHasChecked(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, loading, isAuthenticated, hasChecked]);

  console.log('🎬 Renderizando Index...');

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ marginTop: 10 }}>Verificando autenticación...</Text>
      <Text style={{ marginTop: 5, fontSize: 12, color: '#666' }}>
        {user ? `Usuario: ${user.role}` : 'Sin usuario'}
      </Text>
      <Text style={{ marginTop: 5, fontSize: 10, color: '#999' }}>
        Loading: {loading ? 'Sí' : 'No'}
      </Text>
    </View>
  );
}