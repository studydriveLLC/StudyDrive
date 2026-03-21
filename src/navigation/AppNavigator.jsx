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
import ErrorToast from '../components/ui/ErrorToast';
import TopInsetBox from '../components/ui/TopInsetBox';
import TokenGuardian from '../components/auth/TokenGuardian';

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

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL;

export default function AppNavigator() {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await getToken('accessToken');
        const userDataStr = await getToken('userData');

        if (token && userDataStr) {
          const savedUser = JSON.parse(userDataStr);
          
          dispatch(setCredentials({ user: savedUser, token }));

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          try {
            const profileResponse = await fetch(`${rawBaseUrl}/v1/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              dispatch(setCredentials({ user: profileData.data?.user || profileData.data, token }));
            }
            // FINIE LA DECONNEXION BRUTALE ICI ! On fait confiance a apiSlice et au Guardian pour gerer les 401
          } catch (fetchError) {
            clearTimeout(timeoutId);
            console.warn('Backend injoignable. Session locale maintenue.');
          }
        } else {
          dispatch(setCredentials({ user: null, token: null }));
        }
      } catch (error) {
        console.error('Erreur lecture SecureStore', error);
        dispatch(setCredentials({ user: null, token: null }));
      } finally {
        dispatch(setAuthLoading(false));
      }
    };
    
    checkToken();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
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
                }}
              />
            </>
          )}
        </Stack.Navigator>
        <ErrorToast />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
});