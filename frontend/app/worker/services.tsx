import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { clientAPI } from '../../src/services/clientApi';
import { Colors } from '../../constants/theme';

interface Service {
  id: number;
  service_type: string;
  client_name: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  total_cost: number;
  description: string;
  address: string;
  contact_phone: string;
  special_instructions: string;
  created_at: string;
}

export default function WorkerServicesScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'in-progress' | 'completed'>('upcoming');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para modales
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando servicios del trabajador...');
      
      const appointments = await clientAPI.getWorkerAppointments();
      setServices(appointments);

    } catch (error) {
      console.error('❌ Error cargando servicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los servicios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  // Filtrar servicios según el tab activo
  const filteredServices = services.filter(service => {
    switch (activeTab) {
      case 'upcoming':
        return ['pending', 'confirmed'].includes(service.status);
      case 'in-progress':
        return service.status === 'in_progress';
      case 'completed':
        return service.status === 'completed';
      default:
        return false;
    }
  });

  // ✅ FUNCIÓN PARA ACTUALIZAR PRECIO (AHORA GUARDA EN BD)
  const handleUpdatePrice = (service: Service) => {
    setSelectedService(service);
    setPriceInput(service.total_cost?.toString() || '');
    setShowPriceModal(true);
  };

  const updateServicePrice = async () => {
    if (!selectedService) return;
    
    try {
      setUpdatingPrice(true);
      const newPrice = priceInput ? parseFloat(priceInput) : 0;
      
      if (isNaN(newPrice) || newPrice < 0) {
        Alert.alert('Error', 'Por favor ingresa un precio válido');
        return;
      }

      console.log('💰 Actualizando precio:', {
        serviceId: selectedService.id,
        newPrice: newPrice,
        status: selectedService.status
      });

      // ✅ LLAMAR A LA API PARA GUARDAR EN BD
      await clientAPI.updateAppointmentPrice(selectedService.id, newPrice);
      
      // Actualizar estado local
      setServices(prev => 
        prev.map(service => 
          service.id === selectedService.id 
            ? { ...service, total_cost: newPrice }
            : service
        )
      );
      
      setShowPriceModal(false);
      setSelectedService(null);
      setPriceInput('');
      
      Alert.alert('Éxito', 'Precio guardado correctamente');
      
    } catch (error: any) {
      console.error('Error guardando precio:', error);
      Alert.alert('Error', 'No se pudo guardar el precio: ' + (error?.message || String(error)));
    } finally {
      setUpdatingPrice(false);
    }
  };

  // ✅ MODALES PARA ACCIONES
  const showStartServiceModal = (service: Service) => {
    setSelectedService(service);
    setShowStartModal(true);
  };

  const executeStartService = async () => {
    if (!selectedService) return;
    
    try {
      setProcessingAction(true);
      await clientAPI.updateAppointmentStatus(selectedService.id, 'in_progress');
      await loadServices();
      setShowStartModal(false);
      setSelectedService(null);
      Alert.alert('Éxito', 'Servicio iniciado correctamente');
    } catch (error) {
      console.error('Error iniciando servicio:', error);
      Alert.alert('Error', 'No se pudo iniciar el servicio');
    } finally {
      setProcessingAction(false);
    }
  };

  const showCompleteServiceModal = (service: Service) => {
    setSelectedService(service);
    setShowCompleteModal(true);
  };

  const executeCompleteService = async () => {
    if (!selectedService) return;
    
    try {
      setProcessingAction(true);
      await clientAPI.updateAppointmentStatus(selectedService.id, 'completed');
      await loadServices();
      setShowCompleteModal(false);
      setSelectedService(null);
      Alert.alert('Éxito', 'Servicio completado correctamente');
    } catch (error) {
      console.error('Error completando servicio:', error);
      Alert.alert('Error', 'No se pudo completar el servicio');
    } finally {
      setProcessingAction(false);
    }
  };

  const showMoveToProgressModal = (service: Service) => {
    setSelectedService(service);
    setShowMoveModal(true);
  };

  const executeMoveToProgress = async () => {
    if (!selectedService) return;
    
    try {
      setProcessingAction(true);
      await clientAPI.updateAppointmentStatus(selectedService.id, 'in_progress');
      await loadServices();
      setShowMoveModal(false);
      setSelectedService(null);
      Alert.alert('Éxito', 'Servicio movido a En Progreso');
    } catch (error) {
      console.error('Error moviendo servicio:', error);
      Alert.alert('Error', 'No se pudo mover el servicio');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleMoveBackToPending = async (serviceId: number) => {
    try {
      await clientAPI.updateAppointmentStatus(serviceId, 'confirmed');
      await loadServices();
      Alert.alert('Éxito', 'Servicio movido a Pendiente');
    } catch (error) {
      console.error('Error moviendo servicio:', error);
      Alert.alert('Error', 'No se pudo mover el servicio');
    }
  };

  // Funciones de utilidad existentes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.calPolyGreen;
      case 'in_progress': return Colors.sandyBrown;
      case 'confirmed': return Colors.celestialBlue;
      case 'pending': return Colors.gunmetal;
      case 'cancelled': return Colors.light.error;
      default: return '#6C757D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Progreso';
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no especificada';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Hora no especificada';
    return timeString.substring(0, 5);
  };

  const handleRescheduleService = (serviceId: number) => {
    Alert.alert(
      'Reprogramar',
      'Esta función estará disponible pronto',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.calPolyGreen} />
        <Text style={styles.loadingText}>Cargando servicios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Próximos ({services.filter(s => ['pending', 'confirmed'].includes(s.status)).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'in-progress' && styles.tabActive]}
          onPress={() => setActiveTab('in-progress')}
        >
          <Text style={[styles.tabText, activeTab === 'in-progress' && styles.tabTextActive]}>
            En Progreso ({services.filter(s => s.status === 'in_progress').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completados ({services.filter(s => s.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de servicios */}
      <ScrollView 
        style={styles.servicesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No hay servicios {activeTab === 'upcoming' ? 'próximos' : activeTab === 'in-progress' ? 'en progreso' : 'completados'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'upcoming' 
                ? 'Los nuevos servicios aparecerán aquí cuando sean asignados' 
                : activeTab === 'in-progress'
                ? 'Los servicios en curso aparecerán aquí'
                : 'Los servicios completados aparecerán aquí'
              }
            </Text>
          </View>
        ) : (
          filteredServices.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceTitle}>{service.service_type}</Text>
                <TouchableOpacity onPress={() => handleUpdatePrice(service)}>
                    <Text style={styles.servicePrice}>
                      ${service.total_cost || '0'} ✏️
                    </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.serviceClient}>👤 {service.client_name}</Text>
              <Text style={styles.serviceInfo}>📞 {service.contact_phone || 'Teléfono no especificado'}</Text>
              
              {service.scheduled_date && (
                <Text style={styles.serviceInfo}>
                  📅 {formatDate(service.scheduled_date)} {service.scheduled_time && `a las ${formatTime(service.scheduled_time)}`}
                </Text>
              )}
              
              {service.address && (
                <Text style={styles.serviceInfo}>📍 {service.address}</Text>
              )}
              
              {service.description && (
                <Text style={styles.serviceInfo}>📝 {service.description}</Text>
              )}
              
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(service.status) }]}>
                <Text style={styles.statusText}>{getStatusText(service.status)}</Text>
              </View>
              
              {/* ✅ ACCIONES MEJORADAS SEGÚN EL ESTADO */}
              
              {/* PRÓXIMOS - Confirmado */}
              {activeTab === 'upcoming' && service.status === 'confirmed' && (
                <View style={styles.serviceActions}>
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => showStartServiceModal(service)}
                  >
                    <Text style={styles.startButtonText}>Comenzar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.moveButton}
                    onPress={() => showMoveToProgressModal(service)}
                  >
                    <Text style={styles.moveButtonText}>Mover a Progreso</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* EN PROGRESO */}
              {activeTab === 'in-progress' && (
                <View style={styles.serviceActions}>
                  <TouchableOpacity 
                    style={styles.completeButton}
                    onPress={() => showCompleteServiceModal(service)}
                  >
                    <Text style={styles.completeButtonText}>
                      Completar
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => handleMoveBackToPending(service.id)}
                  >
                    <Text style={styles.backButtonText}>Volver a Pendiente</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* COMPLETADOS - Mostrar precio final */}
              {activeTab === 'completed' && (
                <View style={styles.completedSection}>
                  <Text style={styles.finalPriceText}>
                    💰 Precio final: ${service.total_cost || '0'}
                  </Text>
                  {service.total_cost === 0 && (
                    <TouchableOpacity 
                      style={styles.addPriceButton}
                      onPress={() => handleUpdatePrice(service)}
                    >
                      <Text style={styles.addPriceButtonText}>Agregar precio</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* ✅ MODAL PARA EDITAR PRECIO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPriceModal}
        onRequestClose={() => setShowPriceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedService?.status === 'completed' ? 'Registrar Precio Final' : 'Establecer Precio'}
            </Text>
            
            {selectedService && (
              <View style={styles.modalServiceInfo}>
                <Text style={styles.serviceName}>{selectedService.service_type}</Text>
                <Text style={styles.clientName}>Cliente: {selectedService.client_name}</Text>
                <Text style={styles.serviceStatus}>Estado: {getStatusText(selectedService.status)}</Text>
              </View>
            )}
            
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceLabel}>
                {selectedService?.status === 'completed' ? 'Precio final cobrado' : 'Precio estimado'}
              </Text>
              <View style={styles.inputWithSymbol}>
                <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  value={priceInput}
                  onChangeText={setPriceInput}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.gunmetal}
                />
              </View>
              <Text style={styles.priceHint}>
                {selectedService?.status === 'completed' 
                  ? 'Ingresa el monto final que cobraste por este servicio'
                  : 'Establece un precio estimado para el cliente'
                }
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPriceModal(false);
                  setPriceInput('');
                }}
                disabled={updatingPrice}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={updateServicePrice}
                disabled={updatingPrice}
              >
                {updatingPrice ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL PARA COMPLETAR SERVICIO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCompleteModal}
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Completar Servicio</Text>
            
            {selectedService && (
              <View style={styles.modalServiceInfo}>
                <Text style={styles.serviceName}>{selectedService.service_type}</Text>
                <Text style={styles.clientName}>Cliente: {selectedService.client_name}</Text>
                <Text style={styles.servicePriceDisplay}>
                  Precio actual: ${selectedService.total_cost || '0'}
                </Text>
              </View>
            )}

            <Text style={styles.modalMessage}>
              {selectedService?.total_cost && selectedService.total_cost > 0 
                ? `¿Marcar este servicio como completado?\nPrecio final: $${selectedService?.total_cost}`
                : '⚠️ No has establecido un precio para este servicio. ¿Quieres completarlo sin precio?'
              }
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCompleteModal(false);
                  setSelectedService(null);
                }}
                disabled={processingAction}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => {
                  setShowCompleteModal(false);
                  if (selectedService) {
                    handleUpdatePrice(selectedService);
                  }
                }}
                disabled={processingAction}
              >
                <Text style={styles.secondaryButtonText}>Establecer Precio</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.completeButton]}
                onPress={executeCompleteService}
                disabled={processingAction}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.completeButtonText}>
                    {selectedService?.total_cost && selectedService.total_cost > 0 ? 'Completar' : 'Completar sin precio'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL PARA COMENZAR SERVICIO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showStartModal}
        onRequestClose={() => setShowStartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Comenzar Servicio</Text>
            
            {selectedService && (
              <View style={styles.modalServiceInfo}>
                <Text style={styles.serviceName}>{selectedService.service_type}</Text>
                <Text style={styles.clientName}>Cliente: {selectedService.client_name}</Text>
              </View>
            )}

            <Text style={styles.modalMessage}>
              ¿Quieres comenzar este servicio ahora?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowStartModal(false);
                  setSelectedService(null);
                }}
                disabled={processingAction}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.startButton]}
                onPress={executeStartService}
                disabled={processingAction}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.startButtonText}>Comenzar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL PARA MOVER A PROGRESO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMoveModal}
        onRequestClose={() => setShowMoveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mover a En Progreso</Text>
            
            {selectedService && (
              <View style={styles.modalServiceInfo}>
                <Text style={styles.serviceName}>{selectedService.service_type}</Text>
                <Text style={styles.clientName}>Cliente: {selectedService.client_name}</Text>
              </View>
            )}

            <Text style={styles.modalMessage}>
              ¿Mover este servicio a "En Progreso"?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowMoveModal(false);
                  setSelectedService(null);
                }}
                disabled={processingAction}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.moveButton]}
                onPress={executeMoveToProgress}
                disabled={processingAction}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.moveButtonText}>Mover a Progreso</Text>
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
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.gunmetal,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 5,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: Colors.calPolyGreen,
  },
  tabText: {
    color: Colors.gunmetal,
    fontWeight: '500',
    fontSize: 12,
  },
  tabTextActive: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  servicesList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gunmetal,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: `${Colors.gunmetal}80`,
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: Colors.white,
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.calPolyGreen,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gunmetal,
    flex: 1,
    marginRight: 10,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.calPolyGreen,
  },
  serviceClient: {
    fontSize: 14,
    color: Colors.gunmetal,
    marginBottom: 4,
  },
  serviceInfo: {
    fontSize: 12,
    color: Colors.gunmetal,
    marginBottom: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  startButton: {
    flex: 1,
    backgroundColor: Colors.calPolyGreen,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  moveButton: {
    flex: 1,
    backgroundColor: Colors.sandyBrown,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  moveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  completeButton: {
    flex: 1,
    backgroundColor: Colors.calPolyGreen,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.gunmetal,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: '#6C757D',
    padding: 10,
    borderRadius: 6,
    marginLeft: 5,
    alignItems: 'center',
  },
  rescheduleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // ✅ NUEVOS ESTILOS
  completedSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: `${Colors.gunmetal}20`,
    alignItems: 'center',
  },
  finalPriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.calPolyGreen,
    marginBottom: 8,
  },
  addPriceButton: {
    backgroundColor: Colors.celestialBlue,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addPriceButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // Estilos para los modales
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.gunmetal,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.gunmetal,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalServiceInfo: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gunmetal,
    marginBottom: 5,
  },
  clientName: {
    fontSize: 14,
    color: Colors.gunmetal,
    marginBottom: 3,
  },
  serviceStatus: {
    fontSize: 12,
    color: `${Colors.gunmetal}80`,
    fontStyle: 'italic',
  },
  servicePriceDisplay: {
    fontSize: 14,
    color: Colors.calPolyGreen,
    fontWeight: 'bold',
  },
  priceInputContainer: {
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inputWithSymbol: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${Colors.gunmetal}20`,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  currencySymbol: {
    fontSize: 16,
    color: Colors.gunmetal,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.gunmetal,
  },
  priceHint: {
    fontSize: 12,
    color: Colors.gunmetal,
    marginTop: 5,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gunmetal,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: Colors.calPolyGreen,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: Colors.celestialBlue,
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});