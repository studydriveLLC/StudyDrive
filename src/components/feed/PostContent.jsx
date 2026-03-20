import React from 'react';
import { View, Image, StyleSheet, Pressable, Text } from 'react-native';
import { Play } from 'lucide-react-native';
import { useAppTheme } from '../../theme/theme';
import { formatCount } from '../../utils/formatters';

export default function PostContent({ media, onPress }) {
  const theme = useAppTheme();

  if (!media || media.length === 0) return null;

  // Pour cette version, nous gérons le premier média (Image ou Vidéo)
  const mainMedia = media[0];

  return (
    <Pressable 
      style={[styles.container, { borderColor: theme.colors.border }]} 
      onPress={onPress}
    >
      <Image 
        source={{ uri: mainMedia.url }} 
        style={styles.image} 
        resizeMode="cover"
      />
      
      {mainMedia.type === 'video' && (
        <View style={[styles.videoOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
          <View style={[styles.playButton, { backgroundColor: theme.colors.primary }]}>
            <Play color={theme.colors.surface} size={24} fill={theme.colors.surface} style={styles.playIcon} />
          </View>
          {mainMedia.views && (
            <View style={[styles.viewsBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={styles.viewsText}>{formatCount(mainMedia.views)} vues</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 4, 
  },
  viewsBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  viewsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});