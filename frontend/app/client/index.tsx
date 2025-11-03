import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { router } from 'expo-router';
import { Colors } from '../../constants/theme';


export default function ClientHomeScreen() {
  const { user } = useAuth();
  
  const handleEmergency = () => {
    router.push('/client/emergency');
  };

  const handleServicePress = (service: string) => {
    router.push(`/client/services/${service.toLowerCase()}`);
  };

  const handleSchedule = () => {
    router.push('/client/schedule');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>¡Hola, {user?.name}!</Text>
        <Text style={styles.subtitle}>¿En qué te podemos ayudar hoy?</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Servicio Rápido</Text>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={handleEmergency} // ✅ AGREGADO
        >
          <Text style={styles.quickActionText}>Emergencia Inmediata</Text>
          <Text style={styles.quickActionSubtext}>Encuentra ayuda ahora</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Servicios Disponibles</Text>
        
        {['Plomería', 'Electricidad', 'Carpintería', 'Pintura', 'Jardinería'].map((service) => (
          <TouchableOpacity 
            key={service} 
            style={styles.serviceCard}
            onPress={() => handleServicePress(service)} // ✅ AGREGADO
          >
            <Text style={styles.serviceTitle}>{service}</Text>
            <Text style={styles.serviceDesc}>Ver profesionales disponibles</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Turnos Programados</Text>
        
        <TouchableOpacity 
          style={styles.scheduleCard}
          onPress={handleSchedule} // ✅ AGREGADO
        >
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
    backgroundColor: Colors.lightGreen,
  },
  welcomeSection: {
    backgroundColor: Colors.gunmetal,
    padding: 20,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightGreen,
    marginTop: 5,
  },
  section: {
    backgroundColor: Colors.lightGreen,
    marginVertical: 5,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.calPolyGreen,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.gunmetal,
  },
  quickAction: {
    backgroundColor: Colors.sandyBrown,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: Colors.gunmetal,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    color: Colors.gunmetal,
    fontWeight: 'bold',
    fontSize: 18,
  },
  quickActionSubtext: {
    color: Colors.gunmetal,
    marginTop: 5,
    opacity: 0.9,
  },
  serviceCard: {
    backgroundColor: `${Colors.celestialBlue}20`,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.celestialBlue,
    borderWidth: 1,
    borderColor: Colors.celestialBlue,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gunmetal,
  },
  serviceDesc: {
    color: Colors.gunmetal,
    marginTop: 5,
    fontSize: 14,
    opacity: 0.8,
  },
  scheduleCard: {
    backgroundColor: Colors.lightGreen,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.calPolyGreen,
    borderStyle: 'dashed',
  },
  scheduleText: {
    color: Colors.calPolyGreen,
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileButton: {
    backgroundColor: Colors.celestialBlue,
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: Colors.gunmetal,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});