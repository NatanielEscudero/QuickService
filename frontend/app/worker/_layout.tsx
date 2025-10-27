import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function WorkerLayout() {
  const { logout } = useAuth();

  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: {
        backgroundColor: '#28A745', // Verde para trabajador
      },
      headerTintColor: '#fff',
      headerRight: () => (
        <TouchableOpacity onPress={logout} style={{ marginRight: 15 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salir</Text>
        </TouchableOpacity>
      ),
    }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Panel Trabajador',
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