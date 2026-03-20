import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { Layout, FadeIn } from 'react-native-reanimated';
import { useAppTheme } from '../../theme/theme';

export default function ExpandableText({ text, tiers = [15, 60, 240], style }) {
  const theme = useAppTheme();
  
  // État pour suivre le palier actuel (index dans le tableau 'tiers')
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const [showReadControl, setShowReadControl] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);

  // Le nombre de lignes maximum à afficher est le palier actuel
  const maxLines = tiers[currentTierIndex];

  // Callback pour détecter le layout du texte natif
  const handleTextLayout = useCallback((e) => {
    const lineCount = e.nativeEvent.lines.length;
    
    // Si le nombre de lignes réelles dépasse la limite actuelle, on montre le contrôle
    if (lineCount > maxLines) {
      setShowReadControl(true);
    } else if (isFullyExpanded) {
      // Si on est à fond, on cache "Lire plus" pour laisser place à "Lire moins"
      setShowReadControl(false);
    } else {
      setShowReadControl(false);
    }
  }, [maxLines, isFullyExpanded]);

  const toggleExpansion = () => {
    if (isFullyExpanded) {
      // Retour au tout premier palier (reset)
      setCurrentTierIndex(0);
      setIsFullyExpanded(false);
    } else {
      const nextIndex = currentTierIndex + 1;
      
      // Si on a encore des paliers disponibles
      if (nextIndex < tiers.length) {
        setCurrentTierIndex(nextIndex);
      } else {
        // Sinon, on marque comme totalement étendu (scrolable dans le parent)
        setIsFullyExpanded(true);
      }
    }
  };

  return (
    // 'layout={Layout}' permet une animation fluide quand la taille change
    <Animated.View layout={Layout.duration(200)} style={styles.container}>
      <Text 
        style={[styles.baseText, { color: theme.colors.text }, style]}
        numberOfLines={maxLines}
        onTextLayout={handleTextLayout}
      >
        {text}
      </Text>
      
      {(showReadControl || isFullyExpanded) && (
        <Animated.View entering={FadeIn} style={styles.controlContainer}>
          <Pressable onPress={toggleExpansion} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>
              {isFullyExpanded ? "Lire moins" : "Lire plus"}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  baseText: { fontSize: 16, lineHeight: 26 },
  controlContainer: { alignItems: 'flex-start', marginTop: 8 },
  actionButton: { paddingVertical: 4 },
  actionText: { fontSize: 14, fontWeight: '700' }
});