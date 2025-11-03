import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import { clientAPI } from '../../src/services/clientApi';

interface ServiceRequest {
  id: number;
  client_id: number;
  worker_id: number;
  service_type: string;
  urgency: string;
  description: string;
  status: string;
  budget_estimate: number;
  preferred_date: string;
  preferred_time: string;
  contact_method: string;
  client_phone: string;
  created_at: string;
  client_name: string;
  client_email: string;
}

interface Appointment {
  id: number;
  client_id: number;
  worker_id: number;
  service_type: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  total_cost: number;
  address: string;
  contact_phone: string;
  special_instructions: string;
  created_at: string;
  client_name: string;
  client_email: string;
}

export default function WorkerHomeScreen() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<'available' | 'busy' | 'offline'>('available');
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    upcomingAppointments: 0,
    monthlyEarnings: 0,
    totalCompleted: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  
  // ✅ ESTADOS PARA MODALES
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');

  useEffect(() => {
    loadWorkerData();
  }, []);

  // Sincronizar availability con user cuando cambie
  useEffect(() => {
    console.log('🔄 Sincronizando availability con user:', user?.availability);
    console.log('🔍 User object completo:', user);
    if (user?.availability) {
      setAvailability(user.availability);
    }
  }, [user?.availability]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkerData();
  };

  const loadWorkerData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos del worker...');
      
      // ✅ CARGAR DISPONIBILIDAD DEL TRABAJADOR ACTUAL
      try {
        const currentAvailability = await clientAPI.getMyAvailability();
        console.log('✅ Disponibilidad cargada desde backend:', currentAvailability);
        setAvailability(currentAvailability);
      } catch (availabilityError) {
        console.error('❌ Error cargando disponibilidad:', availabilityError);
        setAvailability('available'); // Valor por defecto
      }

      // ✅ USAR LOS NUEVOS ENDPOINTS ESPECÍFICOS PARA TRABAJADORES
      const workerRequests = await clientAPI.getWorkerRequests();
      console.log('📋 Todas las solicitudes del trabajador:', workerRequests);
      
      const pendingRequests = workerRequests.filter(req => req.status === 'pending');
      setPendingRequests(pendingRequests);

      // ✅ USAR LOS NUEVOS ENDPOINTS ESPECÍFICOS PARA TRABAJADORES
      const workerAppointments = await clientAPI.getWorkerAppointments();
      console.log('📅 Todos los turnos del trabajador:', workerAppointments);
      
      const upcomingAppointments = workerAppointments.filter(apt => 
        ['pending', 'confirmed'].includes(apt.status)
      );
      setUpcomingAppointments(upcomingAppointments);

      // Calcular estadísticas
      const completedAppointments = workerAppointments.filter(apt => 
        apt.status === 'completed'
      );
      
      const completedServices = completedAppointments.length;
      const totalEarnings = completedAppointments.reduce((sum, apt) => sum + (parseFloat(apt.total_cost) || 0), 0);

      setStats({
        pendingRequests: pendingRequests.length,
        upcomingAppointments: upcomingAppointments.length,
        monthlyEarnings: totalEarnings,
        totalCompleted: completedServices
      });

      console.log('✅ Datos cargados para trabajador:', {
        requests: pendingRequests.length,
        appointments: upcomingAppointments.length,
        availability: availability,
        stats: stats
      });

    } catch (error) {
      console.error('❌ Error cargando datos del worker:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ FUNCIONES PARA MODALES DE ACEPTAR CON PRESUPUESTO
  const showAcceptModal = (request: ServiceRequest) => {
    console.log('🔄 Mostrando modal de aceptar para request:', request.id);
    setSelectedRequest(request);
    setBudgetAmount('');
    setShowBudgetModal(true);
  };

  const executeAcceptRequest = async () => {
  if (!selectedRequest) return;
  
  try {
    setProcessingAction(true);
    console.log('✅ Ejecutando aceptación para requestId:', selectedRequest.id);
    console.log('💰 Presupuesto ingresado:', budgetAmount);
    
    if (!user?.id) {
      console.log('❌ No hay user.id disponible');
      Alert.alert('Error', 'No se pudo identificar al usuario');
      return;
    }
    
    console.log('🔄 Llamando a clientAPI.acceptRequest...');
    
    // ✅ CORREGIDO: Enviar el presupuesto a la API
    const response = await clientAPI.acceptRequest(
      selectedRequest.id, 
      budgetAmount ? parseFloat(budgetAmount) : null
    );
    
    console.log('✅ Respuesta de acceptRequest:', response);
    
    // Actualizar estado local
    console.log('🔄 Actualizando estado local...');
    setPendingRequests(prev => {
      const newRequests = prev.filter(req => req.id !== selectedRequest.id);
      console.log('📋 Solicitudes después de filtrar:', newRequests.length);
      return newRequests;
    });
    
    setStats(prev => ({ 
      ...prev, 
      pendingRequests: prev.pendingRequests - 1 
    }));
    
    console.log('✅ Estado local actualizado');
    
    // Cerrar modal y mostrar éxito
    setShowBudgetModal(false);
    setSelectedRequest(null);
    setBudgetAmount('');
    
    Alert.alert(
      'Éxito', 
      budgetAmount 
        ? `Solicitud aceptada con presupuesto de $${budgetAmount}`
        : 'Solicitud aceptada correctamente'
    );
    
  } catch (error) {
    console.error('❌ Error aceptando solicitud:', error);
    console.error('❌ Detalles del error:', error.message);
    Alert.alert('Error', 'No se pudo aceptar la solicitud: ' + error.message);
  } finally {
    setProcessingAction(false);
  }
};

  const executeRejectRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setProcessingAction(true);
      console.log('✅ Ejecutando rechazo para requestId:', selectedRequest.id);
      
      await clientAPI.rejectRequest(selectedRequest.id);
      
      // Actualizar estado local
      setPendingRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setStats(prev => ({ ...prev, pendingRequests: prev.pendingRequests - 1 }));
      
      // Cerrar modal y mostrar éxito
      setRejectModalVisible(false);
      setSelectedRequest(null);
      Alert.alert('Solicitud rechazada', 'La solicitud ha sido rechazada correctamente');
      
    } catch (error) {
      console.error('❌ Error rechazando solicitud:', error);
      Alert.alert('Error', 'No se pudo rechazar la solicitud');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpdateAvailability = async (newAvailability: 'available' | 'busy' | 'offline') => {
    try {
      setUpdatingAvailability(true);
      console.log('🔄 Intentando actualizar disponibilidad a:', newAvailability);
      
      const response = await clientAPI.updateAvailability(newAvailability);
      console.log('✅ Respuesta del servidor:', response);
      
      // ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      setAvailability(newAvailability);
      console.log('🔄 Disponibilidad actualizada en estado local a:', newAvailability);
      
      // ✅ FORZAR RECARGA COMPLETA DE DATOS
      await loadWorkerData();
      
      Alert.alert('Éxito', `Disponibilidad actualizada a: ${getAvailabilityText(newAvailability)}`);
      
    } catch (error) {
      console.error('❌ Error actualizando disponibilidad:', error);
      console.error('❌ Detalles del error:', error.message);
      Alert.alert('Error', 'No se pudo actualizar la disponibilidad');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  // ✅ FUNCIONES FALTANTES AGREGADAS
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no especificada';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Hora no especificada';
    return timeString.substring(0, 5); // Formato HH:MM
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return '#28A745';
      case 'busy': return '#FFC107';
      case 'offline': return '#6C757D';
      default: return '#6C757D';
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'busy': return 'Ocupado';
      case 'offline': return 'No disponible';
      default: return 'No disponible';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return '#DC3545';
      case 'high': return '#FFC107';
      case 'medium': return '#17A2B8';
      case 'low': return '#28A745';
      default: return '#6C757D';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return '🚨 Emergencia';
      case 'high': return '🔴 Urgente';
      case 'medium': return '🟡 Medio';
      case 'low': return '🟢 Bajo';
      default: return 'No especificado';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header con información del trabajador */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>¡Hola, {user?.name}!</Text>
            <Text style={styles.professionText}>{user?.profession || 'Trabajador'}</Text>
            {user?.description && (
              <Text style={styles.descriptionText}>{user.description}</Text>
            )}
          </View>
          <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor(availability) }]}>
            {updatingAvailability ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.availabilityText}>
                {getAvailabilityText(availability)}
              </Text>
            )}
          </View>
        </View>

        {/* Estadísticas reales */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Mis Estadísticas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.upcomingAppointments}</Text>
              <Text style={styles.statLabel}>Programados</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>${stats.monthlyEarnings}</Text>
              <Text style={styles.statLabel}>Ganancias</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalCompleted}</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </View>
          </View>
        </View>

        {/* Estado de disponibilidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Disponibilidad</Text>
          <View style={styles.availabilityButtons}>
            <TouchableOpacity 
              style={[
                styles.availabilityBtn, 
                availability === 'available' && styles.availableActive
              ]}
              onPress={() => handleUpdateAvailability('available')}
              disabled={updatingAvailability}
            >
              {updatingAvailability && availability === 'available' ? (
                <ActivityIndicator size="small" color="#28A745" />
              ) : (
                <Text style={availability === 'available' ? styles.availabilityBtnTextActive : styles.availabilityBtnText}>
                  ✅ Disponible
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.availabilityBtn, 
                availability === 'busy' && styles.busyActive
              ]}
              onPress={() => handleUpdateAvailability('busy')}
              disabled={updatingAvailability}
            >
              {updatingAvailability && availability === 'busy' ? (
                <ActivityIndicator size="small" color="#FFC107" />
              ) : (
                <Text style={availability === 'busy' ? styles.availabilityBtnTextActive : styles.availabilityBtnText}>
                  🛑 Ocupado
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.availabilityBtn, 
                availability === 'offline' && styles.offlineActive
              ]}
              onPress={() => handleUpdateAvailability('offline')}
              disabled={updatingAvailability}
            >
              {updatingAvailability && availability === 'offline' ? (
                <ActivityIndicator size="small" color="#6C757D" />
              ) : (
                <Text style={availability === 'offline' ? styles.availabilityBtnTextActive : styles.availabilityBtnText}>
                  ⚫ No disponible
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {updatingAvailability && (
            <Text style={styles.updatingText}>Actualizando disponibilidad...</Text>
          )}
        </View>

        {/* Solicitudes pendientes REALES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Solicitudes Pendientes</Text>
            <Text style={styles.requestsCount}>({pendingRequests.length})</Text>
          </View>
          
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No hay solicitudes pendientes</Text>
              <Text style={styles.emptyStateSubtext}>Las nuevas solicitudes aparecerán aquí</Text>
            </View>
          ) : (
            pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestTitle}>{request.service_type}</Text>
                  <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(request.urgency) }]}>
                    <Text style={styles.urgencyText}>{getUrgencyText(request.urgency)}</Text>
                  </View>
                </View>
                
                <Text style={styles.requestClient}>👤 {request.client_name}</Text>
                <Text style={styles.requestInfo}>📞 {request.client_phone || 'Teléfono no especificado'}</Text>
                <Text style={styles.requestInfo}>📝 {request.description}</Text>
                
                {request.preferred_date && (
                  <Text style={styles.requestInfo}>
                    📅 {formatDate(request.preferred_date)} {request.preferred_time && `a las ${formatTime(request.preferred_time)}`}
                  </Text>
                )}
                
                <Text style={styles.requestTimestamp}>
                  📨 Recibido: {new Date(request.created_at).toLocaleDateString('es-ES')}
                </Text>
                
                <View style={styles.requestActions}>
                  <TouchableOpacity 
                    style={styles.acceptBtn}
                    onPress={() => showAcceptModal(request)}
                  >
                    <Text style={styles.acceptBtnText}>Aceptar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.rejectBtn}
                    onPress={() => showRejectModal(request)}
                  >
                    <Text style={styles.rejectBtnText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Turnos programados REALES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos Turnos</Text>
            <Text style={styles.requestsCount}>({upcomingAppointments.length})</Text>
          </View>
          
          {upcomingAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No hay turnos programados</Text>
              <Text style={styles.emptyStateSubtext}>Los turnos aceptados aparecerán aquí</Text>
            </View>
          ) : (
            upcomingAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestTitle}>{appointment.service_type}</Text>
                  <Text style={styles.appointmentStatus}>{appointment.status}</Text>
                </View>
                
                <Text style={styles.requestClient}>👤 {appointment.client_name}</Text>
                <Text style={styles.requestInfo}>📞 {appointment.contact_phone}</Text>
                <Text style={styles.requestInfo}>📅 {formatDate(appointment.scheduled_date)} a las {formatTime(appointment.scheduled_time)}</Text>
                
                {appointment.address && (
                  <Text style={styles.requestInfo}>📍 {appointment.address}</Text>
                )}
                
                {appointment.special_instructions && (
                  <Text style={styles.requestInfo}>💡 {appointment.special_instructions}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/worker/services')}
            >
              <Text style={styles.quickActionText}>📋 Mis Servicios</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/worker/availability')}
            >
              <Text style={styles.quickActionText}>🕒 Disponibilidad</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/worker/earnings')}
            >
              <Text style={styles.quickActionText}>💰 Ganancias</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/worker/profile')}
            >
              <Text style={styles.quickActionText}>👤 Mi Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ✅ MODAL MEJORADO PARA ACEPTAR CON PRESUPUESTO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBudgetModal}
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aceptar Solicitud</Text>
            
            {selectedRequest && (
              <View style={styles.requestPreview}>
                <Text style={styles.previewTitle}>{selectedRequest.service_type}</Text>
                <Text style={styles.previewClient}>Cliente: {selectedRequest.client_name}</Text>
                <Text style={styles.previewDescription}>{selectedRequest.description}</Text>
                
                {/* Indicador de tipo de solicitud */}
                <View style={styles.requestTypeBadge}>
                  <Text style={styles.requestTypeText}>
                    {selectedRequest.preferred_date ? '📅 Turno Agendado' : '🚨 Respuesta Inmediata'}
                  </Text>
                </View>
              </View>
            )}

            {/* Campo de presupuesto - solo mostrar para respuesta inmediata */}
            {selectedRequest && !selectedRequest.preferred_date && (
              <View style={styles.budgetSection}>
                <Text style={styles.budgetLabel}>Presupuesto Estimado (opcional)</Text>
                <View style={styles.budgetInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.budgetInput}
                    placeholder="0.00"
                    value={budgetAmount}
                    onChangeText={setBudgetAmount}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
                <Text style={styles.budgetHint}>
                  El cliente podrá aceptar o rechazar este presupuesto
                </Text>
              </View>
            )}

            <Text style={styles.modalMessage}>
              {selectedRequest?.preferred_date 
                ? '¿Aceptar este turno programado?'
                : '¿Aceptar esta solicitud de emergencia?'}
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowBudgetModal(false);
                  setBudgetAmount('');
                }}
                disabled={processingAction}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.acceptButton]}
                onPress={executeAcceptRequest}
                disabled={processingAction}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.acceptButtonText}>
                    {budgetAmount ? `Aceptar ($${budgetAmount})` : 'Aceptar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL PARA RECHAZAR SOLICITUD */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rejectModalVisible}
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rechazar Solicitud</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que quieres rechazar esta solicitud de servicio?
            </Text>
            {selectedRequest && (
              <View style={styles.requestPreview}>
                <Text style={styles.previewTitle}>{selectedRequest.service_type}</Text>
                <Text style={styles.previewClient}>Cliente: {selectedRequest.client_name}</Text>
                <Text style={styles.previewDescription}>{selectedRequest.description}</Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRejectModalVisible(false)}
                disabled={processingAction}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.rejectButton]}
                onPress={executeRejectRequest}
                disabled={processingAction}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.rejectButtonText}>Rechazar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  professionText: {
    fontSize: 16,
    color: '#28A745',
    marginTop: 4,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsSection: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28A745',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  requestsCount: {
    color: '#666',
    fontWeight: 'bold',
  },
  availabilityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  availabilityBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  availableActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#28A745',
  },
  busyActive: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFC107',
  },
  offlineActive: {
    backgroundColor: '#F8F9FA',
    borderColor: '#6C757D',
  },
  availabilityBtnText: {
    color: '#666',
    fontSize: 12,
  },
  availabilityBtnTextActive: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  updatingText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  appointmentCard: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  appointmentStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976D2',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestClient: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  requestInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  requestTimestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 6,
    marginRight: 5,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#DC3545',
    padding: 10,
    borderRadius: 6,
    marginLeft: 5,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    color: '#1976D2',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // ✅ ESTILOS NUEVOS PARA MODAL CON PRESUPUESTO
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  requestPreview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  previewClient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  previewDescription: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#6C757D',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: '#28A745',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#DC3545',
  },
  rejectButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // ✅ ESTILOS PARA SECCIÓN DE PRESUPUESTO
  budgetSection: {
    marginBottom: 15,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  currencySymbol: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  budgetHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  requestTypeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  requestTypeText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: 'bold',
  },
});