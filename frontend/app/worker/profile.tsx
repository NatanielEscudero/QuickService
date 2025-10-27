import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity 
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function WorkerProfileScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      {/* Información del perfil */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.profession}>{user?.profession}</Text>
        
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ 4.8</Text>
          <Text style={styles.ratingCount}>(24 evaluaciones)</Text>
        </View>
      </View>

      {/* Información de contacto */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de Contacto</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Teléfono</Text>
          <Text style={styles.infoValue}>{user?.phone || 'No especificado'}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Profesión</Text>
          <Text style={styles.infoValue}>{user?.profession || 'No especificada'}</Text>
        </View>
      </View>

      {/* Estadísticas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>Servicios completados</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>92%</Text>
            <Text style={styles.statLabel}>Tasa de éxito</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>15 min</Text>
            <Text style={styles.statLabel}>Respuesta promedio</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Rating promedio</Text>
          </View>
        </View>
      </View>

      {/* Certificaciones (placeholder) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certificaciones</Text>
        <View style={styles.emptyCertifications}>
          <Text style={styles.emptyText}>No hay certificaciones agregadas</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Agregar Certificación</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Zona de trabajo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zona de Trabajo</Text>
        <Text style={styles.workZoneText}>Radio de 15km desde tu ubicación actual</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#28A745',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profession: {
    fontSize: 16,
    color: '#28A745',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  ratingCount: {
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
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
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
    textAlign: 'center',
  },
  emptyCertifications: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  workZoneText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});