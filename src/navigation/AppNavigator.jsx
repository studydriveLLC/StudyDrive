// src/navigation/AppNavigator.jsx
import React, { useEffect } from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getToken } from '../store/secureStoreAdapter';
import { setCredentials, setAuthLoading } from '../store/slices/authSlice';
import { useAppTheme } from '../theme/theme';

import LandingPage from '../screens/auth/LandingPage';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';
import MainTabNavigator from './MainTabNavigator';
import MenuScreen from '../screens/profile/MenuScreen';
import MyResourcesScreen from '../screens/profile/MyResourcesScreen'; // NOUVEL IMPORT
import ErrorToast from '../components/ui/ErrorToast';
import SuccessToast from '../components/ui/SuccessToast';
import TopInsetBox from '../components/ui/TopInsetBox';
import TokenGuardian from '../components/auth/TokenGuardian';

// IMPORT DE NOTRE NOUVEAU SOCKET
import socketService from '../services/socketService';

const Stack = createStackNavigator();

const fastSpringConfig = {
  animation: 'spring',
  config: {
    stiffness: 250,
    damping: 20,
    mass: 1,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

const fadeTimingConfig = {
  animation: 'timing',
  config: { duration: 250 },
};

const immersiveFadeInterpolator = ({ current }) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

export default function AppNavigator() {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await getToken('accessToken');
        const userDataStr = await getToken('userData');
        const refreshToken = await getToken('refreshToken');

        if (token && userDataStr) {
          const savedUser = JSON.parse(userDataStr);
          
          dispatch(setCredentials({ 
            user: savedUser, 
            token, 
            refreshToken
          }));

          // TRICHE YELY : On connecte le socket immediatement, de maniere synchrone, avec un token valide garanti.
          socketService.connect(token);

        } else {
          dispatch(setCredentials({ user: null, token: null, refreshToken: null }));
        }
      } catch (error) {
        console.error('Erreur lecture SecureStore', error);
        dispatch(setCredentials({ user: null, token: null, refreshToken: null }));
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.mainWrapper, { backgroundColor: theme.colors.background }]}>
        <TopInsetBox />
        
        <TokenGuardian />
        
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            transitionSpec: {
              open: fastSpringConfig,
              close: fastSpringConfig,
            },
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
                  gestureEnabled: false,
                  cardStyle: { backgroundColor: theme.colors.background },
                  transitionSpec: {
                    open: fadeTimingConfig,
                    close: fadeTimingConfig,
                  },
                  cardStyleInterpolator: immersiveFadeInterpolator,
                }}
              />
              {/* NOUVELLE ROUTE AJOUTÉE ICI */}
              <Stack.Screen name="MyResources" component={MyResourcesScreen} />
            </>
          )}
        </Stack.Navigator>
        
        <ErrorToast />
        <SuccessToast />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});