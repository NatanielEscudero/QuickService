import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { clientAPI } from '../../../src/services/clientApi';

export default function ServiceCategoryScreen() {
  const { category } = useLocalSearchParams();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(null);

  useEffect(() => {
    if (category) {
      loadWorkersByCategory();
    }
  }, [category]);

  const loadWorkersByCategory = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando workers para categoría:', category);
      const categoryWorkers = await clientAPI.getWorkersByProfession(category);
      console.log('✅ Workers cargados:', categoryWorkers.length);
      setWorkers(categoryWorkers);
    } catch (error) {
      console.error('❌ Error cargando profesionales:', error);
      Alert.alert('Error', 'No se pudieron cargar los profesionales');
    } finally {
      setLoading(false);
    }
  };

  const contactWorker = async (worker) => {
    try {
      setContacting(worker.id);
      
      console.log('🔄 Contactando a:', worker.name, 'ID:', worker.id);
      
      // ✅ DATOS COMPLETAMENTE CORRECTOS
      const contactData = {
        worker_id: worker.id,
        service_type: category, // Usar la categoría de la URL
        urgency: 'high',
        description: `Solicitud de servicios de ${category}`,
        contact_method: 'both',
        budget_estimate: null,
        preferred_date: null,  
        preferred_time: null,
        client_phone: null // ✅ AGREGAR ESTE CAMPO
      };

      console.log('📤 Enviando datos de contacto:', contactData);

      const result = await clientAPI.contactWorker(contactData);
      
      console.log('✅ Contacto exitoso:', result);
      
      Alert.alert(
        '✅ Solicitud Enviada',
        `${worker.name} ha recibido tu solicitud y se contactará contigo pronto.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Error completo contactando profesional:', error);
      
      let errorMessage = 'No se pudo enviar la solicitud';
      
      if (error.message?.includes('500')) {
        errorMessage = 'Error del servidor. Revisa la consola del backend.';
      } else if (error.message?.includes('No se pudo contactar')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      } else {
        errorMessage = error.message || 'Error desconocido';
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
        <Text style={styles.loadingText}>Buscando profesionales de {category}...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profesionales de {category}</Text>
        <Text style={styles.subtitle}>Encuentra el profesional ideal para tu proyecto</Text>
      </View>

      {workers.length === 0 ? (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No hay profesionales disponibles para {category}</Text>
          <Text style={styles.noResultsSubtext}>Intenta con otra categoría o vuelve más tarde</Text>
        </View>
      ) : (
        workers.map((worker) => (
          <View key={worker.id} style={styles.workerCard}> {/* ✅ CAMBIADO A View EN LUGAR DE TouchableOpacity */}
            <View style={styles.workerHeader}>
              <View>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerProfession}>{worker.profession}</Text>
              </View>
              <Text style={styles.workerRating}>⭐ {worker.rating || 'Nuevo'}</Text>
            </View>
            
            {worker.description && (
              <Text style={styles.workerDescription}>{worker.description}</Text>
            )}
            
            <View style={styles.workerDetails}>
              {worker.experience_years && (
                <Text style={styles.workerDetail}>📅 {worker.experience_years} años de experiencia</Text>
              )}
              {worker.hourly_rate && (
                <Text style={styles.workerDetail}>💰 ${worker.hourly_rate}/hora</Text>
              )}
              <Text style={[
                styles.workerDetail,
                worker.availability === 'available' ? styles.available : styles.busy
              ]}>
                {worker.availability === 'available' ? '✅ Disponible' : '⏳ Ocupado'}
              </Text>
              {worker.completed_services && (
                <Text style={styles.workerDetail}>🛠️ {worker.completed_services} servicios completados</Text>
              )}
            </View>
            
            {/* ✅ BOTÓN SEPARADO - SIN ANIDACIÓN */}
            <TouchableOpacity 
              style={[
                styles.contactButton,
                contacting === worker.id && styles.contactButtonDisabled
              ]}
              onPress={() => contactWorker(worker)}
              disabled={contacting === worker.id}
            >
              {contacting === worker.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.contactButtonText}>Contactar Profesional</Text>
              )}
            </TouchableOpacity>
          </View>
        ))
      )}
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
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
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
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
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
  workerRating: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: 'bold',
  },
  workerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  workerDetails: {
    marginBottom: 15,
  },
  workerDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  available: {
    color: '#34C759',
  },
  busy: {
    color: '#FF3B30',
  },
  contactButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  contactButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  contactButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});