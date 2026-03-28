//src/screens/profile/UserProfileScreen.jsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, Dimensions, Modal, Image, ActivityIndicator } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolation,
  FadeIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MoreHorizontal, FileText, LayoutList, AlertTriangle, X } from 'lucide-react-native';
import { useAppTheme } from '../../theme/theme';
import { useGetUserProfileQuery } from '../../store/api/userApiSlice';
import { useGetResourcesQuery } from '../../store/api/resourceApiSlice';
import { useGetUserPostsQuery } from '../../store/api/postApiSlice'; 

import UserProfileHero from '../../components/profile/UserProfileHero';
import UserProfileSkeleton from '../../components/profile/UserProfileSkeleton';
import AnimatedButton from '../../components/ui/AnimatedButton';
import ResourceCard from '../../components/ressources/ResourceCard';
import PostCard from '../../components/feed/PostCard'; 
import ScrollToTopButton from '../../components/ui/ScrollToTopButton';

const { width } = Dimensions.get('window');

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params || {};
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const scrollViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState('posts'); 
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  
  const scrollY = useSharedValue(0);

  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    isFetching: isProfileFetching, 
    refetch: refetchProfile, 
    isError 
  } = useGetUserProfileQuery(userId, { skip: !userId });
  
  const { 
    data: resourcesData, 
    isLoading: isResourcesLoading, 
    refetch: refetchResources 
  } = useGetResourcesQuery(
    { uploadedBy: userId }, 
    { skip: !userId || activeTab !== 'resources' }
  );
  
  const { 
    data: postsData, 
    isLoading: isPostsLoading, 
    refetch: refetchPosts 
  } = useGetUserPostsQuery(
    { userId: userId }, 
    { skip: !userId || activeTab !== 'posts' }
  );

  const resources = resourcesData || [];
  const posts = postsData || [];

  const actualResourceCount = profile?.publicStats?.documents ?? resources.length ?? 0;
  const actualPostCount = profile?.publicStats?.posts ?? posts.length ?? 0;

  const handleRefresh = async () => {
    refetchProfile();
    if (activeTab === 'posts') refetchPosts();
    if (activeTab === 'resources') refetchResources();
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { 
      // FIX STRICT: Remplacement de event?.contentOffset par une evaluation stricte
      if (scrollY && event && event.contentOffset) {
        scrollY.value = event.contentOffset.y; 
      }
    },
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const sv = scrollY ? scrollY.value : 0;
    const opacity = interpolate(sv, [120, 160], [0, 1], Extrapolation.CLAMP);
    return { 
        opacity,
        pointerEvents: opacity > 0.5 ? 'auto' : 'none' 
    };
  });

  const backButtonStyle = useAnimatedStyle(() => {
    const sv = scrollY ? scrollY.value : 0;
    const opacity = interpolate(sv, [120, 160], [1, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  const fabStyle = useAnimatedStyle(() => {
    const sv = scrollY ? scrollY.value : 0;
    const opacity = interpolate(sv, [200, 300], [0, 1], Extrapolation.CLAMP);
    const translateY = interpolate(sv, [200, 300], [20, 0], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateY }],
      zIndex: sv > 250 ? 100 : -1,
    };
  });

  if (isProfileLoading) return <UserProfileSkeleton />;

  if (isError || !profile) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <AlertTriangle color={theme.colors.error} size={56} style={{ marginBottom: 16 }} />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>Profil introuvable</Text>
        <AnimatedButton title="Retour" onPress={() => navigation.goBack()} style={{ marginTop: 32 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      <Modal visible={isAvatarModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsAvatarModalVisible(false)}>
        <View style={styles.modalBackground}>
          <Pressable onPress={() => setIsAvatarModalVisible(false)} style={[styles.closeModalButton, { top: insets.top + 20 }]}>
            <X color="#FFF" size={32} />
          </Pressable>
          <Image source={{ uri: profile.avatar || 'https://ui-avatars.com/api/?name=User' }} style={styles.fullScreenImage} resizeMode="contain" />
        </View>
      </Modal>

      <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top + 10, backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }, stickyHeaderStyle]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={15}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </Pressable>
        <Text style={[styles.stickyName, { color: theme.colors.text }]} numberOfLines={1}>
          {profile.pseudo || profile.firstName}
        </Text>
        <Pressable style={styles.iconButton} hitSlop={15}>
          <MoreHorizontal color={theme.colors.text} size={24} />
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.absoluteHeader, { top: insets.top + 10 }, backButtonStyle]}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.blurButton, { backgroundColor: 'rgba(0,0,0,0.4)' }]} hitSlop={15}>
          <ArrowLeft color="#FFF" size={24} />
        </Pressable>
        <Pressable style={[styles.blurButton, { backgroundColor: 'rgba(0,0,0,0.4)' }]} hitSlop={15}>
          <MoreHorizontal color="#FFF" size={24} />
        </Pressable>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isProfileFetching} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
      >
        <UserProfileHero 
          profile={profile} 
          scrollY={scrollY} 
          onAvatarPress={() => setIsAvatarModalVisible(true)}
          postCount={actualPostCount}
          resourceCount={actualResourceCount}
        />

        <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={() => setActiveTab('posts')} style={[styles.tab, activeTab === 'posts' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 }]}>
            <Text style={[styles.tabText, { color: activeTab === 'posts' ? theme.colors.primary : theme.colors.textMuted, fontWeight: activeTab === 'posts' ? '800' : '600' }]}>
              Publications
            </Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('resources')} style={[styles.tab, activeTab === 'resources' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 }]}>
            <Text style={[styles.tabText, { color: activeTab === 'resources' ? theme.colors.primary : theme.colors.textMuted, fontWeight: activeTab === 'resources' ? '800' : '600' }]}>
              Ressources
            </Text>
          </Pressable>
        </View>

        <View style={styles.contentArea}>
          {activeTab === 'posts' && (
            isPostsLoading ? (
               <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : posts.length > 0 ? (
              posts.map((post) => (
                 <View key={post._id} style={{ marginBottom: 16 }}>
                    <PostCard post={post} />
                 </View>
              ))
            ) : (
              <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                <View style={[styles.emptyIconWrapper, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.primary }]}>
                  <LayoutList color={theme.colors.primary} size={40} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Aucune publication</Text>
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  Cet utilisateur n'a pas encore partagé de pensée sur son fil.
                </Text>
              </Animated.View>
            )
          )}

          {activeTab === 'resources' && (
            isResourcesLoading ? (
               <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : resources.length > 0 ? (
              resources.map((resource) => (
                 <View key={resource._id} style={{ marginBottom: 16 }}>
                    <ResourceCard resource={resource} />
                 </View>
              ))
            ) : (
              <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                <View style={[styles.emptyIconWrapper, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.primary }]}>
                  <FileText color={theme.colors.primary} size={40} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Aucune ressource</Text>
                <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                  Cet utilisateur n'a pas encore partagé de document éducatif.
                </Text>
              </Animated.View>
            )
          )}
        </View>
      </Animated.ScrollView>

      <Animated.View style={[styles.fabContainer, fabStyle]}>
        <ScrollToTopButton onPress={scrollToTop} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  absoluteHeader: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 100 },
  blurButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, zIndex: 90 },
  iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stickyName: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center', marginHorizontal: 16 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  tabText: { fontSize: 15 },
  contentArea: { minHeight: 400, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 60 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyIconWrapper: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24, elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  emptyText: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  errorText: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeModalButton: { position: 'absolute', right: 20, zIndex: 10, padding: 8 },
  fullScreenImage: { width: '100%', height: '80%' },
  fabContainer: { position: 'absolute', bottom: 30, right: 20 },
});