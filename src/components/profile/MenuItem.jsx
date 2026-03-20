import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '../../theme/theme';

export default function MenuItem({ icon, label, onPress, isDestructive = false, showChevron = true }) {
  const theme = useAppTheme();

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container, 
        { backgroundColor: pressed ? theme.colors.surface : 'transparent' }
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: isDestructive ? 'rgba(235, 87, 87, 0.1)' : theme.colors.primaryLight }]}>
        {icon}
      </View>
      <Text style={[styles.label, { color: isDestructive ? theme.colors.error : theme.colors.text }]}>
        {label}
      </Text>
      {showChevron && !isDestructive && (
        <ChevronRight color={theme.colors.textDisabled} size={20} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});