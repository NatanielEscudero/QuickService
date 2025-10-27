import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function ClientLayout() {
  const { logout } = useAuth();

  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: {
        backgroundColor: '#007AFF',
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
          title: 'QuickService Pro',
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: 'Mi Perfil',
        }} 
      />
    </Stack>
  );
}