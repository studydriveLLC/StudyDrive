//src/components/navigation/AnimatedHeader.jsx
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable, DeviceEventEmitter, Text, Keyboard } from 'react-native';
import Animated, { 
  useAnimatedProps, 
  useAnimatedReaction, 
  runOnJS, 
  FadeInLeft, 
  FadeOutRight, 
  FadeInRight, 
  FadeOutLeft
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Search, Menu, X, ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '../../theme/theme';
import { useHeaderAnimations, SCROLL_DISTANCE } from './useHeaderAnimations';
import AnimatedSearchPlaceholder from './AnimatedSearchPlaceholder';
import NotificationBell from './NotificationBell';

export default function AnimatedHeader({ scrollY }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const navigation = useNavigation();
  const compactInputRef = useRef(null);
  
  const [searchValue, setSearchValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isCompactSearchActive, setIsCompactSearchActive] = useState(false);

  const animations = useHeaderAnimations(scrollY, insets);

  const forceCloseCompactSearch = useCallback(() => {
    Keyboard.dismiss();
    requestAnimationFrame(() => {
      setIsCompactSearchActive(false);
    });
  }, []);

  useAnimatedReaction(
    () => scrollY.value,
    (currentValue) => {
      if (currentValue < SCROLL_DISTANCE / 2 && isCompactSearchActive) {
        runOnJS(forceCloseCompactSearch)();
      }
    },
    [isCompactSearchActive, forceCloseCompactSearch]
  );

  const animatedSearchProps = useAnimatedProps(() => {
    return { pointerEvents: scrollY.value > SCROLL_DISTANCE / 2 ? 'none' : 'auto' };
  });

  useEffect(() => {
    if (isCompactSearchActive) {
      const timer = setTimeout(() => compactInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isCompactSearchActive]);

  useFocusEffect(
    useCallback(() => {
      DeviceEventEmitter.emit('UPDATE_TOP_INSET_COLOR', theme.colors.primary);
      return () => { DeviceEventEmitter.emit('UPDATE_TOP_INSET_COLOR', theme.colors.background); };
    }, [theme])
  );

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    if (searchValue.trim().length > 0) {
      DeviceEventEmitter.emit('EXECUTE_SEARCH', { query: searchValue.trim() });
    }
    if (isCompactSearchActive) {
      forceCloseCompactSearch();
    }
  };

  const clearSearch = () => {
    setSearchValue('');
    if (!isCompactSearchActive) Keyboard.dismiss();
    DeviceEventEmitter.emit('EXECUTE_SEARCH', { query: '' });
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.colors.primary }, animations.headerHeight, theme.shadows.medium]}>
      <View style={[styles.topRow, { height: 60, zIndex: 10 }]}>
        {!isCompactSearchActive ? (
          <>
            <Animated.View entering={FadeInLeft} exiting={FadeOutLeft} style={styles.leftSection}>
              <Text style={[styles.logoText, { color: theme.colors.surface }]}>LokoNet</Text>
            </Animated.View>

            <Animated.View entering={FadeInRight} exiting={FadeOutRight} style={styles.rightSection}>
              <Animated.View style={[animations.miniSearchOpacity, animations.miniSearchTranslateX]}>
                <Pressable onPress={() => setIsCompactSearchActive(true)} hitSlop={15} style={styles.iconButton}>
                  <Search color={theme.colors.surface} size={24} />
                </Pressable>
              </Animated.View>

              <NotificationBell />

              <Pressable onPress={() => navigation.navigate('Menu')} hitSlop={10} style={styles.iconButton}>
                <Menu color={theme.colors.surface} size={28} />
              </Pressable>
            </Animated.View>
          </>
        ) : (
          <Animated.View entering={FadeInRight} exiting={FadeOutRight} style={styles.compactSearchWrapper}>
            <Pressable onPress={forceCloseCompactSearch} hitSlop={15} style={styles.backButtonCompact}>
              <ArrowLeft color={theme.colors.surface} size={24} />
            </Pressable>
            
            <View style={[styles.searchBarCompact, { backgroundColor: theme.colors.surface }]}>
              <TextInput ref={compactInputRef} value={searchValue} onChangeText={setSearchValue} onSubmitEditing={handleSearchSubmit} placeholder="Rechercher..." placeholderTextColor={theme.colors.textDisabled} returnKeyType="search" style={[styles.searchInput, { color: theme.colors.text }]} selectionColor={theme.colors.primary} />
              {searchValue.length > 0 && (
                <Pressable onPress={clearSearch} hitSlop={10} style={{ padding: 5 }}>
                  <X color={theme.colors.textMuted} size={18} />
                </Pressable>
              )}
            </View>
          </Animated.View>
        )}
      </View>

      <Animated.View animatedProps={animatedSearchProps} style={[styles.bottomRow, animations.largeSearchOpacity, animations.largeSearchTranslateY, { zIndex: 1 }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
          <Search color={theme.colors.textMuted} size={20} style={styles.searchIcon} />
          <AnimatedSearchPlaceholder isHidden={isFocused || searchValue.length > 0} />
          <TextInput value={searchValue} onChangeText={setSearchValue} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onSubmitEditing={handleSearchSubmit} returnKeyType="search" style={[styles.searchInput, { color: theme.colors.text }]} selectionColor={theme.colors.primary} />
          {searchValue.length > 0 && (
            <Pressable onPress={clearSearch} style={styles.clearButton} hitSlop={10}>
              <X color={theme.colors.textMuted} size={18} />
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, overflow: 'hidden', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 16 }, 
  iconButton: { padding: 4 },
  compactSearchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backButtonCompact: { marginRight: 12 },
  searchBarCompact: { flex: 1, height: 40, borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  bottomRow: { height: 70, paddingHorizontal: 16, justifyContent: 'center', position: 'absolute', bottom: 0, left: 0, right: 0 },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8, zIndex: 2 },
  searchInput: { flex: 1, fontSize: 15, height: '100%', zIndex: 1, paddingVertical: 0 },
  clearButton: { padding: 4, marginLeft: 4, zIndex: 2 },
});