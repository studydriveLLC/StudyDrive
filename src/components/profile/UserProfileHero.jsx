//src/components/profile/UserProfileHero.jsx
import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, Vibration } from 'react-native';
import Animated, { interpolate, Extrapolation, useAnimatedStyle } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../../theme/theme';
import RoleBadge from '../ui/RoleBadge';
import AnimatedButton from '../ui/AnimatedButton';
import { useGetFollowStatusQuery, useFollowUserMutation, useUnfollowUserMutation } from '../../store/api/socialApiSlice';

export default function UserProfileHero({ profile, scrollY, onAvatarPress, postCount, resourceCount }) {
  const theme = useAppTheme();
  const currentUser = useSelector((state) => state.auth.user);
  
  const isMe = currentUser?._id === profile?._id;
  
  const { data: statusData, isLoading: isStatusLoading } = useGetFollowStatusQuery(profile?._id, { skip: !profile?._id || isMe });
  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowing }] = useUnfollowUserMutation();

  const isFollowed = statusData?.data?.isFollowing || false;
  const isFollower = statusData?.data?.isFollower || false;
  const isActionLoading = isFollowing || isUnfollowing;

  const handleToggleFollow = async () => {
    if (isActionLoading || isStatusLoading || !profile?._id) return;
    Vibration.vibrate(40); 
    try {
      if (isFollowed) await unfollowUser(profile._id).unwrap();
      else await followUser(profile._id).unwrap();
    } catch (error) {}
  };

  const coverAnimatedStyle = useAnimatedStyle(() => {
    const sv = scrollY?.value ?? 0;
    const translateY = interpolate(sv, [-100, 0, 100], [-50, 0, 50], Extrapolation.CLAMP);
    const scale = interpolate(sv, [-100, 0], [1.5, 1], Extrapolation.CLAMP);
    return { transform: [{ translateY }, { scale }] };
  });

  const coverUrl = profile.cover || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop';
  const avatarUrl = profile.avatar || 'https://ui-avatars.com/api/?name=User&background=random';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.coverContainer, { backgroundColor: theme.colors.primaryLight }]}>
        <Animated.Image source={{ uri: coverUrl }} style={[styles.cover, coverAnimatedStyle]} />
      </View>
      
      <View style={styles.content}>
        <Pressable 
          onPress={onAvatarPress} 
          style={[styles.avatarContainer, { borderColor: theme.colors.background, backgroundColor: theme.colors.surface }]}
        >
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </Pressable>

        <View style={styles.nameRow}>
          <Text style={[styles.pseudo, { color: theme.colors.text }]} numberOfLines={1}>
            {profile.pseudo || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Utilisateur'}
          </Text>
          <RoleBadge role={profile.role} isVerified={profile.isVerified} customBadge={profile.badge} size={18} />
        </View>

        {profile.university && (
          <Text style={[styles.university, { color: theme.colors.textMuted }]}>{profile.university}</Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{postCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Publications</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{resourceCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Ressources</Text>
          </View>
        </View>

        {profile.bio && (
          <Text style={[styles.bio, { color: theme.colors.text }]} numberOfLines={4}>
            {profile.bio}
          </Text>
        )}

        <View style={styles.actionRow}>
          {isMe ? (
            <AnimatedButton title="Modifier le profil" onPress={() => {}} variant="outline" style={styles.fullButton} />
          ) : (
            <>
              <Pressable 
                style={[styles.followButton, { backgroundColor: isFollowed ? 'transparent' : theme.colors.primary, borderColor: isFollowed ? theme.colors.border : theme.colors.primary }]} 
                onPress={handleToggleFollow}
              >
                {isActionLoading ? <ActivityIndicator color={isFollowed ? theme.colors.text : '#fff'} /> : <Text style={[styles.followText, { color: isFollowed ? theme.colors.text : '#fff' }]}>{isFollowed ? "Abonné" : (isFollower ? "Suivre en retour" : "S'abonner")}</Text>}
              </Pressable>
              <Pressable style={[styles.messageButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.messageText, { color: theme.colors.text }]}>Message</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', paddingBottom: 24 },
  coverContainer: { height: 160, overflow: 'hidden' },
  cover: { width: '100%', height: '100%', resizeMode: 'cover' },
  content: { paddingHorizontal: 20, marginTop: -50, alignItems: 'center' },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  avatar: { width: '100%', height: '100%', borderRadius: 50 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pseudo: { fontSize: 24, fontWeight: '800' },
  university: { fontSize: 14, fontWeight: '500', marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.02)' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: '70%', marginHorizontal: 20 },
  bio: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  fullButton: { flex: 1, height: 44 },
  followButton: { flex: 1, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  followText: { fontSize: 15, fontWeight: '700' },
  messageButton: { flex: 1, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  messageText: { fontSize: 15, fontWeight: '700' }
});