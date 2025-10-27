import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';

export default function ClientHomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>¡Hola, {user?.name}!</Text>
        <Text style={styles.subtitle}>¿En qué te podemos ayudar hoy?</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Servicio Rápido</Text>
        
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionText}>Emergencia Inmediata</Text>
          <Text style={styles.quickActionSubtext}>Encuentra ayuda ahora</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Servicios Disponibles</Text>
        
        {['Plomería', 'Electricidad', 'Carpintería', 'Pintura', 'Jardinería'].map((service) => (
          <TouchableOpacity key={service} style={styles.serviceCard}>
            <Text style={styles.serviceTitle}>{service}</Text>
            <Text style={styles.serviceDesc}>Ver profesionales disponibles</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Turnos Programados</Text>
        
        <TouchableOpacity style={styles.scheduleCard}>
          <Text style={styles.scheduleText}>Programar nuevo turno</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => router.push('/client/profile')}
      >
        <Text style={styles.profileButtonText}>Ver Mi Perfil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  welcomeText: {
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
    marginVertical: 5,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  quickAction: {
    backgroundColor: '#FF3B30',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickActionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  quickActionSubtext: {
    color: 'white',
    marginTop: 5,
    opacity: 0.9,
  },
  serviceCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceDesc: {
    color: '#666',
    marginTop: 5,
  },
  scheduleCard: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  scheduleText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  profileButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});