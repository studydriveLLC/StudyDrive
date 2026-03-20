import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import CommentsModal from './CommentsModal';
import PostDescriptionModal from './PostDescriptionModal';
import ShareModal from './ShareModal';
import PostOptionsModal from './PostOptionsModal';
import { useAppTheme } from '../../theme/theme';

export default function PostCard({ post }) {
  const theme = useAppTheme();
  
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const [isShareVisible, setIsShareVisible] = useState(false);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);

  // Simulation : Plus tard, cela sera géré via Redux (ex: currentUserId === post.author.id)
  const isMyPost = post.author.pseudo === 'Kevy';

  const handleReadMore = () => setIsDescriptionVisible(true);
  const handleMediaPress = () => console.log("Ouvrir le visualiseur de media plein ecran");
  const handleCommentPress = () => setIsCommentsVisible(true);
  const handleSharePress = () => setIsShareVisible(true);
  const handleOptionsPress = () => setIsOptionsVisible(true);

  // Actions de la modale d'options
  const handleEdit = () => { console.log("Edition"); setIsOptionsVisible(false); };
  const handleDelete = () => { console.log("Suppression"); setIsOptionsVisible(false); };
  const handleSave = () => { console.log("Sauvegarde"); setIsOptionsVisible(false); };
  const handleUnfollow = () => { console.log("Ne plus suivre"); setIsOptionsVisible(false); };
  const handleReport = () => { console.log("Signalement"); setIsOptionsVisible(false); };

  const executeInternalShare = () => { console.log("Republier id", post.id); setIsShareVisible(false); };
  const executeExternalShare = () => { console.log("Lien externe id", post.id); setIsShareVisible(false); };

  return (
    <>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <PostHeader 
          author={post.author} 
          date={post.date} 
          description={post.description} 
          onReadMore={handleReadMore}
          onOptionsPress={handleOptionsPress}
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

      <CommentsModal visible={isCommentsVisible} onClose={() => setIsCommentsVisible(false)} />
      <PostDescriptionModal visible={isDescriptionVisible} onClose={() => setIsDescriptionVisible(false)} author={post.author} date={post.date} description={post.description} />
      <ShareModal visible={isShareVisible} onClose={() => setIsShareVisible(false)} onShareInternal={executeInternalShare} onShareExternal={executeExternalShare} />
      
      <PostOptionsModal 
        visible={isOptionsVisible} 
        onClose={() => setIsOptionsVisible(false)} 
        isMyPost={isMyPost}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
        onUnfollow={handleUnfollow}
        onReport={handleReport}
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