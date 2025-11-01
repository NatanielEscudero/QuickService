import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView 
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SelectRoleScreen() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'worker' | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();

  const handleRoleSelect = async (role: 'client' | 'worker') => {
    setLoading(true);
    try {
      console.log('🎯 Seleccionando rol:', role);
      
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        throw new Error('No se encontró token de autenticación');
      }

      // Actualizar el rol del usuario en el backend
      const response = await fetch('http://localhost:3001/api/users/update-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ role })
      });

      const responseData = await response.json(); // ✅ Parsear respuesta siempre

      if (!response.ok) {
        console.error('❌ Error del servidor:', responseData);
        throw new Error(responseData.error || 'Error actualizando rol');
      }

      console.log('✅ Respuesta del servidor:', responseData);
      
      // Actualizar el usuario en el contexto
      if (user) {
        const updatedUser = { ...user, role };
        await updateUser(updatedUser);
      }

      console.log('✅ Rol actualizado:', role);
      
      // Redirigir según el rol seleccionado
      if (role === 'client') {
        console.log('➡️ Redirigiendo a cliente');
        router.replace('/client');
      } else {
        console.log('➡️ Redirigiendo a selección de profesión para trabajador');
        router.replace('/auth/select-profession');
      }

    } catch (error: any) {
      console.error('❌ Error completo seleccionando rol:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar el rol. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('⏭️  Omitiendo selección de rol - redirigiendo a cliente');
    router.replace('/client');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>¡Bienvenido a QuickService!</Text>
        <Text style={styles.subtitle}>
          Para personalizar tu experiencia, selecciona cómo planeas usar la app:
        </Text>

        {/* Tarjeta Cliente */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'client' && styles.roleCardSelected
          ]}
          onPress={() => setSelectedRole('client')}
          disabled={loading}
        >
          <View style={styles.roleHeader}>
            <Text style={styles.roleIcon}>👤</Text>
            <Text style={styles.roleTitle}>Cliente</Text>
          </View>
          <Text style={styles.roleDescription}>
            Busco servicios profesionales para mis necesidades
          </Text>
          <Text style={styles.roleFeatures}>
            • Contratar servicios{'\n'}
            • Calificar trabajadores{'\n'}
            • Gestionar solicitudes
          </Text>
        </TouchableOpacity>

        {/* Tarjeta Trabajador */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'worker' && styles.roleCardSelected
          ]}
          onPress={() => setSelectedRole('worker')}
          disabled={loading}
        >
          <View style={styles.roleHeader}>
            <Text style={styles.roleIcon}>🔧</Text>
            <Text style={styles.roleTitle}>Trabajador</Text>
          </View>
          <Text style={styles.roleDescription}>
            Ofrezco mis servicios profesionales a clientes
          </Text>
          <Text style={styles.roleFeatures}>
            • Publicar servicios{'\n'}
            • Gestionar citas{'\n'}
            • Crear perfil profesional
          </Text>
          <Text style={styles.workerNote}>
            🎯 Podrás elegir tu especialización en el siguiente paso
          </Text>
        </TouchableOpacity>

        {/* Botón de confirmación */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedRole || loading) && styles.confirmButtonDisabled
          ]}
          onPress={() => selectedRole && handleRoleSelect(selectedRole)}
          disabled={!selectedRole || loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Procesando...' : 'Continuar'}
          </Text>
        </TouchableOpacity>

        {/* Opción para omitir */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={styles.skipText}>Omitir por ahora</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Puedes cambiar esta configuración más tarde en tu perfil
        </Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
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
    lineHeight: 22,
  },
  roleCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  roleCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  roleFeatures: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  workerNote: {
    fontSize: 11,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  skipButton: {
    padding: 10,
    alignItems: 'center',
  },
  skipText: {
    color: '#007AFF',
    fontSize: 14,
  },
  note: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 20,
  },
});