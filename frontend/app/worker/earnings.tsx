import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity 
} from 'react-native';

interface Earning {
  id: number;
  date: string;
  service: string;
  client: string;
  amount: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export default function WorkerEarningsScreen() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  
  const earnings: Earning[] = [
    {
      id: 1,
      date: '15 Oct 2023',
      service: 'Reparación de tubería',
      client: 'Ana Martínez',
      amount: '$60.00',
      status: 'completed'
    },
    {
      id: 2,
      date: '14 Oct 2023',
      service: 'Instalación de lavamanos',
      client: 'Roberto Sánchez',
      amount: '$85.00',
      status: 'completed'
    },
    {
      id: 3,
      date: '13 Oct 2023',
      service: 'Revisión eléctrica',
      client: 'Laura Díaz',
      amount: '$45.00',
      status: 'pending'
    },
    {
      id: 4,
      date: '12 Oct 2023',
      service: 'Cambio de llaves de paso',
      client: 'Carlos Mendoza',
      amount: '$75.00',
      status: 'completed'
    }
  ];

  const totalEarnings = earnings
    .filter(earning => earning.status === 'completed')
    .reduce((sum, earning) => sum + parseFloat(earning.amount.replace('$', '')), 0);

  const pendingEarnings = earnings
    .filter(earning => earning.status === 'pending')
    .reduce((sum, earning) => sum + parseFloat(earning.amount.replace('$', '')), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28A745';
      case 'pending': return '#FFC107';
      case 'cancelled': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Resumen de ganancias */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Resumen de Ganancias</Text>
        
        <View style={styles.timeRangeSelector}>
          <TouchableOpacity 
            style={[styles.timeRangeBtn, timeRange === 'week' && styles.timeRangeActive]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'week' && styles.timeRangeTextActive]}>
              Semana
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.timeRangeBtn, timeRange === 'month' && styles.timeRangeActive]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'month' && styles.timeRangeTextActive]}>
              Mes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.timeRangeBtn, timeRange === 'year' && styles.timeRangeActive]}
            onPress={() => setTimeRange('year')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'year' && styles.timeRangeTextActive]}>
              Año
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.earningsCards}>
          <View style={styles.earningCard}>
            <Text style={styles.earningAmount}>${totalEarnings.toFixed(2)}</Text>
            <Text style={styles.earningLabel}>Ganado</Text>
          </View>
          
          <View style={styles.earningCard}>
            <Text style={[styles.earningAmount, { color: '#FFC107' }]}>
              ${pendingEarnings.toFixed(2)}
            </Text>
            <Text style={styles.earningLabel}>Pendiente</Text>
          </View>
        </View>
      </View>

      {/* Historial de transacciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de Transacciones</Text>
        
        {earnings.map((earning) => (
          <View key={earning.id} style={styles.transactionCard}>
            <View style={styles.transactionInfo}>
              <Text style={styles.serviceName}>{earning.service}</Text>
              <Text style={styles.clientName}>{earning.client}</Text>
              <Text style={styles.transactionDate}>{earning.date}</Text>
            </View>
            
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionAmount}>{earning.amount}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(earning.status) }]}>
                <Text style={styles.statusText}>{getStatusText(earning.status)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Métodos de pago */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Métodos de Pago</Text>
        
        <View style={styles.paymentMethod}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentType}>💳 Tarjeta Bancaria</Text>
            <Text style={styles.paymentDetails}>**** **** **** 1234</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.addPaymentButton}>
          <Text style={styles.addPaymentText}>+ Agregar método de pago</Text>
        </TouchableOpacity>
      </View>

      {/* Próximo pago */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximo Pago</Text>
        <View style={styles.nextPaymentCard}>
          <Text style={styles.nextPaymentAmount}>${pendingEarnings.toFixed(2)}</Text>
          <Text style={styles.nextPaymentDate}>Programado para: 25 Oct 2023</Text>
          <Text style={styles.nextPaymentNote}>
            Los pagos se procesan automáticamente cada 15 días
          </Text>
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
  summarySection: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  timeRangeBtn: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeRangeActive: {
    backgroundColor: '#28A745',
  },
  timeRangeText: {
    color: '#666',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  earningsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  earningCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  earningAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 5,
  },
  earningLabel: {
    fontSize: 14,
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
    marginBottom: 15,
    color: '#333',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionDetails: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentDetails: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#6C757D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addPaymentButton: {
    borderWidth: 2,
    borderColor: '#28A745',
    borderStyle: 'dashed',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addPaymentText: {
    color: '#28A745',
    fontWeight: 'bold',
  },
  nextPaymentCard: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextPaymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 8,
  },
  nextPaymentDate: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  nextPaymentNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});