import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity 
} from 'react-native';

interface Service {
  id: number;
  title: string;
  client: string;
  date: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  price: string;
}

export default function WorkerServicesScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'in-progress' | 'completed'>('upcoming');
  
  const services: Service[] = [
    {
      id: 1,
      title: 'Reparación de tubería',
      client: 'Ana Martínez',
      date: 'Hoy, 14:00',
      status: 'upcoming',
      price: '$60.00'
    },
    {
      id: 2,
      title: 'Instalación de lavamanos',
      client: 'Roberto Sánchez',
      date: 'Mañana, 10:00',
      status: 'upcoming',
      price: '$85.00'
    },
    {
      id: 3,
      title: 'Revisión eléctrica',
      client: 'Laura Díaz',
      date: 'En progreso',
      status: 'in-progress',
      price: '$45.00'
    },
    {
      id: 4,
      title: 'Cambio de llaves de paso',
      client: 'Carlos Mendoza',
      date: '15 Oct 2023',
      status: 'completed',
      price: '$75.00'
    }
  ];

  const filteredServices = services.filter(service => service.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28A745';
      case 'in-progress': return '#FFC107';
      case 'upcoming': return '#17A2B8';
      default: return '#6C757D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in-progress': return 'En Progreso';
      case 'upcoming': return 'Próximo';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Próximos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'in-progress' && styles.tabActive]}
          onPress={() => setActiveTab('in-progress')}
        >
          <Text style={[styles.tabText, activeTab === 'in-progress' && styles.tabTextActive]}>
            En Progreso
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completados
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de servicios */}
      <ScrollView style={styles.servicesList}>
        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay servicios {activeTab}</Text>
          </View>
        ) : (
          filteredServices.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.servicePrice}>{service.price}</Text>
              </View>
              
              <Text style={styles.serviceClient}>Cliente: {service.client}</Text>
              <Text style={styles.serviceDate}>📅 {service.date}</Text>
              
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(service.status) }]}>
                <Text style={styles.statusText}>{getStatusText(service.status)}</Text>
              </View>
              
              {activeTab === 'upcoming' && (
                <View style={styles.serviceActions}>
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.startButtonText}>Comenzar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.rescheduleButton}>
                    <Text style={styles.rescheduleButtonText}>Reprogramar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#28A745',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: 'bold',
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
    color: '#666',
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
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
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28A745',
  },
  serviceClient: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  serviceDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  },
  startButton: {
    flex: 1,
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 6,
    marginRight: 5,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
});