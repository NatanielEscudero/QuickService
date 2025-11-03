import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { clientAPI } from '../../src/services/clientApi';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  description: string;
  avatar_url?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, logout, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    description: ''
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  useEffect(() => {
    console.log('🎯 Client ProfileScreen - Estado actual:', {
      user: user,
      isAuthenticated: isAuthenticated,
      loading: loading
    });
    
    loadUserProfile();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para cambiar la foto de perfil.');
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      if (!user || !isAuthenticated) {
        console.log('❌ No hay usuario autenticado, redirigiendo...');
        router.replace('/auth/login');
        return;
      }

      console.log('✅ Cargando perfil para cliente:', user);
      
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        description: user.description || '',
        avatar_url: user.avatar_url || ''
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para seleccionar imagen de la galería
  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para tomar foto con la cámara
  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara para tomar fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // FUNCIÓN CORREGIDA: Subir avatar REAL al servidor
  const uploadAvatar = async (imageUri: string) => {
    try {
      setUploadingAvatar(true);
      
      console.log('📤 Subiendo avatar al servidor...', imageUri);

      const formData = new FormData();
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('avatar', blob, 'avatar.jpg');

      const token = await AsyncStorage.getItem('userToken');
      
      console.log('🔄 Enviando solicitud al servidor...');

      const uploadResponse = await fetch('http://localhost:3001/api/users/avatar', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📨 Respuesta del servidor:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Error del servidor:', errorText);
        throw new Error(`Error ${uploadResponse.status}: No se pudo subir la imagen`);
      }

      const data = await uploadResponse.json();
      
      console.log('✅ Avatar subido correctamente:', data);

      setProfile(prev => ({
        ...prev,
        avatar_url: data.avatar_url
      }));

      if (user && data.user) {
        await updateUser(data.user);
      }

      Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');

    } catch (error: any) {
      console.error('❌ Error subiendo avatar:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar la foto de perfil');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  // FUNCIÓN CORREGIDA: Mejor manejo de errores
  const saveProfile = async () => {
    if (!editingField) return;

    try {
      setSaving(true);
      
      // Enviar SOLO el campo que se está editando
      const updateData = {
        [editingField]: editValue.trim()
      };

      console.log('📤 Enviando datos al backend:', updateData);
      console.log('🔑 Usuario actual:', user?.id);

      // Validación solo para nombre
      if (editingField === 'name' && !editValue.trim()) {
        Alert.alert('Error', 'El nombre no puede estar vacío');
        setSaving(false);
        return;
      }

      const response = await clientAPI.updateUserProfile(updateData);
      
      console.log('✅ Respuesta del backend:', response);

      if (response.user) {
        await updateUser(response.user);
        setProfile(prev => ({
          ...prev,
          [editingField]: editValue.trim()
        }));
      }

      setEditingField(null);
      setEditValue('');
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      
    } catch (error: any) {
      console.error('❌ Error guardando perfil:', error);
      console.error('❌ Stack trace:', error.stack);
      Alert.alert('Error', 'No se pudo actualizar el perfil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutConfirm = async () => {
    try {
      setLogoutLoading(true);
      console.log('🚪 Confirmado - ejecutando logout...');
      
      await logout();
      
      console.log('✅ Logout completado exitosamente');
      setShowLogoutModal(false);
      router.replace('/auth/login');
      
    } catch (error: any) {
      console.error('❌ Error durante logout:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión');
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    console.log('❌ Logout cancelado por el usuario');
    setShowLogoutModal(false);
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      description: 'Descripción'
    };
    return labels[field] || field;
  };

  const getFieldPlaceholder = (field: string) => {
    const placeholders: { [key: string]: string } = {
      name: 'Ingresa tu nombre completo',
      email: 'Ingresa tu email',
      phone: 'Ingresa tu teléfono',
      description: 'Cuéntanos sobre ti...'
    };
    return placeholders[field] || '';
  };

  if (!user || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Información del perfil */}
      <View style={styles.profileSection}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => setShowAvatarOptions(true)}
          disabled={uploadingAvatar}
        >
          {profile.avatar_url ? (
            <Image 
              source={{ uri: profile.avatar_url }} 
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          
          {uploadingAvatar && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator size="small" color="white" />
            </View>
          )}
          
          <View style={styles.avatarEditBadge}>
            <Text style={styles.avatarEditText}>✏️</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{profile.name || 'Sin nombre'}</Text>
        </View>
        
        <View style={styles.emailContainer}>
          <Text style={styles.email}>{profile.email}</Text>
        </View>
        
        <View style={styles.roleContainer}>
          <Text style={styles.role}>
            {user?.role === 'client' ? '👤 Cliente' : 
             user?.role === 'worker' ? '👷 Profesional' : 
             user?.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
          </Text>
        </View>

      </View>

      {/* Información de contacto EDITABLE */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
        </View>
        
        <View style={styles.infoItem}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoLabel}>Nombre</Text>
          </View>
          <TouchableOpacity 
            style={styles.editableField}
            onPress={() => startEditing('name', profile.name)}
          >
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>
                {profile.name || 'Agregar nombre'}
              </Text>
            </View>
            <View style={styles.editIconContainer}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* EMAIL NO EDITABLE - CORREGIDO */}
        <View style={styles.infoItem}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoLabel}>Email</Text>
          </View>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>
              {profile.email || 'Agregar email'}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoLabel}>Teléfono</Text>
          </View>
          <TouchableOpacity 
            style={styles.editableField}
            onPress={() => startEditing('phone', profile.phone)}
          >
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>
                {profile.phone || 'Agregar teléfono'}
              </Text>
            </View>
            <View style={styles.editIconContainer}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoItem}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoLabel}>Verificación</Text>
          </View>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>
              {user?.is_verified ? '✅ Verificado' : '❌ No verificado'}
            </Text>
          </View>
        </View>
      </View>


      {/* Botón para cerrar sesión */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
          disabled={logoutLoading}
        >
          {logoutLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal para editar perfil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!editingField}
        onRequestClose={() => setEditingField(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>
                Editar {getFieldLabel(editingField || '')}
              </Text>
            </View>
            
            <TextInput
              style={[
                styles.textInput,
                editingField === 'description' && styles.textArea
              ]}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={getFieldPlaceholder(editingField || '')}
              multiline={editingField === 'description'}
              numberOfLines={editingField === 'description' ? 4 : 1}
              autoFocus={true}
              keyboardType={
                editingField === 'email' ? 'email-address' : 
                editingField === 'phone' ? 'phone-pad' : 'default'
              }
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingField(null)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  (editingField === 'name' && !editValue.trim()) && styles.saveButtonDisabled
                ]}
                onPress={saveProfile}
                disabled={saving || (editingField === 'name' && !editValue.trim())}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para confirmar logout */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={handleLogoutCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Cerrar Sesión</Text>
            </View>
            
            <View style={styles.logoutMessageContainer}>
              <Text style={styles.logoutMessage}>
                ¿Estás seguro de que quieres cerrar sesión?
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleLogoutCancel}
                disabled={logoutLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.logoutConfirmButton]}
                onPress={handleLogoutConfirm}
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.logoutConfirmButtonText}>Cerrar Sesión</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para opciones de avatar - CORREGIDO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAvatarOptions}
        onRequestClose={() => setShowAvatarOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Cambiar Foto de Perfil</Text>
            </View>
            
            <View style={styles.avatarOptionsContainer}>
              <TouchableOpacity 
                style={styles.avatarOption}
                onPress={() => {
                  setShowAvatarOptions(false);
                  takePhotoWithCamera();
                }}
              >
                <View style={styles.avatarOptionIconContainer}>
                  <Text style={styles.avatarOptionIcon}>📷</Text>
                </View>
                <View style={styles.avatarOptionTextContainer}>
                  <Text style={styles.avatarOptionText}>Tomar Foto</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.avatarOption}
                onPress={() => {
                  setShowAvatarOptions(false);
                  pickImageFromGallery();
                }}
              >
                <View style={styles.avatarOptionIconContainer}>
                  <Text style={styles.avatarOptionIcon}>🖼️</Text>
                </View>
                <View style={styles.avatarOptionTextContainer}>
                  <Text style={styles.avatarOptionText}>Elegir de Galería</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAvatarOptions(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Agregar los estilos faltantes para las nuevas estructuras
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
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
  profileSection: {
    backgroundColor: 'white',
    padding: 30,
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#007AFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarEditText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nameContainer: {
    marginBottom: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  emailContainer: {
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  roleContainer: {
    marginBottom: 10,
  },
  role: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  descriptionContainer: {
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  addDescriptionButton: {
    marginTop: 10,
    padding: 8,
  },
  addDescriptionText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
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
  sectionTitleContainer: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabelContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  editableField: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValueContainer: {
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editIconContainer: {
    marginLeft: 10,
  },
  editIcon: {
    fontSize: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  descriptionTextContainer: {},
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
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
  modalTitleContainer: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  logoutMessageContainer: {
    marginBottom: 20,
  },
  logoutMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  avatarOptionsContainer: {
    marginBottom: 20,
  },
  avatarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  avatarOptionIconContainer: {
    marginRight: 15,
  },
  avatarOptionIcon: {
    fontSize: 24,
  },
  avatarOptionTextContainer: {
    flex: 1,
  },
  avatarOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  saveButton: {
    backgroundColor: '#007AFF',
  },
  logoutConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutConfirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});