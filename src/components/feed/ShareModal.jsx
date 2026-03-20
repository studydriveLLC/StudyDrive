import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Repeat, Link as LinkIcon, X } from 'lucide-react-native';
import LiquidModal from '../ui/LiquidModal';
import { useAppTheme } from '../../theme/theme';

export default function ShareModal({ visible, onClose, onShareInternal, onShareExternal }) {
  const theme = useAppTheme();

  return (
    <LiquidModal visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Partager</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <X color={theme.colors.textMuted} size={24} />
        </Pressable>
      </View>

      <Pressable 
        style={[styles.optionRow, { borderBottomColor: theme.colors.divider, borderBottomWidth: 1 }]} 
        onPress={onShareInternal}
      >
        <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryLight }]}>
          <Repeat color={theme.colors.primaryDark} size={20} />
        </View>
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Republier sur StudyDrive</Text>
          <Text style={[styles.optionSub, { color: theme.colors.textMuted }]}>
            Partager sur votre fil d'actualite
          </Text>
        </View>
      </Pressable>

      <Pressable 
        style={styles.optionRow} 
        onPress={onShareExternal}
      >
        <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryLight }]}>
          <LinkIcon color={theme.colors.primaryDark} size={20} />
        </View>
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Copier le lien</Text>
          <Text style={[styles.optionSub, { color: theme.colors.textMuted }]}>
            Partager en dehors de l'application
          </Text>
        </View>
      </Pressable>
    </LiquidModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSub: {
    fontSize: 13,
  },
});