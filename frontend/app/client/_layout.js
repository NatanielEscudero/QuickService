import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';

export default function ClientLayout() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    console.log('🖲️ Botón logout presionado');
    try {
      await logout();
      // REDIRECCIÓN FORZADA inmediata
      console.log('➡️ Redirigiendo a login manualmente');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#fff',
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salir</Text>
        </TouchableOpacity>
      ),
    }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'QuickService Pro - Cliente',
        }} 
      />
    </Stack>
  );
}