import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { X } from 'lucide-react-native';
import LiquidModal from '../ui/LiquidModal';
import { useAppTheme } from '../../theme/theme';

export default function PostDescriptionModal({ visible, onClose, author, date, description }) {
  const theme = useAppTheme();

  if (!author) return null;

  return (
    <LiquidModal visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          {author.avatar ? (
            <Image source={{ uri: author.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={{ color: theme.colors.surface, fontWeight: '700' }}>
                {author.pseudo.substring(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.metaData}>
            <Text style={[styles.pseudo, { color: theme.colors.text }]}>{author.pseudo}</Text>
            <Text style={[styles.date, { color: theme.colors.textMuted }]}>{date}</Text>
          </View>
        </View>
        
        <Pressable onPress={onClose} style={styles.closeButton}>
          <X color={theme.colors.textMuted} size={24} />
        </Pressable>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.fullText, { color: theme.colors.text }]}>
          {description}
        </Text>
      </ScrollView>
    </LiquidModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaData: {
    marginLeft: 12,
  },
  pseudo: {
    fontSize: 16,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  scrollContainer: {
    maxHeight: 400, 
  },
  scrollContent: {
    paddingBottom: 20,
  },
  fullText: {
    fontSize: 16,
    lineHeight: 26,
  },
});