import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import { clientAPI } from '../../src/services/clientApi';

export default function EmergencyScreen() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(null); // Para mostrar loading en botones individuales

  useEffect(() => {
    loadEmergencyWorkers();
  }, []);

  const loadEmergencyWorkers = async () => {
    try {
      setLoading(true);
      const emergencyWorkers = await clientAPI.getEmergencyWorkers();
      setWorkers(emergencyWorkers);
    } catch (error) {
      console.error('Error cargando profesionales:', error);
      Alert.alert('Error', 'No se pudieron cargar los profesionales disponibles');
    } finally {
      setLoading(false);
    }
  };

  const contactWorker = async (worker) => {
  try {
    setContacting(worker.id);
    
    console.log('🔄 Contactando a:', worker.name);
    
    const contactData = {
      worker_id: worker.id,
      service_type: worker.profession,
      urgency: 'emergency',
      description: `Necesito servicios de ${worker.profession} urgentemente`,
      contact_method: 'both',
      budget_estimate: null, // ✅ Explícitamente null
      preferred_date: null,  // ✅ Explícitamente null  
      preferred_time: null   // ✅ Explícitamente null
    };

    const result = await clientAPI.contactWorker(contactData);
    
    console.log('✅ Respuesta del contacto:', result);
    
    Alert.alert(
      '✅ Solicitud Enviada',
      `${worker.name} ha recibido tu solicitud de emergencia y se contactará contigo pronto.`,
      [{ text: 'OK' }]
    );
    
  } catch (error) {
    console.error('❌ Error contactando profesional:', error);
    
    let errorMessage = 'No se pudo enviar la solicitud';
    
    if (error.message.includes('500')) {
      errorMessage = 'Error del servidor. Intenta nuevamente.';
    } else if (error.message.includes('No se pudo contactar al profesional')) {
      errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
    } else {
      errorMessage = error.message || 'Error al contactar al profesional';
    }
    
    Alert.alert('❌ Error', errorMessage);
  } finally {
    setContacting(null);
  }
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Buscando profesionales disponibles...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚨 Emergencia</Text>
        <Text style={styles.subtitle}>Profesionales disponibles para ayuda inmediata</Text>
      </View>

      {workers.length === 0 ? (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No hay profesionales disponibles en este momento</Text>
          <Text style={styles.noResultsSubtext}>Intenta nuevamente en unos minutos</Text>
        </View>
      ) : (
        workers.map((worker) => (
          <TouchableOpacity 
            key={worker.id} 
            style={styles.workerCard}
            onPress={() => contactWorker(worker)}
            disabled={contacting === worker.id} // Deshabilitar mientras contacta
          >
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <Text style={styles.workerProfession}>{worker.profession}</Text>
              <View style={styles.workerDetails}>
                <Text style={styles.workerRating}>⭐ {worker.rating || 'Nuevo'}</Text>
                <Text style={styles.workerAvailability}>
                  {worker.availability === 'available' ? '✅ Disponible' : '⏳ Ocupado'}
                </Text>
              </View>
              {worker.description && (
                <Text style={styles.workerDescription}>{worker.description}</Text>
              )}
              {worker.experience_years && (
                <Text style={styles.workerExperience}>📅 {worker.experience_years} años de experiencia</Text>
              )}
            </View>
            <View style={[
              styles.contactButton,
              contacting === worker.id && styles.contactButtonDisabled
            ]}>
              {contacting === worker.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.contactButtonText}>Contactar</Text>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Volver al Inicio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FF3B30',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  noResults: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  workerCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  workerProfession: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  workerDetails: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 15,
  },
  workerRating: {
    fontSize: 12,
    color: '#FF9500',
  },
  workerAvailability: {
    fontSize: 12,
    color: '#34C759',
  },
  workerDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  workerExperience: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 3,
  },
  contactButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  contactButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  backButton: {
    backgroundColor: '#8E8E93',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});