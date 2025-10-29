import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'client' | 'worker';
  profession: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  profession?: string;
}

export default function RegisterScreen() {
  const [formData, setFormData] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'client',
    profession: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const { register } = useAuth();

  const professions: string[] = [
    'Plomería', 
    'Electricidad', 
    'Carpintería', 
    'Pintura', 
    'Jardinería', 
    'Albañilería', 
    'Herrería'
  ];

  // ✅ Validaciones individuales por campo
  const validateField = (field: keyof RegisterForm, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'El nombre es requerido';
        if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (/[0-9]/.test(value)) return 'El nombre no puede contener números';
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return 'Solo se permiten letras y espacios';
        return '';

      case 'email':
        if (!value.trim()) return 'El email es requerido';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Email no válido';
        return '';

      case 'phone':
        if (!value.trim()) return 'El teléfono es requerido';
        const phoneRegex = /^[+]?[0-9\s\-()]{10,}$/;
        if (!phoneRegex.test(value)) return 'Teléfono no válido';
        if (value.replace(/\D/g, '').length < 10) return 'Mínimo 10 dígitos';
        return '';

      case 'password':
        if (!value) return 'La contraseña es requerida';
        if (value.length < 6) return 'Mínimo 6 caracteres';
        if (!/(?=.*[a-z])(?=.*[A-Z])/.test(value)) return 'Debe tener mayúsculas y minúsculas';
        if (!/(?=.*\d)/.test(value)) return 'Debe tener al menos un número';
        return '';

      case 'confirmPassword':
        if (!value) return 'Confirma tu contraseña';
        if (value !== formData.password) return 'Las contraseñas no coinciden';
        return '';

      case 'profession':
        if (formData.role === 'worker' && !value) return 'Selecciona una profesión';
        return '';

      default:
        return '';
    }
  };

  // ✅ Validar todo el formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof RegisterForm>).forEach(field => {
      if (field !== 'role') { // No validar el campo role
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // ✅ Manejar cambios en los campos con validación en tiempo real
  const handleFieldChange = (field: keyof RegisterForm, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Si el campo ha sido tocado, validar en tiempo real
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }

    // Limpiar profesión si cambian de worker a client
    if (field === 'role' && value === 'client') {
      setFormData(prev => ({ ...prev, profession: '' }));
      setErrors(prev => ({ ...prev, profession: '' }));
    }
  };

  // ✅ Marcar campo como tocado
  const handleFieldBlur = (field: keyof RegisterForm): void => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleRegister = async (): Promise<void> => {
    // Marcar todos los campos como tocados
    const allTouched: Record<string, boolean> = {};
    (Object.keys(formData) as Array<keyof RegisterForm>).forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        profession: formData.role === 'worker' ? formData.profession : undefined
      };

      console.log('📤 Enviando datos al backend:', userData);
      
      // ✅ Registrar y obtener el usuario creado
      const registeredUser = await register(userData);
      
      console.log('✅ Registro exitoso, redirigiendo a:', registeredUser.role);
      
      // ✅ Redirección inmediata basada en el rol
      if (registeredUser.role === 'worker') {
        router.replace('/worker');
      } else {
        router.replace('/client');
      }
      
    } catch (error: any) {
      console.error('Error en registro:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Crear Cuenta</Text>
      <Text style={styles.subtitle}>Únete a QuickService Pro</Text>

      {/* Campo Nombre */}
      <Text style={styles.label}>Nombre completo *</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        placeholder="Ej: Juan Pérez"
        value={formData.name}
        onChangeText={(value) => handleFieldChange('name', value)}
        onBlur={() => handleFieldBlur('name')}
        editable={!loading}
        autoCapitalize="words"
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      {/* Campo Email */}
      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Ej: usuario@ejemplo.com"
        value={formData.email}
        onChangeText={(value) => handleFieldChange('email', value)}
        onBlur={() => handleFieldBlur('email')}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      {/* Campo Teléfono */}
      <Text style={styles.label}>Teléfono *</Text>
      <TextInput
        style={[styles.input, errors.phone && styles.inputError]}
        placeholder="Ej: +1 234 567 8900"
        value={formData.phone}
        onChangeText={(value) => handleFieldChange('phone', value)}
        onBlur={() => handleFieldBlur('phone')}
        keyboardType="phone-pad"
        editable={!loading}
      />
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      {/* Campo Contraseña */}
      <Text style={styles.label}>Contraseña *</Text>
      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Mínimo 6 caracteres con mayúsculas, minúsculas y números"
        value={formData.password}
        onChangeText={(value) => handleFieldChange('password', value)}
        onBlur={() => handleFieldBlur('password')}
        secureTextEntry
        editable={!loading}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      {/* Campo Confirmar Contraseña */}
      <Text style={styles.label}>Confirmar Contraseña *</Text>
      <TextInput
        style={[styles.input, errors.confirmPassword && styles.inputError]}
        placeholder="Repite tu contraseña"
        value={formData.confirmPassword}
        onChangeText={(value) => handleFieldChange('confirmPassword', value)}
        onBlur={() => handleFieldBlur('confirmPassword')}
        secureTextEntry
        editable={!loading}
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

      {/* Selección de Rol */}
      <Text style={styles.label}>Tipo de Usuario *</Text>
      <View style={styles.roleButtons}>
        <TouchableOpacity 
          style={[
            styles.roleBtn, 
            formData.role === 'client' && styles.roleBtnActive
          ]}
          onPress={() => handleFieldChange('role', 'client')}
          disabled={loading}
        >
          <Text style={formData.role === 'client' ? styles.roleBtnTextActive : styles.roleBtnText}>
            👤 Cliente
          </Text>
          <Text style={styles.roleDescription}>Buscar servicios</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.roleBtn, 
            formData.role === 'worker' && styles.roleBtnActive
          ]}
          onPress={() => handleFieldChange('role', 'worker')}
          disabled={loading}
        >
          <Text style={formData.role === 'worker' ? styles.roleBtnTextActive : styles.roleBtnText}>
            🔧 Trabajador
          </Text>
          <Text style={styles.roleDescription}>Ofrecer servicios</Text>
        </TouchableOpacity>
      </View>

      {/* Selección de Profesión (solo para workers) */}
      {formData.role === 'worker' && (
        <>
          <Text style={styles.label}>Profesión *</Text>
          <View style={styles.professionButtons}>
            {professions.map((prof) => (
              <TouchableOpacity
                key={prof}
                style={[
                  styles.professionBtn,
                  formData.profession === prof && styles.professionBtnActive
                ]}
                onPress={() => handleFieldChange('profession', prof)}
                disabled={loading}
              >
                <Text style={formData.profession === prof ? styles.professionBtnTextActive : styles.professionBtnText}>
                  {prof}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.profession && <Text style={styles.errorText}>{errors.profession}</Text>}
        </>
      )}

      <View style={styles.requiredInfo}>
        <Text style={styles.requiredText}>* Campos obligatorios</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.buttonText}>Crear Cuenta</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => router.replace('/auth/login')}
        disabled={loading}
      >
        <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
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
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 5,
    color: '#333',
    fontSize: 16,
  },
  errorText: {
    color: '#DC3545',
    fontSize: 12,
    marginBottom: 10,
    marginTop: 2,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleBtn: {
    flex: 1,
    padding: 15,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 8,
  },
  roleBtnActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  roleBtnText: {
    color: '#666',
    fontWeight: 'bold',
  },
  roleBtnTextActive: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  roleDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  professionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  professionBtn: {
    width: '48%',
    padding: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 8,
  },
  professionBtnActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  professionBtnText: {
    color: '#666',
  },
  professionBtnTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
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
    marginBottom: 30,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  requiredInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  requiredText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});