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

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>(''); // ✅ Para mostrar errores debajo del formulario
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

  // ✅ Validaciones individuales por campo
  const validateField = (field: keyof LoginForm, value: string): string => {
    switch (field) {
      case 'email':
        if (!value.trim()) return 'El email es requerido';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Email no válido';
        return '';

      case 'password':
        if (!value) return 'La contraseña es requerida';
        if (value.length < 6) return 'Mínimo 6 caracteres';
        return '';

      default:
        return '';
    }
  };

  // ✅ Validar todo el formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof LoginForm>).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // ✅ Manejar cambios en los campos con validación en tiempo real
  const handleFieldChange = (field: keyof LoginForm, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error de API cuando el usuario empiece a escribir
    if (apiError) {
      setApiError('');
    }
    
    // Si el campo ha sido tocado, validar en tiempo real
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  // ✅ Marcar campo como tocado
  const handleFieldBlur = (field: keyof LoginForm): void => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleLogin = async (): Promise<void> => {
    // Limpiar error de API previo
    setApiError('');
    
    // Marcar todos los campos como tocados
    const allTouched: Record<string, boolean> = {};
    (Object.keys(formData) as Array<keyof LoginForm>).forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
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
      
      // ✅ MEJOR MANEJO DE ERRORES - Mostrar directamente el mensaje del backend
      if (error.message) {
        errorMessage = error.message; // Esto mostrará "Credenciales inválidas"
      }
      
      // ✅ Mostrar error debajo del formulario en lugar de Alert
      setApiError(errorMessage);
      
      // También mantener el Alert por si acaso
      Alert.alert('Error de autenticación', errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEditing = () => {
    if (formData.email && formData.password && !loading) {
      handleLogin();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QuickService Pro</Text>
      <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
      
      {/* Campo Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Ej: usuario@ejemplo.com"
        value={formData.email}
        onChangeText={(value) => handleFieldChange('email', value)}
        onBlur={() => handleFieldBlur('email')}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#999"
        returnKeyType="next"
        editable={!loading}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      
      {/* Campo Contraseña */}
      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Mínimo 6 caracteres"
        value={formData.password}
        onChangeText={(value) => handleFieldChange('password', value)}
        onBlur={() => handleFieldBlur('password')}
        secureTextEntry
        placeholderTextColor="#999"
        returnKeyType="done"
        onSubmitEditing={handleSubmitEditing}
        editable={!loading}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      
      {/* ✅ Mostrar error de API debajo del formulario */}
      {apiError && (
        <View style={styles.apiErrorContainer}>
          <Text style={styles.apiErrorText}>❌ {apiError}</Text>
        </View>
      )}
      
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
        onPress={() => !loading && router.replace('/auth/register')}
        disabled={loading}
      >
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate aquí</Text>
      </TouchableOpacity>

      {/* Sección de debug (opcional - puedes quitarla) */}
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
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    fontSize: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 5,
    borderRadius: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#DC3545',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#DC3545',
    fontSize: 12,
    marginBottom: 15,
    marginTop: 2,
  },
  // ✅ Nuevos estilos para error de API
  apiErrorContainer: {
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
    marginBottom: 15,
  },
  apiErrorText: {
    color: '#DC3545',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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