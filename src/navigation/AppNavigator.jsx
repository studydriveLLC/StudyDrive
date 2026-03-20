import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { getToken } from '../store/secureStoreAdapter';
import { setCredentials, setAuthLoading } from '../store/slices/authSlice';
import { useAppTheme } from '../theme/theme';

import LandingPage from '../screens/auth/LandingPage';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';

import MainTabNavigator from './MainTabNavigator'; 
import MenuScreen from '../screens/profile/MenuScreen';

import ErrorToast from '../components/ui/ErrorToast';
import TopInsetBox from '../components/ui/TopInsetBox';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await getToken('accessToken');
        if (token) {
          dispatch(setCredentials({ user: null, token })); 
        }
      } catch (error) {
        console.error('Erreur lors de la verification du token', error);
      } finally {
        dispatch(setAuthLoading(false));
      }
    };

    checkToken();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.mainWrapper, { backgroundColor: theme.colors.background }]}>
      <TopInsetBox />
      
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade',
          gestureEnabled: false, 
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Landing" component={LandingPage} />
            <Stack.Screen name="Register" component={RegisterPage} />
            <Stack.Screen name="Login" component={LoginPage} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen 
              name="Menu" 
              component={MenuScreen} 
              options={{ 
                animation: 'slide_from_right',
                gestureEnabled: true
              }} 
            />
          </>
        )}
      </Stack.Navigator>
      
      <ErrorToast />
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});