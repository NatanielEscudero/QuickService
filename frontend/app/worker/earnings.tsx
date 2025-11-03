import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { clientAPI } from '../../src/services/clientApi';

interface Earning {
  id: number;
  date: string;
  service_type: string;
  client_name: string;
  total_cost: number | string;
  status: 'completed' | 'pending' | 'cancelled' | 'in_progress' | 'confirmed';
  scheduled_date?: string;
  created_at?: string;
}

interface EarningsData {
  total_earnings: number | string;
  pending_earnings: number | string;
  transactions: Earning[];
}

export default function WorkerEarningsScreen() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [earningsData, setEarningsData] = useState<EarningsData>({
    total_earnings: 0,
    pending_earnings: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEarningsData();
  }, [timeRange]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando ganancias para rango:', timeRange);
      
      // Cargar ganancias del trabajador
      const earningsResponse = await clientAPI.getWorkerEarnings(timeRange);
      console.log('✅ Ganancias cargadas:', earningsResponse);
      
      // Procesar datos para asegurar que sean números
      const processedEarnings = {
        ...earningsResponse,
        total_earnings: parseFloat(earningsResponse.total_earnings as string) || 0,
        pending_earnings: parseFloat(earningsResponse.pending_earnings as string) || 0,
        transactions: earningsResponse.transactions.map((t: Earning) => ({
          ...t,
          total_cost: parseFloat(t.total_cost as string) || 0
        }))
      };
      
      setEarningsData(processedEarnings);

    } catch (error) {
      console.error('❌ Error cargando ganancias:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de ganancias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEarningsData();
  };

  const formatCurrency = (amount: number | string) => {
    // Convertir a número si viene como string y manejar valores inválidos
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Verificar si es un número válido
    if (isNaN(numericAmount) || !isFinite(numericAmount)) {
      return '$0.00';
    }
    
    return `$${numericAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no especificada';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28A745';
      case 'pending': return '#FFC107';
      case 'cancelled': return '#DC3545';
      case 'in_progress': return '#17A2B8';
      case 'confirmed': return '#6C757D';
      default: return '#6C757D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      case 'in_progress': return 'En Progreso';
      case 'confirmed': return 'Confirmado';
      default: return status;
    }
  };

  const getTimeRangeDisplay = () => {
    switch (timeRange) {
      case 'week': return 'esta semana';
      case 'month': return 'este mes';
      case 'year': return 'este año';
      default: return '';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.loadingText}>Cargando ganancias...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
            <Text style={styles.earningAmount}>
              {formatCurrency(earningsData.total_earnings)}
            </Text>
            <Text style={styles.earningLabel}>Ganado {getTimeRangeDisplay()}</Text>
          </View>
          
          <View style={styles.earningCard}>
            <Text style={[styles.earningAmount, { color: '#FFC107' }]}>
              {formatCurrency(earningsData.pending_earnings)}
            </Text>
            <Text style={styles.earningLabel}>Pendiente</Text>
          </View>
        </View>
      </View>

      {/* Historial de transacciones */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de Transacciones</Text>
          <Text style={styles.transactionsCount}>
            ({earningsData.transactions.length})
          </Text>
        </View>
        
        {earningsData.transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay transacciones {getTimeRangeDisplay()}</Text>
            <Text style={styles.emptyStateSubtext}>
              Las ganancias de tus servicios aparecerán aquí
            </Text>
          </View>
        ) : (
          earningsData.transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionInfo}>
                <Text style={styles.serviceName}>{transaction.service_type}</Text>
                <Text style={styles.clientName}>{transaction.client_name}</Text>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.scheduled_date || transaction.date)}
                </Text>
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionAmount}>
                  {formatCurrency(transaction.total_cost)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(transaction.status)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Próximo pago */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximo Pago</Text>
        <View style={styles.nextPaymentCard}>
          <Text style={styles.nextPaymentAmount}>
            {formatCurrency(earningsData.pending_earnings)}
          </Text>
          <Text style={styles.nextPaymentDate}>
            Pendiente de procesamiento
          </Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionsCount: {
    color: '#666',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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