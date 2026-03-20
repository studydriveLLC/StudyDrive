import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Download, Check, Square } from 'lucide-react-native';
import { useAppTheme } from '../../theme/theme';

export default function DownloadProgress({ status = 'idle', progress = 0, onPress }) {
  const theme = useAppTheme();
  
  // Moteur d'animation de la jauge
  const fillHeight = useSharedValue(0);

  useEffect(() => {
    // Si on annule, on redescend à 0. Sinon on suit la progression.
    const targetHeight = status === 'idle' ? 0 : progress;
    fillHeight.value = withTiming(targetHeight, { 
      duration: 300, 
      easing: Easing.out(Easing.cubic) 
    });
  }, [progress, status]);

  const fillStyle = useAnimatedStyle(() => ({
    height: `${fillHeight.value}%`,
    // Vert succès universel (#217346) ou couleur primaire dynamique
    backgroundColor: status === 'success' ? '#217346' : theme.colors.primary,
  }));

  const renderIcon = () => {
    if (status === 'success') return <Check color={theme.colors.surface} size={20} />;
    if (status === 'downloading') return <Square color={theme.colors.surface} size={14} fill={theme.colors.surface} />;
    return <Download color={theme.colors.surface} size={20} />;
  };

  return (
    <Pressable 
      onPress={onPress} 
      style={[
        styles.button, 
        { backgroundColor: status === 'idle' ? theme.colors.primary : theme.colors.primaryLight }
      ]}
    >
      {/* Calque de remplissage liquide */}
      <Animated.View style={[styles.fillOverlay, fillStyle]} />
      
      {/* Calque de l'icône, intouché par le layout du fluide */}
      <View style={styles.iconWrapper}>
        {renderIcon()}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fillOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  iconWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  }
});