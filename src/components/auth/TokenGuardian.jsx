import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../theme/theme';

export default function TokenGuardian() {
  const { isTokenRefreshing } = useSelector((state) => state.auth);
  const theme = useAppTheme();

  if (!isTokenRefreshing) return null;

  return (
    <View style={styles.overlay}>
      <BlurView 
        intensity={80} 
        tint={theme.colors.background === '#000000' ? 'dark' : 'light'} 
        style={StyleSheet.absoluteFill}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.text, { color: theme.colors.text }]}>
            Restauration de la session...
          </Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  }
});