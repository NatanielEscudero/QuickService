import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { clientAPI } from '../../src/services/clientApi';

interface TimeSlot {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface AvailabilityData {
  immediate_service: boolean;
  time_slots: TimeSlot[];
  coverage_radius: number;
}

interface AvailabilityStats {
  active_days: number;
  weekly_hours: number;
  availability_percentage: number;
}

export default function WorkerAvailabilityScreen() {
  const [immediateService, setImmediateService] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [coverageRadius, setCoverageRadius] = useState(15);
  const [stats, setStats] = useState<AvailabilityStats>({
    active_days: 0,
    weekly_hours: 0,
    availability_percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [radiusModalVisible, setRadiusModalVisible] = useState(false);

  // Opciones de radio de servicio
  const radiusOptions = [5, 10, 15, 20, 25, 30, 40, 50];

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando disponibilidad del trabajador...');
      
      // Cargar disponibilidad
      const availabilityData: AvailabilityData = await clientAPI.getWorkerAvailability();
      console.log('✅ Disponibilidad cargada:', availabilityData);
      
      setImmediateService(availabilityData.immediate_service);
      setTimeSlots(availabilityData.time_slots);
      setCoverageRadius(availabilityData.coverage_radius);

      // Cargar estadísticas
      const statsData: AvailabilityStats = await clientAPI.getAvailabilityStats();
      console.log('✅ Estadísticas cargadas:', statsData);
      
      setStats(statsData);

    } catch (error) {
      console.error('❌ Error cargando disponibilidad:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (index: number) => {
    const newSlots = [...timeSlots];
    newSlots[index].enabled = !newSlots[index].enabled;
    setTimeSlots(newSlots);
  };

  const calculateStats = (slots: TimeSlot[]) => {
    const activeDays = slots.filter(slot => slot.enabled).length;
    
    // Calcular horas semanales (simplificado)
    let weeklyHours = 0;
    slots.forEach(slot => {
      if (slot.enabled) {
        const start = parseInt(slot.startTime.split(':')[0]);
        const end = parseInt(slot.endTime.split(':')[0]);
        weeklyHours += (end - start);
      }
    });

    const availabilityPercentage = Math.round((activeDays / 7) * 100);

    return {
      active_days: activeDays,
      weekly_hours: weeklyHours,
      availability_percentage: availabilityPercentage
    };
  };

  const selectRadius = (radius: number) => {
    setCoverageRadius(radius);
    setRadiusModalVisible(false);
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);
      console.log('💾 Guardando disponibilidad...');

      const availabilityData: AvailabilityData = {
        immediate_service: immediateService,
        time_slots: timeSlots,
        coverage_radius: coverageRadius
      };

      // Calcular estadísticas actualizadas
      const updatedStats = calculateStats(timeSlots);
      setStats(updatedStats);

      // Guardar en el backend
      const response = await clientAPI.saveWorkerAvailability(availabilityData);
      console.log('✅ Respuesta del servidor:', response);

      Alert.alert('Éxito', 'Disponibilidad guardada correctamente');
      
    } catch (error) {
      console.error('❌ Error guardando disponibilidad:', error);
      Alert.alert('Error', 'No se pudo guardar la disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  const getRadiusDescription = (radius: number) => {
    if (radius <= 10) return 'Zona local';
    if (radius <= 20) return 'Zona media';
    if (radius <= 30) return 'Zona amplia';
    return 'Zona extensa';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Cargando disponibilidad...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Servicio inmediato */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Servicio Inmediato</Text>
            <Text style={styles.switchDescription}>
              Recibir solicitudes de emergencia
            </Text>
          </View>
          <Switch
            value={immediateService}
            onValueChange={setImmediateService}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={immediateService ? '#28A745' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Horario semanal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Horario Semanal</Text>
        <Text style={styles.sectionSubtitle}>
          Configura tus horarios de disponibilidad
        </Text>

        {timeSlots.map((slot, index) => (
          <View key={slot.day} style={styles.dayRow}>
            <View style={styles.dayInfo}>
              <Text style={styles.dayName}>{slot.day}</Text>
              {slot.enabled && (
                <Text style={styles.timeText}>
                  {slot.startTime} - {slot.endTime}
                </Text>
              )}
            </View>
            
            <Switch
              value={slot.enabled}
              onValueChange={() => toggleDay(index)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={slot.enabled ? '#28A745' : '#f4f3f4'}
            />
          </View>
        ))}
      </View>

      {/* Zona de cobertura - ACTUALIZADO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zona de Cobertura</Text>
        <TouchableOpacity 
          style={styles.coverageCard}
          onPress={() => setRadiusModalVisible(true)}
        >
          <View style={styles.coverageHeader}>
            <Text style={styles.coverageTitle}>Radio de servicio</Text>
            <Text style={styles.editText}>Cambiar</Text>
          </View>
          <Text style={styles.coverageValue}>{coverageRadius} kilómetros</Text>
          <Text style={styles.coverageDescription}>
            {getRadiusDescription(coverageRadius)} • Área máxima de desplazamiento
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón guardar */}
      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={saveAvailability}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar Disponibilidad</Text>
        )}
      </TouchableOpacity>

      {/* Estadísticas de disponibilidad */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.active_days}/7</Text>
            <Text style={styles.statLabel}>Días activos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.weekly_hours}h</Text>
            <Text style={styles.statLabel}>Horas semanales</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.availability_percentage}%</Text>
            <Text style={styles.statLabel}>Disponibilidad</Text>
          </View>
        </View>
      </View>

      {/* Modal para seleccionar radio */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={radiusModalVisible}
        onRequestClose={() => setRadiusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Radio de Servicio</Text>
            <Text style={styles.modalSubtitle}>
              Elige la distancia máxima que estás dispuesto a viajar para tus servicios
            </Text>
            
            {radiusOptions.map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusOption,
                  coverageRadius === radius && styles.radiusOptionSelected
                ]}
                onPress={() => selectRadius(radius)}
              >
                <View style={styles.radiusOptionContent}>
                  <Text style={styles.radiusValue}>{radius} km</Text>
                  <Text style={styles.radiusDescription}>
                    {getRadiusDescription(radius)}
                  </Text>
                </View>
                {coverageRadius === radius && (
                  <Text style={styles.selectedIcon}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setRadiusModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#28A745',
  },
  coverageCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coverageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  editText: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '600',
  },
  coverageValue: {
    fontSize: 24,
    color: '#28A745',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  coverageDescription: {
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#28A745',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#6C757D',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  // Estilos para el modal de radio
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  radiusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
  },
  radiusOptionSelected: {
    borderColor: '#28A745',
    backgroundColor: '#f8fff8',
  },
  radiusOptionContent: {
    flex: 1,
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  radiusDescription: {
    fontSize: 12,
    color: '#666',
  },
  selectedIcon: {
    fontSize: 18,
    color: '#28A745',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#6C757D',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontWeight: 'bold',
  },
});