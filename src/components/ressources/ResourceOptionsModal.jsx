// src/components/ressources/ResourceOptionsModal.jsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Share2, AlertTriangle, Trash2, Bookmark, Edit2 } from 'lucide-react-native';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';

export default function ResourceOptionsModal({
  visible,
  onClose,
  resource,
  isMyResource,
  onShare,
  onSave,
  onDelete,
  onReport,
  onEdit,
  isSaving,
  isDeleting,
  isReporting
}) {
  const theme = useAppTheme();
  
  if (!resource) return null;

  const renderOption = (icon, label, onPress, isDestructive = false, isLoading = false) => (
    <Pressable
      style={[
        styles.optionRow, 
        { borderBottomColor: theme.colors.divider },
        isLoading && { opacity: 0.5 }
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: isDestructive ? 'rgba(235, 87, 87, 0.1)' : theme.colors.primaryLight },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={isDestructive ? theme.colors.error : theme.colors.primaryDark} size="small" />
        ) : (
          icon
        )}
      </View>
      <Text
        style={[
          styles.optionTitle,
          { color: isDestructive ? theme.colors.error : theme.colors.text },
        ]}
      >
        {isLoading ? 'Traitement en cours...' : label}
      </Text>
    </Pressable>
  );

  return (
    <BottomSheet isVisible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Options du document
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textMuted }]}
            numberOfLines={1}
          >
            {resource.title}
          </Text>
        </View>

        {renderOption(
          <Share2 color={theme.colors.primaryDark} size={20} />,
          'Partager la ressource',
          onShare
        )}
        
        {/* CORRECTION UX : Le bouton n'apparait que si ce n'est pas NOTRE ressource */}
        {!isMyResource && onSave && renderOption(
          <Bookmark color={theme.colors.primaryDark} size={20} />,
          'Ajouter / Retirer des favoris',
          onSave,
          false,
          isSaving
        )}

        {isMyResource ? (
          <>
            {renderOption(
              <Edit2 color={theme.colors.primaryDark} size={20} />,
              'Modifier le fichier',
              onEdit
            )}
            {renderOption(
              <Trash2 color={theme.colors.error} size={20} />,
              'Supprimer le fichier',
              onDelete,
              true,
              isDeleting
            )}
          </>
        ) : (
          onReport && renderOption(
            <AlertTriangle color={theme.colors.error} size={20} />,
            'Signaler ce document',
            onReport,
            true,
            isReporting
          )
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 20 },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTitle: { fontSize: 16, fontWeight: '600' },
});