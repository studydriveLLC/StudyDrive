import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import BottomSheet from '../ui/BottomSheet';
import ExpandableText from '../ui/ExpandableText';
import { useAppTheme } from '../../theme/theme';

export default function PostDescriptionModal({ visible, onClose, author, date, description }) {
  const theme = useAppTheme();

  // Gatekeeper de sécurité
  if (!author) return null;

  return (
    // Le BottomSheet contient déjà un ScrollView coordonné
    <BottomSheet isVisible={visible} onClose={onClose}>
      <View style={styles.container}>
        
        {/* Header avec les infos de l'auteur - Inchangé */}
        <View style={styles.header}>
          <View style={styles.authorInfo}>
            {author.avatar ? (
              <Image source={{ uri: author.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={{ color: theme.colors.primaryDark, fontWeight: '700', fontSize: 16 }}>
                  {author.pseudo[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.metaData}>
              <Text style={[styles.pseudo, { color: theme.colors.text }]}>{author.pseudo}</Text>
              <Text style={[styles.date, { color: theme.colors.textMuted }]}>{date}</Text>
            </View>
          </View>
        </View>

        {/* Moteur d'intelligence textuelle modulaire avec de gros paliers pour la description */}
        <ExpandableText 
          text={description} 
          tiers={[15, 60, 240]} // Paliers: 15l -> 60l -> 240l -> Scrolable
          style={styles.descriptionText}
        />

      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20, // Air en bas pour ne pas coller au bord
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaData: {
    marginLeft: 14,
  },
  pseudo: {
    fontSize: 17,
    fontWeight: '700',
  },
  date: {
    fontSize: 13,
    marginTop: 3,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 28, // Interlignage Senior pour la lecture longue
  },
});