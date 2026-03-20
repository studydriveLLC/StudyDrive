import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, DeviceEventEmitter } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HardDrive, FolderOpen, Target, MessageSquare, FileText, Plus } from 'lucide-react-native';
import { useAppTheme } from '../../theme/theme';
import HelpModal from './HelpModal';

const TabItem = ({ isFocused, route, onPress, onLongPressTrigger, theme }) => {
  const scale = useSharedValue(isFocused ? 1 : 0);
  const timerRef = useRef(null);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, { damping: 12, stiffness: 150 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + scale.value * 0.15 }],
  }));

  const handlePressIn = () => {
    timerRef.current = setTimeout(() => { onLongPressTrigger(route.name); }, 5000);
  };

  const handlePressOut = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const color = isFocused ? theme.colors.primary : theme.colors.textDisabled;

  const renderIcon = () => {
    switch (route.name) {
      case 'Ressources': return isFocused ? <FolderOpen color={color} size={24} fill={color} /> : <HardDrive color={color} size={24} />;
      case 'PourToi': return <Target color={color} size={24} />;
      case 'Messages': return <MessageSquare color={color} size={24} />;
      case 'MyWord': return <FileText color={color} size={24} />;
      default: return null;
    }
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.tabItem}>
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>{renderIcon()}</Animated.View>
      <Text style={[styles.tabLabel, { color: color, opacity: isFocused ? 1 : 0.7 }]}>
        {route.name === 'PourToi' ? 'Pour Toi' : route.name}
      </Text>
    </Pressable>
  );
};

export default function AnimatedTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [activeHelpRoute, setActiveHelpRoute] = useState(null);

  // C'est ici qu'on capte le contexte actuel de l'utilisateur
  const currentRouteName = state.routes[state.index].name;

  return (
    <>
      <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || 15, backgroundColor: theme.colors.glassBackground, borderTopColor: theme.colors.glassBorder, borderTopWidth: 1 }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          if (route.name === 'Action') {
            return (
              <Pressable
                key={route.key}
                style={[styles.centralButtonContainer, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}
                onPress={() => {
                  // Le bouton intelligent émet l'action AVEC le contexte
                  DeviceEventEmitter.emit('SMART_ACTION_PRESS', { routeName: currentRouteName });
                }}
              >
                <Plus color={theme.colors.surface} size={32} />
              </Pressable>
            );
          }

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            else if (isFocused) DeviceEventEmitter.emit('SMART_TAB_PRESS', { routeName: route.name });
          };

          return <TabItem key={route.key} isFocused={isFocused} route={route} onPress={onPress} onLongPressTrigger={(name) => { setActiveHelpRoute(name); setHelpModalVisible(true); }} theme={theme} />;
        })}
      </View>
      <HelpModal visible={helpModalVisible} onClose={() => setHelpModalVisible(false)} routeName={activeHelpRoute} />
    </>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: { flexDirection: 'row', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 10, position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 5 },
  iconContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  centralButtonContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', transform: [{ translateY: -25 }], elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 6, borderWidth: 4 }
});