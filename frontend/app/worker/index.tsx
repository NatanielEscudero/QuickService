import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert 
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';

interface ServiceRequest {
  id: number;
  title: string;
  clientName: string;
  distance: string;
  type: 'scheduled' | 'immediate';
  price: string;
  timestamp: string;
}

export default function WorkerHomeScreen() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<'available' | 'busy' | 'offline'>('available');
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>([
    {
      id: 1,
      title: 'Fuga de agua en baño',
      clientName: 'María González',
      distance: '1.2 km',
      type: 'immediate',
      price: '$45.00',
      timestamp: 'Hace 5 min'
    },
    {
      id: 2,
      title: 'Instalación de tomacorrientes',
      clientName: 'Carlos Rodríguez',
      distance: '2.5 km',
      type: 'scheduled',
      price: '$80.00',
      timestamp: 'Mañana 10:00 AM'
    }
  ]);

  const handleAcceptRequest = (requestId: number) => {
    Alert.alert(
      'Aceptar Servicio',
      '¿Estás seguro de que puedes atender este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Aceptar', 
          onPress: () => {
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));
            Alert.alert('Éxito', 'Servicio aceptado correctamente');
          }
        }
      ]
    );
  };

  const handleRejectRequest = (requestId: number) => {
    Alert.alert(
      'Rechazar Servicio',
      '¿Estás seguro de que quieres rechazar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Rechazar', 
          style: 'destructive',
          onPress: () => {
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));
            Alert.alert('Servicio rechazado');
          }
        }
      ]
    );
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

  return (
    <ScrollView style={styles.container}>
      {/* Header con información del trabajador */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>¡Hola, {user?.name}!</Text>
          <Text style={styles.professionText}>{user?.profession || 'Trabajador'}</Text>
        </View>
        <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor(availability) }]}>
          <Text style={styles.availabilityText}>
            {getAvailabilityText(availability)}
          </Text>
        </View>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Mis Estadísticas</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Servicios</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>$1,240</Text>
            <Text style={styles.statLabel}>Ganancias</Text>
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
            onPress={() => setAvailability('available')}
          >
            <Text style={availability === 'available' ? styles.availabilityBtnTextActive : styles.availabilityBtnText}>
              ✅ Disponible
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.availabilityBtn, 
              availability === 'busy' && styles.busyActive
            ]}
            onPress={() => setAvailability('busy')}
          >
            <Text style={availability === 'busy' ? styles.availabilityBtnTextActive : styles.availabilityBtnText}>
              🛑 Ocupado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.availabilityBtn, 
              availability === 'offline' && styles.offlineActive
            ]}
            onPress={() => setAvailability('offline')}
          >
            <Text style={availability === 'offline' ? styles.availabilityBtnTextActive : styles.availabilityBtnText}>
              ⚫ No disponible
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Solicitudes pendientes */}
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
                <Text style={styles.requestTitle}>{request.title}</Text>
                <Text style={styles.requestPrice}>{request.price}</Text>
              </View>
              
              <Text style={styles.requestClient}>Cliente: {request.clientName}</Text>
              <Text style={styles.requestInfo}>📍 {request.distance} de distancia</Text>
              <Text style={styles.requestInfo}>
                {request.type === 'immediate' ? '🚀 Servicio inmediato' : '📅 ' + request.timestamp}
              </Text>
              
              <View style={styles.requestActions}>
                <TouchableOpacity 
                  style={styles.acceptBtn}
                  onPress={() => handleAcceptRequest(request.id)}
                >
                  <Text style={styles.acceptBtnText}>Aceptar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.rejectBtn}
                  onPress={() => handleRejectRequest(request.id)}
                >
                  <Text style={styles.rejectBtnText}>Rechazar</Text>
                </TouchableOpacity>
              </View>
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
            onPress={() => router.push('./worker/services')}
          >
            <Text style={styles.quickActionText}>📋 Mis Servicios</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('./worker/availability')}
          >
            <Text style={styles.quickActionText}>🕒 Disponibilidad</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('./worker/earnings')}
          >
            <Text style={styles.quickActionText}>💰 Ganancias</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('./worker/profile')}
          >
            <Text style={styles.quickActionText}>👤 Mi Perfil</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
    fontSize: 24,
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
  requestPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28A745',
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
});