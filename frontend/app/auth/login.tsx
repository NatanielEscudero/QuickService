import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
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
  const { login } = useAuth();

  const handleLogin = async (): Promise<void> => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    
    try {
      const mockUser = {
        id: 1,
        email: formData.email,
        name: formData.email.split('@')[0],
        role: formData.email.includes('worker') ? 'worker' : 'client' as 'client' | 'worker',
        phone: '+1234567890'
      };
      
      await login(mockUser, 'mock-token-123');
      
    } catch (error) {
      Alert.alert('Error', 'Credenciales inválidas. Usa cualquier email y contraseña para demo.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof LoginForm, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={formData.password}
        onChangeText={(value) => updateField('password', value)}
        secureTextEntry
        placeholderTextColor="#999"
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => router.push('./register')}
      >
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate aquí</Text>
      </TouchableOpacity>

      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>Datos de prueba:</Text>
        <Text style={styles.demoText}>Email: cliente@ejemplo.com / trabajador@ejemplo.com</Text>
        <Text style={styles.demoText}>Password: cualquier contraseña</Text>
      </View>
    </View>
  );
}

// Los styles permanecen igual...
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
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  demoSection: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#e9f7fe',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});