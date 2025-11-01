import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROFESSIONS, ProfessionType } from '../../src/data/professions';

export default function SelectProfessionScreen() {
  const [selectedProfession, setSelectedProfession] = useState<ProfessionType | null>(null);
  const [customProfession, setCustomProfession] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();

  const handleProfessionSelect = async () => {
    if (!selectedProfession && !customProfession.trim()) {
      Alert.alert('Error', 'Por favor selecciona una profesión o escribe una personalizada');
      return;
    }

    setLoading(true);
    try {
      // Usar la profesión seleccionada o la personalizada
      const finalProfession = selectedProfession === 'other' 
        ? customProfession.trim() 
        : PROFESSIONS.find(p => p.id === selectedProfession)?.name || customProfession.trim();

      if (!finalProfession) {
        throw new Error('Profesión no válida');
      }

      console.log('🎯 Seleccionando profesión:', finalProfession);
      
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        throw new Error('No se encontró token de autenticación');
      }

      // Actualizar la profesión del usuario en el backend
      const response = await fetch('http://localhost:3001/api/users/update-profession', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ 
          profession: finalProfession,
          description: `Soy ${finalProfession} profesional` // Descripción por defecto
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error actualizando profesión');
      }

      const data = await response.json();
      
      // Actualizar el usuario en el contexto
      if (user) {
        const updatedUser = { 
          ...user, 
          profession: finalProfession,
          role: 'worker' // Asegurar que sea worker
        };
        await updateUser(updatedUser);
      }

      console.log('✅ Profesión actualizada:', finalProfession);
      
      // Redirigir al dashboard de trabajador
      router.replace('/worker');

    } catch (error: any) {
      console.error('❌ Error seleccionando profesión:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar la profesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Si omite, usar profesión genérica
    router.replace('/worker');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>¡Excelente elección!</Text>
        <Text style={styles.subtitle}>
          Selecciona tu área de especialización para que los clientes puedan encontrarte fácilmente:
        </Text>

        {/* Lista de profesiones */}
        <View style={styles.professionsGrid}>
          {PROFESSIONS.map((profession) => (
            <TouchableOpacity
              key={profession.id}
              style={[
                styles.professionCard,
                selectedProfession === profession.id && styles.professionCardSelected
              ]}
              onPress={() => {
                setSelectedProfession(profession.id);
                if (profession.id !== 'other') {
                  setCustomProfession(''); // Limpiar campo personalizado
                }
              }}
              disabled={loading}
            >
              <Text style={styles.professionIcon}>{profession.icon}</Text>
              <Text style={styles.professionName}>{profession.name}</Text>
              <Text style={styles.professionDescription}>{profession.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Campo para profesión personalizada */}
        {selectedProfession === 'other' && (
          <View style={styles.customSection}>
            <Text style={styles.customLabel}>Especifica tu profesión:</Text>
            <TextInput
              style={styles.customInput}
              placeholder="Ej: Cerrajero, Técnico en aire acondicionado, etc."
              value={customProfession}
              onChangeText={setCustomProfession}
              placeholderTextColor="#999"
              maxLength={50}
            />
          </View>
        )}

        {/* Botón de confirmación */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedProfession || loading) && styles.confirmButtonDisabled
          ]}
          onPress={handleProfessionSelect}
          disabled={!selectedProfession || loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Procesando...' : 'Comenzar a trabajar'}
          </Text>
        </TouchableOpacity>

        {/* Opción para omitir */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={styles.skipText}>Configurar más tarde</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Puedes cambiar tu especialización en cualquier momento desde tu perfil
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
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  professionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  professionCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  professionCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  professionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  professionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  professionDescription: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    lineHeight: 14,
  },
  customSection: {
    marginBottom: 20,
  },
  customLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  customInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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