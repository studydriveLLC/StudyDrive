import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import CommentsModal from './CommentsModal';
import { useAppTheme } from '../../theme/theme';

export default function PostCard({ post }) {
  const theme = useAppTheme();
  
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);

  const handleReadMore = () => {
    console.log("Ouvrir la modale LiquidGlass pour lire toute la description");
  };

  const handleMediaPress = () => {
    console.log("Ouvrir le visualiseur de media plein ecran");
  };

  const handleCommentPress = () => {
    setIsCommentsVisible(true);
  };

  const handleSharePress = () => {
    console.log("Ouvrir la modale de partage");
  };

  return (
    <>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <PostHeader 
          author={post.author} 
          date={post.date} 
          description={post.description} 
          onReadMore={handleReadMore}
        />

        <PostContent 
          media={post.media} 
          onPress={handleMediaPress} 
        />

        <PostActions 
          likesCount={post.likes}
          commentsCount={post.comments}
          sharesCount={post.shares}
          isLikedByMe={post.isLikedByMe}
          onCommentPress={handleCommentPress}
          onSharePress={handleSharePress}
        />
      </View>

      <CommentsModal 
        visible={isCommentsVisible} 
        onClose={() => setIsCommentsVisible(false)} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#5170FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
});