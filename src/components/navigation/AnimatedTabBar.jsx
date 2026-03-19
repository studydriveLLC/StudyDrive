import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HardDrive, FolderOpen, Target, MessageSquare, FileText, Plus } from 'lucide-react-native';
import { useAppTheme } from '../../theme/theme';

const TabItem = ({ isFocused, route, onPress, theme }) => {
  const scale = useSharedValue(isFocused ? 1 : 0);
  const timerRef = useRef(null);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, { damping: 12, stiffness: 150 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 + scale.value * 0.15 }],
    };
  });

  const handlePressIn = () => {
    timerRef.current = setTimeout(() => {
      console.log(`Ouverture de la modale d'aide pour : ${route.name}`);
    }, 5000);
  };

  const handlePressOut = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const color = isFocused ? theme.colors.primary : '#A0A0A0';

  const renderIcon = () => {
    switch (route.name) {
      case 'Ressources':
        return isFocused ? <FolderOpen color={color} size={24} fill={color} /> : <HardDrive color={color} size={24} />;
      case 'PourToi':
        return <Target color={color} size={24} />;
      case 'Messages':
        return <MessageSquare color={color} size={24} />;
      case 'MyWord':
        return <FileText color={color} size={24} />;
      default:
        return null;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        {renderIcon()}
      </Animated.View>
      <Text style={[styles.tabLabel, { color: color, opacity: isFocused ? 1 : 0.7 }]}>
        {route.name === 'PourToi' ? 'Pour Toi' : route.name}
      </Text>
    </Pressable>
  );
};

export default function AnimatedTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || 15 }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        if (route.name === 'Action') {
          return (
            <Pressable
              key={route.key}
              style={[styles.centralButtonContainer, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                console.log("Ouverture de l'action contextuelle");
              }}
            >
              <Plus color="#FFFFFF" size={32} />
            </Pressable>
          );
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          } else if (isFocused) {
            console.log(`Scroll To Top déclenché pour ${route.name}`);
          }
        };

        return (
          <TabItem
            key={route.key}
            isFocused={isFocused}
            route={route}
            onPress={onPress}
            theme={theme}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  centralButtonContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -25 }],
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 4,
    borderColor: '#F2E6E4', 
  }
});