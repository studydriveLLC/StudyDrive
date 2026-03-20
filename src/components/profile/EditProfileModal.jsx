import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image } from 'react-native';
import { Camera } from 'lucide-react-native';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';

export default function EditProfileModal({ visible, onClose, currentUser, onSave }) {
  const theme = useAppTheme();
  
  // États locaux initialisés avec les données actuelles
  const [pseudo, setPseudo] = useState(currentUser?.pseudo || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  
  const handleSave = () => {
    onSave({ pseudo, bio });
    onClose();
  };

  const renderFooter = () => (
    <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.divider }]}>
      <Pressable 
        style={[styles.saveButton, { backgroundColor: pseudo.trim() ? theme.colors.primary : theme.colors.border }]}
        disabled={!pseudo.trim()}
        onPress={handleSave}
      >
        <Text style={[styles.saveText, { color: theme.colors.surface }]}>Enregistrer les modifications</Text>
      </Pressable>
    </View>
  );

  return (
    <BottomSheet isVisible={visible} onClose={onClose} footer={renderFooter()}>
      <View style={styles.container}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Modifier le profil</Text>
        
        {/* Éditeur d'Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {currentUser?.avatar ? (
              <Image source={{ uri: currentUser.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={{ color: theme.colors.primaryDark, fontSize: 32, fontWeight: '700' }}>
                  {pseudo ? pseudo[0].toUpperCase() : 'K'}
                </Text>
              </View>
            )}
            <Pressable style={[styles.cameraBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
              <Camera color={theme.colors.surface} size={16} />
            </Pressable>
          </View>
        </View>

        {/* Formulaire */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Pseudo</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={pseudo}
            onChangeText={setPseudo}
            placeholder="Votre pseudo"
            placeholderTextColor={theme.colors.textDisabled}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Bio (Optionnel)</Text>
          <TextInput
            style={[styles.input, styles.bioInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Dites-en plus sur vous..."
            placeholderTextColor={theme.colors.textDisabled}
            multiline
            maxLength={150}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', marginLeft: 4, marginBottom: 8, textTransform: 'uppercase' },
  input: { height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontWeight: '500' },
  bioInput: { height: 100, paddingTop: 14, textAlignVertical: 'top' },
  
  footer: { padding: 16, borderTopWidth: 1 },
  saveButton: { height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '700' },
});