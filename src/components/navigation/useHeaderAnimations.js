import { interpolate, Extrapolate, useAnimatedStyle } from 'react-native-reanimated';

export const HEADER_MAX_HEIGHT = 130;
export const HEADER_MIN_HEIGHT = 60;
export const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export function useHeaderAnimations(scrollY, insets) {
  const headerHeight = useAnimatedStyle(() => {
    const height = interpolate(scrollY.value, [0, SCROLL_DISTANCE], [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT], Extrapolate.CLAMP);
    return {
      height: height + insets.top,
      paddingTop: insets.top,
    };
  });

  const largeSearchOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SCROLL_DISTANCE / 2], [1, 0], Extrapolate.CLAMP)
  }));

  const largeSearchTranslateY = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, SCROLL_DISTANCE], [0, -20], Extrapolate.CLAMP) }]
  }));

  const miniSearchOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [SCROLL_DISTANCE / 2, SCROLL_DISTANCE], [0, 1], Extrapolate.CLAMP)
  }));

  // Le Logo glisse vers la gauche et s'efface
  const logoTranslateX = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(scrollY.value, [0, SCROLL_DISTANCE / 1.5], [0, -30], Extrapolate.CLAMP) }]
  }));

  const logoOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SCROLL_DISTANCE / 2], [1, 0], Extrapolate.CLAMP)
  }));

  // La Cloche reste à sa place (left: 0) mais s'affiche progressivement 
  // seulement après que le logo a commencé à disparaître. Zéro superposition.
  const bellOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [SCROLL_DISTANCE / 2, SCROLL_DISTANCE], [0, 1], Extrapolate.CLAMP)
  }));
  
  const bellTranslateX = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(scrollY.value, [SCROLL_DISTANCE / 2, SCROLL_DISTANCE], [20, 0], Extrapolate.CLAMP) }]
  }));

  return {
    headerHeight,
    largeSearchOpacity,
    largeSearchTranslateY,
    miniSearchOpacity,
    logoTranslateX,
    logoOpacity,
    bellOpacity,
    bellTranslateX,
  };
}