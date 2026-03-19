import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import AnimatedTabBar from '../components/navigation/AnimatedTabBar';
import FeedScreen from '../screens/home/FeedScreen';
import { useAppTheme } from '../theme/theme';

const Tab = createBottomTabNavigator();

const PlaceholderScreen = ({ route }) => {
  const theme = useAppTheme();
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.primary, fontSize: 18, fontWeight: 'bold' }}>
        Interface {route.name}
      </Text>
      <Text style={{ color: '#A0A0A0', marginTop: 10 }}>En cours de construction...</Text>
    </View>
  );
};

const EmptyActionScreen = () => null;

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Ressources" component={PlaceholderScreen} />
      <Tab.Screen name="PourToi" component={FeedScreen} />
      <Tab.Screen name="Action" component={EmptyActionScreen} />
      <Tab.Screen name="Messages" component={PlaceholderScreen} />
      <Tab.Screen name="MyWord" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});