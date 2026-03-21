import React from 'react';
import { View, StyleSheet } from 'react-native';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import { useAppTheme } from '../../theme/theme';

export default function PostCard({
  post,
  currentUserId,
  onOpenComments,
  onOpenDescription,
  onOpenShare,
  onOpenOptions,
  onLike,
  onDelete,
}) {
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
          onReadMore={() => onOpenDescription && onOpenDescription(post)}
          onOptionsPress={() => onOpenOptions && onOpenOptions(post)}
        />
      </View>

      <PostContent
        media={post.media}
        onPress={() => console.log("Ouvrir le visualiseur de media plein ecran")}
      />

      <View style={styles.internalPadding}>
        <PostActions
          likesCount={post.likes}
          commentsCount={post.commentsCount}
          sharesCount={post.shares}
          isLikedByMe={post.isLikedByMe}
          onCommentPress={() => onOpenComments && onOpenComments(post)}
          onSharePress={() => onOpenShare && onOpenShare(post)}
          onLikePress={() => onLike && onLike(post._id)}
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