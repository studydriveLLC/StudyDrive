import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { useAppTheme } from '../../theme/theme';

const SEARCH_SUGGESTIONS = [
  "Rechercher des sujets...",
  "Trouver des membres...",
  "Explorer LokoNet...",
  "Chercher des ressources..."
];

export default function AnimatedSearchPlaceholder({ isHidden }) {
  const theme = useAppTheme();
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isHidden) return;

    const interval = setInterval(() => {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-10, { duration: 300 }, () => {
        runOnJS(setIndex)((index + 1) % SEARCH_SUGGESTIONS.length);
        translateY.value = 10;
        
        opacity.value = withTiming(1, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isHidden, index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  if (isHidden) return null;

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, { color: theme.colors.textDisabled }, animatedStyle]}>
        {SEARCH_SUGGESTIONS[index]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingLeft: 40, 
    paddingRight: 12,
    pointerEvents: 'none', 
  },
  text: {
    fontSize: 15,
  },
});