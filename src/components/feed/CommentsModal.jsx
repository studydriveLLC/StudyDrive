import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';
import BottomSheet from '../ui/BottomSheet';
import CommentItem from './CommentItem';
import { useAddCommentMutation } from '../../store/api/postApiSlice';
import { useAppTheme } from '../../theme/theme';

const formatCommentTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function CommentsModal({ visible, onClose, post }) {
  const theme = useAppTheme();
  const [newComment, setNewComment] = useState('');
  const [addComment, { isLoading: isAdding }] = useAddCommentMutation();

  const comments = post?.comments || [];

  const handleSend = async () => {
    if (!newComment.trim() || !post?._id) return;

    try {
      await addComment({ postId: post._id, text: newComment.trim() }).unwrap();
      setNewComment('');
    } catch (error) {
      console.log('Erreur ajout commentaire:', error);
    }
  };

  const renderInputFooter = () => (
    <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
      <TextInput
        style={[styles.input, {
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          borderColor: theme.colors.border
        }]}
        placeholder="Ajouter un commentaire..."
        placeholderTextColor={theme.colors.textDisabled}
        value={newComment}
        onChangeText={setNewComment}
        multiline
        editable={!isAdding}
      />
      <Pressable
        style={[
          styles.sendButton,
          {
            backgroundColor: newComment.trim() && !isAdding
              ? theme.colors.primary
              : theme.colors.primaryLight
          }
        ]}
        disabled={!newComment.trim() || isAdding}
        onPress={handleSend}
      >
        {isAdding ? (
          <ActivityIndicator size="small" color={theme.colors.surface} />
        ) : (
          <Send color={theme.colors.surface} size={18} />
        )}
      </Pressable>
    </View>
  );

  return (
    <BottomSheet isVisible={visible} onClose={onClose} footer={renderInputFooter()}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Commentaires</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {comments.length} reponse{comments.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.commentsList}>
        {comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Aucun commentaire pour le moment.
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textDisabled }]}>
              Soyez le premier a commenter !
            </Text>
          </View>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              item={{
                id: comment._id,
                author: comment.user?.pseudo || 'Utilisateur',
                text: comment.text,
                time: formatCommentTime(comment.createdAt),
                avatar: comment.user?.avatar || null,
                hasBadge: comment.user?.badgeType !== 'none' && comment.user?.badgeType !== undefined
              }}
            />
          ))
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginVertical: 15 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  commentsList: { paddingHorizontal: 16, maxHeight: 400 },
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, fontWeight: '500' },
  emptySubtext: { fontSize: 13, marginTop: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)'
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    fontSize: 15
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12
  }
});