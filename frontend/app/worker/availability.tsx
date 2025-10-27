import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert 
} from 'react-native';

interface TimeSlot {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export default function WorkerAvailabilityScreen() {
  const [immediateService, setImmediateService] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { day: 'Lunes', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Martes', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Miércoles', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Jueves', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Viernes', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Sábado', enabled: false, startTime: '10:00', endTime: '14:00' },
    { day: 'Domingo', enabled: false, startTime: '10:00', endTime: '14:00' },
  ]);

  const toggleDay = (index: number) => {
    const newSlots = [...timeSlots];
    newSlots[index].enabled = !newSlots[index].enabled;
    setTimeSlots(newSlots);
  };

  const saveAvailability = () => {
    Alert.alert('Éxito', 'Disponibilidad guardada correctamente');
  };

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

      {/* Zona de cobertura */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zona de Cobertura</Text>
        <View style={styles.coverageCard}>
          <Text style={styles.coverageTitle}>Radio de servicio</Text>
          <Text style={styles.coverageValue}>15 kilómetros</Text>
          <Text style={styles.coverageDescription}>
            Área máxima de desplazamiento para servicios
          </Text>
        </View>
      </View>

      {/* Botón guardar */}
      <TouchableOpacity style={styles.saveButton} onPress={saveAvailability}>
        <Text style={styles.saveButtonText}>Guardar Disponibilidad</Text>
      </TouchableOpacity>

      {/* Estadísticas de disponibilidad */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>5/7</Text>
            <Text style={styles.statLabel}>Días activos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>45h</Text>
            <Text style={styles.statLabel}>Horas semanales</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>92%</Text>
            <Text style={styles.statLabel}>Disponibilidad</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  coverageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  coverageValue: {
    fontSize: 18,
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
});