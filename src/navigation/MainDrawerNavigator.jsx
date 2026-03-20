import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MainTabNavigator from './MainTabNavigator';
import CustomDrawerContent from '../components/navigation/CustomDrawerContent';
import { useAppTheme } from '../theme/theme';

const Drawer = createDrawerNavigator();

export default function MainDrawerNavigator() {
  const theme = useAppTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerStyle: {
          backgroundColor: theme.colors.background,
          width: '80%',
        },
        drawerType: 'front', // S'ouvre par-dessus la page
        swipeEdgeWidth: 100,
      }}
    >
      <Drawer.Screen name="Tabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
}