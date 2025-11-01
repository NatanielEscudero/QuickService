import React from 'react';
import { Platform } from 'react-native';

// Componente para móvil (Android/iOS)
const GoogleSignInButtonNative = ({ onSuccess, onError }) => {
  const { loginWithGoogle } = useAuth();
  
  const handleMobileSignIn = async () => {
    try {
      // Para desarrollo móvil temporal
      const mockToken = 'dev_mock_token_' + Date.now();
      await loginWithGoogle(mockToken);
      onSuccess?.();
    } catch (error) {
      onError?.(error.message);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handleMobileSignIn}
      disabled={loading}
    >
      <Image 
        source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
        style={styles.googleIcon}
      />
      <Text style={styles.buttonText}>Continuar con Google</Text>
    </TouchableOpacity>
  );
};

// Componente principal que elige la implementación correcta
export default function GoogleSignInButton(props) {
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    // Para web, usar el componente específico
    const GoogleSignInButtonWeb = require('./GoogleSignInButton.web').default;
    return <GoogleSignInButtonWeb {...props} />;
  } else {
    // Para móvil, usar implementación nativa
    return <GoogleSignInButtonNative {...props} />;
  }
}