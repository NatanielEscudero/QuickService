import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import GoogleSignInButton from '../../src/components/GoogleSignInButton'; // ✅ NUEVO
import { Colors } from '../../constants/theme';

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
  const [apiError, setApiError] = useState<string>('');
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
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      setApiError(errorMessage);
      Alert.alert('Error de autenticación', errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Manejar éxito de Google Auth
  const handleGoogleSuccess = (user: any) => {
    console.log('✅ Login con Google exitoso:', user);
    setLoginSuccess(true);
  };

  // ✅ NUEVO: Manejar error de Google Auth
  const handleGoogleError = (error: string) => {
    console.error('❌ Error en Google Auth:', error);
    setApiError(error);
    Alert.alert('Error de Google', error);
  };

  const handleSubmitEditing = () => {
    if (formData.email && formData.password && !loading) {
      handleLogin();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>QuickService Pro</Text>
        <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
        
        {/* ✅ NUEVO: Botón de Google */}
        <View style={styles.socialLoginSection}>
          <Text style={styles.socialLoginText}>O inicia sesión con</Text>
          <GoogleSignInButton 
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </View>

        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>o</Text>
          <View style={styles.separatorLine} />
        </View>
        
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
          placeholderTextColor={Colors.gunmetal}
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
          placeholderTextColor={Colors.gunmetal}
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

        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: Colors.gunmetal,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: Colors.gunmetal,
  },
  // ✅ NUEVOS ESTILOS PARA GOOGLE AUTH
  socialLoginSection: {
    marginBottom: 25,
  },
  socialLoginText: {
    textAlign: 'center',
    marginBottom: 15,
    color: Colors.gunmetal,
    fontSize: 14,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${Colors.gunmetal}20`,
  },
  separatorText: {
    marginHorizontal: 15,
    color: Colors.gunmetal,
    fontSize: 14,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.gunmetal,
    fontSize: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: `${Colors.gunmetal}20`,
    padding: 15,
    marginBottom: 5,
    borderRadius: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: Colors.light.error,
    backgroundColor: `${Colors.light.error}20`,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 12,
    marginBottom: 15,
    marginTop: 2,
  },
  apiErrorContainer: {
    backgroundColor: `${Colors.light.error}20`,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.error,
    marginBottom: 15,
  },
  apiErrorText: {
    color: Colors.light.error,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.celestialBlue,
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
    color: Colors.white,
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
    color: Colors.celestialBlue,
    fontSize: 16,
  },
  debugSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.sandyBrown,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: Colors.sandyBrown,
    fontSize: 12,
  },
  debugText: {
    fontSize: 10,
    color: Colors.sandyBrown,
    marginBottom: 2,
  },
});