import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import AnimatedTabBar from '../components/navigation/AnimatedTabBar';
import FeedScreen from '../screens/home/FeedScreen';
import RessourcesScreen from '../screens/ressources/RessourcesScreen';
import CreatePostModal from '../components/action/CreatePostModal';
import UploadResourceModal from '../components/action/UploadResourceModal';
import { useAppTheme } from '../theme/theme';

const Tab = createBottomTabNavigator();

const PlaceholderScreen = ({ route }) => {
  const theme = useAppTheme();
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.primary, fontSize: 18, fontWeight: 'bold' }}>Interface {route.name}</Text>
    </View>
  );
};

const EmptyActionScreen = () => null;

export default function MainTabNavigator() {
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [isResourceModalVisible, setIsResourceModalVisible] = useState(false);

  useEffect(() => {
    // Le cerveau central qui redirige l'action selon la page active
    const subscription = DeviceEventEmitter.addListener('SMART_ACTION_PRESS', ({ routeName }) => {
      if (routeName === 'PourToi') {
        setIsPostModalVisible(true);
      } else if (routeName === 'Ressources') {
        setIsResourceModalVisible(true);
      } else if (routeName === 'Messages') {
        console.log("Ouvrir la modale de Nouveau Message");
      } else if (routeName === 'MyWord') {
        console.log("Ouvrir la modale de Nouveau MyWord");
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      <Tab.Navigator tabBar={(props) => <AnimatedTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Ressources" component={RessourcesScreen} />
        <Tab.Screen name="PourToi" component={FeedScreen} />
        <Tab.Screen name="Action" component={EmptyActionScreen} />
        <Tab.Screen name="Messages" component={PlaceholderScreen} />
        <Tab.Screen name="MyWord" component={PlaceholderScreen} />
      </Tab.Navigator>

      {/* Les cockpits de création injectés globalement */}
      <CreatePostModal visible={isPostModalVisible} onClose={() => setIsPostModalVisible(false)} />
      <UploadResourceModal visible={isResourceModalVisible} onClose={() => setIsResourceModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});