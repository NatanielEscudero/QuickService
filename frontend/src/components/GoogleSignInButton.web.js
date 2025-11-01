import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { StyleSheet, View, Text } from 'react-native';

const GoogleSignInButtonWeb = ({ onSuccess, onError }) => {
  const { loginWithGoogle } = useAuth();

  return (
    <View style={styles.container}>
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            console.log('🔐 Google Login exitoso - Token:', credentialResponse.credential ? 'Recibido' : 'No token');
            await loginWithGoogle(credentialResponse.credential);
            onSuccess?.();
          } catch (error) {
            console.error('❌ Error en Google Login:', error);
            onError?.(error.message);
          }
        }}
        onError={() => {
          console.log('❌ Google Login falló');
          onError?.('Error en autenticación con Google');
        }}
        useOneTap={false}
        theme="filled_blue"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="300"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
});

export default GoogleSignInButtonWeb;