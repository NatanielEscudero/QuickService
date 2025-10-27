import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const { login, user, isAuthenticated } = useAuth();

  // Efecto para redirigir cuando la autenticación es exitosa
  useEffect(() => {
    if (loginSuccess && user && isAuthenticated) {
      console.log('✅ Login exitoso detectado, redirigiendo...', user.role);
      
      // Pequeño delay para asegurar la navegación
      const timer = setTimeout(() => {
        if (user.role === 'worker') {
          router.replace('/worker');
        } else if (user.role === 'client') {
          router.replace('/client');
        } else {
          router.replace('/client'); // fallback
        }
        setLoginSuccess(false); // resetear estado
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, user, isAuthenticated]);

  const handleLogin = async (): Promise<void> => {
    if (!formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 Enviando credenciales...');
      await login(formData.email.trim(), formData.password);
      
      // Marcar login como exitoso
      setLoginSuccess(true);
      console.log('✅ Login marcado como exitoso, esperando redirección...');
      
    } catch (error: any) {
      console.error('❌ Error completo en login:', error);
      setLoginSuccess(false);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.message) {
        const errorMsgLower = error.message.toLowerCase();
        
        if (errorMsgLower.includes('no existe') || 
            errorMsgLower.includes('not found') ||
            errorMsgLower.includes('usuario no encontrado') ||
            errorMsgLower.includes('user not found') ||
            errorMsgLower.includes('invalid credentials') ||
            errorMsgLower.includes('credenciales inválidas')) {
          errorMessage = 'El usuario no existe. Por favor verifica tu email o regístrate.';
        } else if (errorMsgLower.includes('password') || 
                   errorMsgLower.includes('contraseña') ||
                   errorMsgLower.includes('incorrect')) {
          errorMessage = 'Contraseña incorrecta. Por favor intenta nuevamente.';
        } else if (errorMsgLower.includes('network') || 
                   errorMsgLower.includes('red') ||
                   errorMsgLower.includes('connection')) {
          errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error de autenticación', errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof LoginForm, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitEditing = () => {
    if (formData.email && formData.password) {
      handleLogin();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QuickService Pro</Text>
      <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(value) => updateField('email', value)}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#999"
        returnKeyType="next"
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={formData.password}
        onChangeText={(value) => updateField('password', value)}
        secureTextEntry
        placeholderTextColor="#999"
        returnKeyType="done"
        onSubmitEditing={handleSubmitEditing}
        editable={!loading}
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.linkButton, loading && styles.linkButtonDisabled]}
        onPress={() => !loading && router.push('/auth/register')}
        disabled={loading}
      >
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate aquí</Text>
      </TouchableOpacity>

      {/* Sección de debug */}
      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>Estado:</Text>
        <Text style={styles.debugText}>Autenticado: {isAuthenticated ? 'Sí' : 'No'}</Text>
        <Text style={styles.debugText}>Usuario: {user ? user.role : 'Ninguno'}</Text>
        <Text style={styles.debugText}>Login Success: {loginSuccess ? 'Sí' : 'No'}</Text>
        <Text style={styles.debugText}>Loading: {loading ? 'Sí' : 'No'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkButton: {
    padding: 10,
    alignItems: 'center',
  },
  linkButtonDisabled: {
    opacity: 0.5,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  debugSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#856404',
    fontSize: 12,
  },
  debugText: {
    fontSize: 10,
    color: '#856404',
    marginBottom: 2,
  },
});