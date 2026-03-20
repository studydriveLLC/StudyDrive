import React from 'react';
import { View, StyleSheet } from 'react-native';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import { useAppTheme } from '../../theme/theme';

export default function PostCard({ post, onOpenComments, onOpenDescription, onOpenShare, onOpenOptions }) {
  const theme = useAppTheme();
  
  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.colors.surface, 
        borderColor: theme.colors.border,
      }
    ]}>
      <View style={styles.internalPadding}>
        <PostHeader 
          author={post.author} 
          date={post.date} 
          description={post.description} 
          onReadMore={() => onOpenDescription(post)}
          onOptionsPress={() => onOpenOptions(post)}
        />
      </View>

      <PostContent 
        media={post.media} 
        onPress={() => console.log("Ouvrir le visualiseur de media plein ecran")} 
      />

      <View style={styles.internalPadding}>
        <PostActions 
          likesCount={post.likes}
          commentsCount={post.comments}
          sharesCount={post.shares}
          isLikedByMe={post.isLikedByMe}
          onCommentPress={() => onOpenComments(post)}
          onSharePress={() => onOpenShare(post)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    paddingTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  internalPadding: {
    paddingHorizontal: 16,
  }
});