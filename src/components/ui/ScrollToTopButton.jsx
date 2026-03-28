//src/components/ui/ScrollToTopButton.jsx
import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { ArrowUp } from 'lucide-react-native';
import { useAppTheme } from '../../theme/theme';

export default function ScrollToTopButton({ scrollY, onPress }) {
  const theme = useAppTheme();

  const animatedStyle = useAnimatedStyle(() => {
    // PROTECTION STRICTE : Si scrollY n'est pas fourni par le parent, on annule l'animation locale
    if (!scrollY || scrollY.value === undefined) {
      return {
        opacity: 1,
        transform: [{ translateY: 0 }, { scale: 1 }],
        pointerEvents: 'auto',
      };
    }

    // Si scrollY est fourni, on applique l'animation
    const isVisible = scrollY.value > 300;
    return {
      opacity: withTiming(isVisible ? 1 : 0, { duration: 250, easing: Easing.out(Easing.ease) }),
      transform: [
        { translateY: withTiming(isVisible ? 0 : 20, { duration: 250, easing: Easing.out(Easing.ease) }) },
        { scale: withTiming(isVisible ? 1 : 0.8, { duration: 250 }) }
      ],
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable 
        style={[styles.button, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primaryDark }]} 
        onPress={onPress}
      >
        <ArrowUp color="#FFFFFF" size={24} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 24, right: 20, zIndex: 100 },
  button: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
});