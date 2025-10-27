import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert 
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
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();

  const professions: string[] = ['Plomería', 'Electricidad', 'Carpintería', 'Pintura', 'Jardinería'];

  const handleRegister = async (): Promise<void> => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (formData.role === 'worker' && !formData.profession) {
      Alert.alert('Error', 'Por favor selecciona una profesión');
      return;
    }

    setLoading(true);

    try {
      const mockUser = {
        id: Math.random(),
        email: formData.email,
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        profession: formData.profession
      };

      await login(mockUser, 'mock-token-123');
      Alert.alert('Éxito', 'Cuenta creada correctamente');

    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof RegisterForm>(field: K, value: RegisterForm[K]): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo *"
        value={formData.name}
        onChangeText={(value) => updateField('name', value)}
      />

      {/* ... resto de los campos ... */}

      <Text style={styles.label}>Tipo de Usuario *</Text>
      <View style={styles.roleButtons}>
        <TouchableOpacity 
          style={[
            styles.roleBtn, 
            formData.role === 'client' && styles.roleBtnActive
          ]}
          onPress={() => updateField('role', 'client')}
        >
          <Text style={formData.role === 'client' ? styles.roleBtnTextActive : styles.roleBtnText}>
            👤 Cliente
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.roleBtn, 
            formData.role === 'worker' && styles.roleBtnActive
          ]}
          onPress={() => updateField('role', 'worker')}
        >
          <Text style={formData.role === 'worker' ? styles.roleBtnTextActive : styles.roleBtnText}>
            🔧 Trabajador
          </Text>
        </TouchableOpacity>
      </View>

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
                onPress={() => updateField('profession', prof)}
              >
                <Text style={formData.profession === prof ? styles.professionBtnTextActive : styles.professionBtnText}>
                  {prof}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => router.back()}
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
    marginVertical: 30,
    color: '#333',
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
  label: {
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
    color: '#333',
    fontSize: 16,
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
  },
  roleBtnTextActive: {
    color: '#2196F3',
    fontWeight: 'bold',
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
});