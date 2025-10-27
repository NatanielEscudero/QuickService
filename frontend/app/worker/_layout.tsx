import { Stack } from 'expo-router';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WorkerLayout() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    console.log('🖲️ Botón logout presionado en worker - MODO ULTRA AGRESIVO');
    
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'CERRAR SESIÓN', 
          style: 'destructive',
          onPress: async () => {
            console.log('🔴 INICIANDO LOGOUT ULTRA-AGRESIVO');
            
            // PASO 1: Limpiar TODO manualmente de inmediato
            try {
              console.log('🧹 Limpiando AsyncStorage...');
              await AsyncStorage.multiRemove(['userToken', 'userData']);
              console.log('✅ AsyncStorage LIMPIADO COMPLETAMENTE');
            } catch (e) {
              console.log('⚠️ Error limpiando storage:', e);
            }
            
            // PASO 2: Redirigir INMEDIATAMENTE sin esperar nada
            console.log('➡️ REDIRIGIENDO A LOGIN INMEDIATAMENTE');
            router.replace('/auth/login');
            
            // PASO 3: Forzar recarga de la navegación
            setTimeout(() => {
              console.log('🔄 Forzando navegación...');
              router.replace('/auth/login');
            }, 100);
            
            // PASO 4: Intentar logout del contexto (pero no esperar)
            setTimeout(async () => {
              try {
                console.log('🔄 Intentando logout del contexto...');
                await logout();
                console.log('✅ Logout de contexto completado');
              } catch (error) {
                console.error('❌ Error en logout de contexto:', error);
                // No importa, ya redirigimos
              }
            }, 200);
            
            // PASO 5: Redirección final de respaldo
            setTimeout(() => {
              console.log('🛡️ Redirección de respaldo...');
              router.replace('/auth/login');
            }, 500);
          }
        }
      ]
    );
  };

  // VERSIÓN ALTERNATIVA: Sin Alert, directo
  const handleLogoutDirecto = () => {
    console.log('🔴 LOGOUT DIRECTO SIN CONFIRMACIÓN');
    
    // Limpiar inmediatamente
    AsyncStorage.multiRemove(['userToken', 'userData']).catch(() => {});
    
    // Redirigir inmediatamente
    router.replace('/auth/login');
    
    // Intentar logout del contexto después
    setTimeout(() => {
      logout().catch(() => {});
    }, 100);
  };

  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: {
        backgroundColor: '#28A745',
      },
      headerTintColor: '#fff',
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleLogout} 
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salir</Text>
        </TouchableOpacity>
      ),
    }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Panel Trabajador',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleLogoutDirecto} 
              style={{ 
                marginRight: 15, 
                backgroundColor: '#DC3545', 
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 5
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>SALIR</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: 'Mi Perfil',
        }} 
      />
      <Stack.Screen 
        name="services" 
        options={{ 
          title: 'Mis Servicios',
        }} 
      />
      <Stack.Screen 
        name="availability" 
        options={{ 
          title: 'Disponibilidad',
        }} 
      />
      <Stack.Screen 
        name="earnings" 
        options={{ 
          title: 'Ganancias',
        }} 
      />
    </Stack>
  );
}