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

const Stack = createStackNavigator();

const fastSpringConfig = {
  animation: 'spring',
  config: {
    stiffness: 1500,
    damping: 150,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

export default function AppNavigator() {
  const dispatch = useDispatch();
  const theme = useAppTheme();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await getToken('accessToken');
        const userDataStr = await getToken('userData'); // Récupération de l'utilisateur
        
        if (token) {
          let parsedUser = null;
          if (userDataStr) {
            try {
              parsedUser = JSON.parse(userDataStr);
            } catch (e) {
              console.error('Erreur parsing user data', e);
            }
          }
          // On injecte le token ET l'utilisateur restauré
          dispatch(setCredentials({ user: parsedUser, token })); 
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de session', error);
      } finally {
        dispatch(setAuthLoading(false));
      }
    };
    checkToken();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.mainWrapper, { backgroundColor: theme.colors.background }]}>
        <TopInsetBox />
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
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                  cardStyle: { backgroundColor: theme.colors.background }
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