// src/components/ressources/DeleteResourceModal.jsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';

export default function DeleteResourceModal({ visible, onClose, onConfirm, resourceTitle, isLoading }) {
  const theme = useAppTheme();

  return (
    <BottomSheet isVisible={visible} onClose={onClose}>
      <View style={styles.deleteConfirmContainer}>
        <View style={styles.deleteIconBox}>
          <Trash2 color={theme.colors.error} size={32} />
        </View>
        <Text style={[styles.deleteConfirmTitle, { color: theme.colors.text }]}>
          Supprimer ce document ?
        </Text>
        <Text style={[styles.deleteConfirmText, { color: theme.colors.textMuted }]}>
          Cette action est irreversible. Le document "{resourceTitle}" sera definitivement efface du serveur.
        </Text>
        <View style={styles.deleteConfirmActions}>
          <Pressable 
            style={[styles.cancelBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} 
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>Annuler</Text>
          </Pressable>
          <Pressable 
            style={[styles.confirmDeleteBtn, { backgroundColor: theme.colors.error }]} 
            onPress={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmDeleteText}>Oui, supprimer</Text>
            )}
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  deleteConfirmContainer: { paddingHorizontal: 24, paddingBottom: 30, paddingTop: 10, alignItems: 'center' },
  deleteIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(235, 87, 87, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  deleteConfirmTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  deleteConfirmText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  deleteConfirmActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, height: 50, borderRadius: 25, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '700' },
  confirmDeleteBtn: { flex: 1, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  confirmDeleteText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' }
});