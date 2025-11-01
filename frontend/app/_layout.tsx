import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootLayout() {
  // Solo configurar Google Sign-In para móvil
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const configureGoogle = async () => {
        try {
          const { GoogleSignin } = require('@react-native-google-signin/google-signin');
          await GoogleSignin.configure({
            webClientId: '584687367545-o8tunkjli3m774l3l9tesfc1fcofhob6.apps.googleusercontent.com',
            offlineAccess: true,
          });
          console.log('✅ Google Sign-In configurado para móvil');
        } catch (error) {
          console.error('❌ Error configurando Google Sign-In móvil:', error);
        }
      };
      configureGoogle();
    }
  }, []);

  // Para web, usar GoogleOAuthProvider
  if (Platform.OS === 'web') {
    return (
      <GoogleOAuthProvider clientId="584687367545-o8tunkjli3m774l3l9tesfc1fcofhob6.apps.googleusercontent.com">
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="client" />
            <Stack.Screen name="worker" />
            <Stack.Screen name="common" />
            {/* ✅ PASO 5: AGREGAR NUEVAS PANTALLAS AL ROUTER */}
            <Stack.Screen name="auth/select-role" />
            <Stack.Screen name="auth/select-profession" />
          </Stack>
        </AuthProvider>
      </GoogleOAuthProvider>
    );
  }

  // Para móvil, layout normal
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="client" />
        <Stack.Screen name="worker" />
        <Stack.Screen name="common" />
        {/* ✅ PASO 5: AGREGAR NUEVAS PANTALLAS AL ROUTER */}
        <Stack.Screen name="auth/select-role" />
        <Stack.Screen name="auth/select-profession" />
      </Stack>
    </AuthProvider>
  );
}