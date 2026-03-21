import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Keyboard, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../../theme/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BottomSheet({ isVisible, onClose, children, footer }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const MAX_TRANSLATE_Y = insets.top + 60;
  const SHEET_HEIGHT = SCREEN_HEIGHT - MAX_TRANSLATE_Y;

  const [isMounted, setIsMounted] = useState(isVisible);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);

  const slideConfig = { duration: 300, easing: Easing.out(Easing.cubic) };

  const isClosingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isVisible) {
      isClosingRef.current = false;
      setIsMounted(true);
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, slideConfig);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, slideConfig, (finished) => {
        if (finished) {
          runOnJS(setIsMounted)(false);
        }
      });
    }
  }, [isVisible]);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, (e) => {
      keyboardHeight.value = withTiming(e.endCoordinates.height, { duration: 250 });
    });

    const hideSub = Keyboard.addListener(hideEvt, () => {
      keyboardHeight.value = withTiming(0, { duration: 250 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Keyboard.dismiss();
    onCloseRef.current();
  }, []);

  const panGesture = Gesture.Pan()
    .activeOffsetY([15, 15])
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY * 0.5;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 150 || e.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withTiming(0, slideConfig);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: isVisible ? 'auto' : 'none',
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    paddingBottom: keyboardHeight.value,
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => {
    const isKeyboardOpen = keyboardHeight.value > 0;
    return {
      paddingBottom: withTiming(isKeyboardOpen ? 10 : insets.bottom + 85, { duration: 250 }),
    };
  });

  if (!isMounted) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheetContainer,
            { height: SHEET_HEIGHT, backgroundColor: theme.colors.background, bottom: 0 },
            sheetStyle,
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.dragHandle, { backgroundColor: theme.colors.border }]} />
            <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={15}>
              <X color={theme.colors.text} size={24} />
            </Pressable>
          </View>

          <Animated.ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </Animated.ScrollView>

          {footer && (
            <Animated.View style={[styles.footerContainer, footerAnimatedStyle]}>
              {footer}
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  header: { height: 40, alignItems: 'center', justifyContent: 'center' },
  dragHandle: { width: 40, height: 5, borderRadius: 3, marginTop: 10 },
  closeButton: { position: 'absolute', right: 20, top: 10 },
  scrollContent: { paddingBottom: 20 },
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'transparent',
  },
});