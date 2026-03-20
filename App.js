import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { useAppTheme } from './src/theme/theme';
import { navigationRef } from './src/navigation/NavigationService';

export default function App() {
  const scheme = useColorScheme();
  const theme = useAppTheme();

  // On récupère le thème de base (v7) pour hériter de sa structure (notamment l'objet 'fonts' obligatoire)
  const baseNavigationTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  // Création d'un pont sécurisé entre notre theme dynamique et le navigateur natif
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} translucent={true} />
        <NavigationContainer theme={navigationTheme} ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}