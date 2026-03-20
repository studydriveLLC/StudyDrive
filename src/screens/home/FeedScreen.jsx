import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, DeviceEventEmitter } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedHeader from '../../components/navigation/AnimatedHeader';
import PostCard from '../../components/feed/PostCard';
import CommentsModal from '../../components/feed/CommentsModal';
import PostDescriptionModal from '../../components/feed/PostDescriptionModal';
import ShareModal from '../../components/feed/ShareModal';
import PostOptionsModal from '../../components/feed/PostOptionsModal';
import { useAppTheme } from '../../theme/theme';

const MOCK_POSTS = [
  {
    id: '1',
    author: { pseudo: 'Kevy', avatar: null, hasBadge: true },
    date: 'A l\'instant',
    description: 'Bienvenue sur la toute premiere version de notre fil d\'actualite ! L\'integration des cartes modulaires est un succes total. L\'UI est propre, immersive et prete a accueillir le backend.',
    likes: 12500,
    comments: 342,
    shares: 89,
    isLikedByMe: false,
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80' }],
  },
  {
    id: '2',
    author: { pseudo: 'Marcio_ADM', avatar: 'https://i.pravatar.cc/150?img=11', hasBadge: true },
    date: 'Il y a 2h',
    description: 'N\'oubliez pas que les examens approchent. J\'ai poste de nouveaux sujets de mathematiques dans la section Ressources. Allez jeter un oeil pour vous preparer au mieux.',
    likes: 850,
    comments: 45,
    shares: 12,
    isLikedByMe: true,
    media: [{ type: 'video', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80', views: 45000 }],
  },
  {
    id: '3',
    author: { pseudo: 'SophieL', avatar: 'https://i.pravatar.cc/150?img=5', hasBadge: false },
    date: 'Hier',
    description: 'Est-ce que quelqu\'un aurait le cours complet de Microbiologie Alimentaire ? Je suis prete a l\'echanger contre mes fiches de revision en qualite et normes. Merci d\'avance !',
    likes: 42,
    comments: 15,
    shares: 2,
    isLikedByMe: false,
  }
];

export default function FeedScreen({ navigation }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  
  const listRef = useRef(null);
  const savedScrollPosition = useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // État des modales
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [activeDescPost, setActiveDescPost] = useState(null);
  const [activeSharePost, setActiveSharePost] = useState(null);
  const [activeOptionsPost, setActiveOptionsPost] = useState(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SMART_TAB_PRESS', (event) => {
      if (event.routeName !== 'PourToi') return;

      if (scrollY.value > 100) {
        savedScrollPosition.current = scrollY.value;
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      } else if (savedScrollPosition.current > 100) {
        listRef.current?.scrollToOffset({ offset: savedScrollPosition.current, animated: true });
        savedScrollPosition.current = 0; 
      } else {
        triggerRefresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AnimatedHeader scrollY={scrollY} title="Pour Toi" navigation={navigation} />
      
      <Animated.FlatList
        ref={listRef}
        data={MOCK_POSTS}
        keyExtractor={(item) => item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={triggerRefresh}
        contentContainerStyle={{
          paddingTop: 140 + insets.top, 
          paddingBottom: 100, 
        }}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onOpenComments={setActiveCommentPost}
            onOpenDescription={setActiveDescPost}
            onOpenShare={setActiveSharePost}
            onOpenOptions={setActiveOptionsPost}
          />
        )}
      />

      {/* Rendu des modales à la racine de l'écran */}
      <CommentsModal 
        visible={!!activeCommentPost} 
        onClose={() => setActiveCommentPost(null)} 
      />
      
      <PostDescriptionModal 
        visible={!!activeDescPost} 
        onClose={() => setActiveDescPost(null)} 
        author={activeDescPost?.author} 
        date={activeDescPost?.date} 
        description={activeDescPost?.description} 
      />
      
      <ShareModal 
        visible={!!activeSharePost} 
        onClose={() => setActiveSharePost(null)} 
        onShareInternal={() => { console.log("Republié"); setActiveSharePost(null); }} 
        onShareExternal={() => { console.log("Lien copié"); setActiveSharePost(null); }} 
      />
      
      <PostOptionsModal 
        visible={!!activeOptionsPost} 
        onClose={() => setActiveOptionsPost(null)} 
        isMyPost={activeOptionsPost?.author?.pseudo === 'Kevy'}
        onEdit={() => { console.log("Edition"); setActiveOptionsPost(null); }}
        onDelete={() => { console.log("Suppression"); setActiveOptionsPost(null); }}
        onSave={() => { console.log("Sauvegarde"); setActiveOptionsPost(null); }}
        onUnfollow={() => { console.log("Unfollow"); setActiveOptionsPost(null); }}
        onReport={() => { console.log("Signalement"); setActiveOptionsPost(null); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});