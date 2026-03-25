import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation } from 'react-native-reanimated';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useGetUnreadCountQuery } from '../../store/api/notificationApiSlice';
import { useAppTheme } from '../../theme/theme';

export default function NotificationBell() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  
  const { data: responseData } = useGetUnreadCountQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  
  const unreadCount = responseData?.data?.count ?? responseData?.count ?? 0;
  
  const blinkOpacity = useSharedValue(1);

  useEffect(() => {
    if (unreadCount > 0) {
      blinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(blinkOpacity);
      blinkOpacity.value = 1;
    }
  }, [unreadCount, blinkOpacity]);

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }));

  return (
    <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={10} style={styles.iconButton}>
      <Bell color={theme.colors.surface} size={24} />
      {unreadCount > 0 && (
        <Animated.View 
          style={[
            styles.badge, 
            { backgroundColor: theme.colors.error, borderColor: theme.colors.primary }, 
            animatedBadgeStyle
          ]} 
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: { padding: 4 },
  badge: { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
});