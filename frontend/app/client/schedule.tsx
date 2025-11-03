import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Modal,
  Platform 
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import { clientAPI } from '../../src/services/clientApi';

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false); // ✅ MODAL PERSONALIZADO

  const services = ['Plomería', 'Electricidad', 'Carpintería', 'Pintura', 'Jardinería'];
  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  useEffect(() => {
    if (selectedService) {
      loadWorkersByService();
    }
  }, [selectedService]);

  const loadWorkersByService = async () => {
    try {
      const serviceWorkers = await clientAPI.getWorkersByProfession(selectedService);
      setWorkers(serviceWorkers);
      if (serviceWorkers.length > 0) {
        setSelectedWorker(serviceWorkers[0]);
      }
    } catch (error) {
      console.error('Error cargando profesionales:', error);
    }
  };

  // ✅ FUNCIÓN MEJORADA - Modal personalizado
  const handleDateSelect = () => {
    setShowDateModal(true);
  };

  // ✅ GENERAR PRÓXIMAS FECHAS DISPONIBLES
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    // Próximos 14 días (excluyendo domingos)
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Excluir domingos (0 = domingo)
      if (date.getDay() !== 0) {
        dates.push({
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })
        });
      }
    }
    
    return dates;
  };

  const handleSchedule = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !selectedWorker) {
      Alert.alert('Error', 'Por favor completa todos los campos y selecciona un profesional');
      return;
    }

    try {
      setLoading(true);
      
      const appointmentData = {
        worker_id: selectedWorker.id,
        service_type: selectedService,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        description: `Servicio de ${selectedService} programado`,
        contact_phone: user?.phone || 'No especificado'
      };

      console.log('📅 Enviando datos del turno:', appointmentData);
      
      const result = await clientAPI.scheduleAppointment(appointmentData);
      
      Alert.alert(
        '✅ Turno Programado',
        `Tu turno para ${selectedService} con ${selectedWorker.name} ha sido programado exitosamente para el ${formatDisplayDate(selectedDate)} a las ${selectedTime}.`,
        [{
          text: 'OK',
          onPress: () => router.back()
        }]
      );
    } catch (error) {
      console.error('Error programando turno:', error);
      Alert.alert('❌ Error', error.message || 'No se pudo programar el turno');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Formatear fecha para mostrar
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Seleccionar fecha';
    
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const availableDates = getAvailableDates();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Programar Turno</Text>
        <Text style={styles.subtitle}>Selecciona el servicio y horario que prefieras</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecciona el Servicio</Text>
        {services.map((service) => (
          <TouchableOpacity
            key={service}
            style={[
              styles.serviceOption,
              selectedService === service && styles.serviceOptionSelected
            ]}
            onPress={() => setSelectedService(service)}
          >
            <Text style={[
              styles.serviceOptionText,
              selectedService === service && styles.serviceOptionTextSelected
            ]}>
              {service}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedService && workers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona un Profesional</Text>
          {workers.map((worker) => (
            <TouchableOpacity
              key={worker.id}
              style={[
                styles.workerOption,
                selectedWorker?.id === worker.id && styles.workerOptionSelected
              ]}
              onPress={() => setSelectedWorker(worker)}
            >
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerRating}>⭐ {worker.rating || 'Nuevo'}</Text>
                <Text style={styles.workerAvailability}>
                  {worker.availability === 'available' ? '✅ Disponible' : '⏳ Ocupado'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedService && workers.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profesionales</Text>
          <Text style={styles.noWorkersText}>No hay profesionales disponibles para {selectedService}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecciona la Fecha</Text>
        <TouchableOpacity 
          style={styles.dateInput}
          onPress={handleDateSelect}
        >
          <Text style={selectedDate ? styles.dateText : styles.placeholderText}>
            {formatDisplayDate(selectedDate)}
          </Text>
        </TouchableOpacity>
        <Text style={styles.dateHint}>
          Toca para seleccionar una fecha disponible
        </Text>
      </View>

      {/* ✅ MODAL DE FECHAS DISPONIBLES */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona una Fecha</Text>
            <Text style={styles.modalSubtitle}>Fechas disponibles para tu turno:</Text>
            
            <ScrollView style={styles.datesList}>
              {availableDates.map((dateObj) => (
                <TouchableOpacity
                  key={dateObj.date}
                  style={[
                    styles.dateOption,
                    selectedDate === dateObj.date && styles.dateOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedDate(dateObj.date);
                    setShowDateModal(false);
                  }}
                >
                  <Text style={[
                    styles.dateOptionText,
                    selectedDate === dateObj.date && styles.dateOptionTextSelected
                  ]}>
                    {dateObj.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecciona el Horario</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                selectedTime === time && styles.timeSlotSelected
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[
                styles.timeSlotText,
                selectedTime === time && styles.timeSlotTextSelected
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.scheduleButton,
          (!selectedService || !selectedDate || !selectedTime || !selectedWorker || loading) && styles.scheduleButtonDisabled
        ]}
        onPress={handleSchedule}
        disabled={!selectedService || !selectedDate || !selectedTime || !selectedWorker || loading}
      >
        <Text style={styles.scheduleButtonText}>
          {loading ? 'Programando...' : 'Programar Turno'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Cancelar</Text>
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
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
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
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  serviceOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 10,
  },
  serviceOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  serviceOptionText: {
    fontSize: 16,
    color: '#333',
  },
  serviceOptionTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  workerOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 10,
  },
  workerOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  workerRating: {
    fontSize: 14,
    color: '#FF9500',
    marginTop: 2,
  },
  workerAvailability: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 2,
  },
  noWorkersText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 15,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  dateHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
  },
  timeSlotTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  scheduleButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  scheduleButtonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.6,
  },
  scheduleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#8E8E93',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // ✅ NUEVOS ESTILOS PARA EL MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  datesList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  dateOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 10,
  },
  dateOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  dateOptionTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#8E8E93',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});