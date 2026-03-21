import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Animated, StyleSheet, Platform, TouchableOpacity, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAppTheme, spacing, typography, borderRadius } from '../../theme/theme';

export default function AnimatedInput({ 
  label, value, onChangeText, isPassword, keyboardType, autoCapitalize, style 
}) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const inputRef = useRef(null);
  const animatedIsFocused = useRef(new Animated.Value(value === '' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: (isFocused || value !== '') ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute',
    left: spacing.m,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [20, spacing.xs],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [typography.sizes.body, typography.sizes.small],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.textMuted, theme.colors.primary],
    }),
  };

  const borderColor = animatedIsFocused.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary],
  });

  const handlePress = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Pressable style={[styles.container, style]} onPress={handlePress}>
      <Animated.View style={[
        styles.inputWrapper, 
        { borderColor, backgroundColor: theme.colors.surface }
      ]}>
        <Animated.Text style={labelStyle} pointerEvents="none">
          {label}
        </Animated.Text>
        
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input, 
              { color: theme.colors.text },
              Platform.OS === 'web' && { outlineStyle: 'none' }
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={isPassword && !showPassword}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            selectionColor={theme.colors.primary}
          />
          
          {isPassword && (
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={20} color={theme.colors.textMuted} />
              ) : (
                <Eye size={20} color={theme.colors.textMuted} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.m,
    height: 64,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.body,
    padding: 0,
    margin: 0,
    height: 24,
  },
  eyeIcon: {
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  }
});