import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme/theme';

export default function SkeletonResourceCard() {
  const theme = useAppTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // -1 = Infini
      true // Reverse (effet yoyo)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, animatedStyle]}>
      <View style={styles.internalPadding}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.border }]} />
          <View style={styles.headerText}>
            <View style={[styles.titleLine, { backgroundColor: theme.colors.border }]} />
            <View style={[styles.subLine, { backgroundColor: theme.colors.border, width: '40%' }]} />
          </View>
        </View>

        {/* Content Skeleton */}
        <View style={styles.content}>
          <View style={[styles.titleLine, { backgroundColor: theme.colors.border, width: '90%', height: 18, marginBottom: 8 }]} />
          <View style={[styles.titleLine, { backgroundColor: theme.colors.border, width: '100%' }]} />
          <View style={[styles.titleLine, { backgroundColor: theme.colors.border, width: '80%' }]} />
        </View>

        {/* Footer Skeleton */}
        <View style={styles.footer}>
          <View style={styles.badgeGroup}>
            <View style={[styles.badge, { backgroundColor: theme.colors.border }]} />
            <View style={[styles.badge, { backgroundColor: theme.colors.border, width: 60 }]} />
          </View>
          <View style={[styles.downloadBtn, { backgroundColor: theme.colors.border }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, paddingTop: 16, paddingBottom: 16, borderRadius: 24, borderWidth: 1, borderLeftWidth: 0, borderRightWidth: 0 },
  internalPadding: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  headerText: { flex: 1, marginLeft: 12 },
  titleLine: { height: 12, borderRadius: 6, marginBottom: 6 },
  subLine: { height: 10, borderRadius: 5 },
  content: { marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  badgeGroup: { flexDirection: 'row', gap: 8 },
  badge: { width: 50, height: 26, borderRadius: 13 },
  downloadBtn: { width: 44, height: 44, borderRadius: 22 },
});