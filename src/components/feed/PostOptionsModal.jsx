import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Edit2, Trash2, Bookmark, UserMinus, AlertTriangle } from 'lucide-react-native';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';

export default function PostOptionsModal({ visible, onClose, isMyPost, onEdit, onDelete, onSave, onUnfollow, onReport }) {
  const theme = useAppTheme();

  const renderOption = (icon, label, onPress, isDestructive = false) => (
    <Pressable 
      style={[styles.optionRow, { borderBottomColor: theme.colors.divider }]} 
      onPress={onPress}
    >
      <View style={[
        styles.iconBox, 
        { backgroundColor: isDestructive ? 'rgba(235, 87, 87, 0.1)' : theme.colors.primaryLight }
      ]}>
        {icon}
      </View>
      <Text style={[styles.optionTitle, { color: isDestructive ? theme.colors.error : theme.colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <BottomSheet isVisible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Options</Text>
        </View>

        {isMyPost ? (
          <>
            {renderOption(<Edit2 color={theme.colors.primaryDark} size={20} />, "Modifier la publication", onEdit)}
            {renderOption(<Trash2 color={theme.colors.error} size={20} />, "Supprimer", onDelete, true)}
          </>
        ) : (
          <>
            {renderOption(<Bookmark color={theme.colors.primaryDark} size={20} />, "Sauvegarder", onSave)}
            {renderOption(<UserMinus color={theme.colors.primaryDark} size={20} />, "Ne plus suivre l'auteur", onUnfollow)}
            {renderOption(<AlertTriangle color={theme.colors.error} size={20} />, "Signaler la publication", onReport, true)}
          </>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
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
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});