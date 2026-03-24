import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Camera, Lock, User, Phone } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch } from 'react-redux';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';
import { useUpdatePasswordMutation, useUploadAvatarMutation } from '../../store/api/authApiSlice';
import { showSuccessToast } from '../../store/slices/uiSlice';
import { updateUser } from '../../store/slices/authSlice';

export default function EditProfileModal({ visible, onClose, currentUser, onSave, isLoading: isUpdatingProfile }) {
  const theme = useAppTheme();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('profile');

  const [pseudo, setPseudo] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [updatePassword, { isLoading: isUpdatingPassword }] = useUpdatePasswordMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();
  
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible && currentUser) {
      setPseudo(currentUser.pseudo || '');
      setPhone(currentUser.phone || '');
      setBio(currentUser.bio || '');
      setAvatarUri(currentUser.avatar || null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setActiveTab('profile');
    }
  }, [visible, currentUser]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setErrorMsg("Permission d'acces a la galerie requise.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      handleAvatarUpload(result.assets[0]);
    }
  };

  const handleAvatarUpload = async (asset) => {
    setErrorMsg('');
    const formData = new FormData();
    const filename = asset.uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('avatar', { uri: asset.uri, name: filename, type });

    try {
      const res = await uploadAvatar(formData).unwrap();
      dispatch(updateUser({ avatar: res.data.avatarUrl || res.data.url }));
      dispatch(showSuccessToast({ message: "Photo de profil mise a jour" }));
    } catch (err) {
      setErrorMsg("Echec de l'upload de la photo.");
    }
  };

  const submitProfile = () => {
    setErrorMsg('');
    if (pseudo.trim().length < 2) return setErrorMsg("Le pseudo est trop court.");
    onSave({ pseudo, phone, bio });
  };

  const submitPassword = async () => {
    setErrorMsg('');
    if (newPassword !== confirmPassword) return setErrorMsg("Les mots de passe ne correspondent pas.");
    if (newPassword.length < 6) return setErrorMsg("Le nouveau mot de passe est trop court.");

    try {
      // CORRECTION ICI : Le backend attend l'étiquette exacte "currentPassword"
      await updatePassword({ currentPassword: currentPassword, password: newPassword }).unwrap();
      dispatch(showSuccessToast({ message: "Mot de passe mis a jour avec succes" }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || "Erreur lors de la modification du mot de passe.");
    }
  };

  const isProfileLoading = isUpdatingProfile || isUploadingAvatar;
  const isProfileValid = pseudo.trim().length >= 2;
  const isPasswordValid = currentPassword.length >= 6 && newPassword.length >= 6 && newPassword === confirmPassword;

  const renderFooter = () => (
    <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.divider }]}>
      {errorMsg ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMsg}</Text> : null}
      
      {activeTab === 'profile' ? (
        <Pressable 
          style={[styles.submitButton, { backgroundColor: isProfileValid ? theme.colors.primary : theme.colors.border }]}
          disabled={!isProfileValid || isProfileLoading}
          onPress={submitProfile}
        >
          {isProfileLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Enregistrer le profil</Text>}
        </Pressable>
      ) : (
        <Pressable 
          style={[styles.submitButton, { backgroundColor: isPasswordValid ? theme.colors.error : theme.colors.border }]}
          disabled={!isPasswordValid || isUpdatingPassword}
          onPress={submitPassword}
        >
          {isUpdatingPassword ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Mettre a jour la securite</Text>}
        </Pressable>
      )}
    </View>
  );

  return (
    <BottomSheet isVisible={visible} onClose={onClose} footer={renderFooter()}>
      <View style={styles.container}>
        
        <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Pressable 
            style={[styles.tab, activeTab === 'profile' && { backgroundColor: theme.colors.primaryLight }]}
            onPress={() => { setActiveTab('profile'); setErrorMsg(''); }}
          >
            <User color={activeTab === 'profile' ? theme.colors.primaryDark : theme.colors.textMuted} size={18} />
            <Text style={[styles.tabText, { color: activeTab === 'profile' ? theme.colors.primaryDark : theme.colors.textMuted }]}>Informations</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'security' && { backgroundColor: 'rgba(235, 87, 87, 0.1)' }]}
            onPress={() => { setActiveTab('security'); setErrorMsg(''); }}
          >
            <Lock color={activeTab === 'security' ? theme.colors.error : theme.colors.textMuted} size={18} />
            <Text style={[styles.tabText, { color: activeTab === 'security' ? theme.colors.error : theme.colors.textMuted }]}>Securite</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {activeTab === 'profile' && (
            <View style={styles.section}>
              <View style={styles.avatarSection}>
                <Pressable onPress={handlePickImage} style={[styles.avatarBox, { backgroundColor: theme.colors.primaryLight }]}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <Text style={{ fontSize: 32, fontWeight: '800', color: theme.colors.primaryDark }}>
                      {pseudo ? pseudo[0].toUpperCase() : 'K'}
                    </Text>
                  )}
                  <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary }]}>
                    <Camera color="#FFF" size={14} />
                  </View>
                </Pressable>
                {isUploadingAvatar && <Text style={{ color: theme.colors.primary, marginTop: 10, fontSize: 12 }}>Upload en cours...</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Pseudo</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholderTextColor={theme.colors.textDisabled}
                  value={pseudo}
                  onChangeText={setPseudo}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Numero de telephone</Text>
                <View style={[styles.iconInputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Phone color={theme.colors.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.iconTextInput, { color: theme.colors.text }]}
                    placeholder="Ex: 0102030405"
                    placeholderTextColor={theme.colors.textDisabled}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Bio (Optionnel)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholderTextColor={theme.colors.textDisabled}
                  multiline
                  numberOfLines={3}
                  value={bio}
                  onChangeText={setBio}
                />
              </View>
            </View>
          )}

          {activeTab === 'security' && (
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Mot de passe actuel</Text>
                <View style={[styles.iconInputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Lock color={theme.colors.textMuted} size={18} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.iconTextInput, { color: theme.colors.text }]}
                    placeholder="Saisissez votre mot de passe actuel"
                    placeholderTextColor={theme.colors.textDisabled}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Nouveau mot de passe</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Minimum 6 caracteres"
                  placeholderTextColor={theme.colors.textDisabled}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Confirmer le mot de passe</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Re-saisissez le mot de passe"
                  placeholderTextColor={theme.colors.textDisabled}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  tabContainer: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 24 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 8 },
  tabText: { fontSize: 14, fontWeight: '700' },
  scrollContent: { paddingBottom: 20 },
  section: { flex: 1 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarBox: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 45 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  textInput: { height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, fontWeight: '500' },
  iconInputWrapper: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  inputIcon: { marginRight: 10 },
  iconTextInput: { flex: 1, fontSize: 15, fontWeight: '500', height: '100%' },
  textArea: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontWeight: '500', minHeight: 100, textAlignVertical: 'top' },
  footer: { padding: 16, borderTopWidth: 1 },
  submitButton: { height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  errorText: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
});