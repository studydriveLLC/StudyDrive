import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Send } from 'lucide-react-native';
import LiquidModal from '../ui/LiquidModal';
import { useAppTheme } from '../../theme/theme';

const MOCK_COMMENTS = [
  { id: '1', author: 'SophieL', text: 'Totalement d\'accord avec toi !', time: 'Il y a 5 min' },
  { id: '2', author: 'Marcio_ADM', text: 'Je valide cette approche. Continuez comme ça.', time: 'Il y a 12 min' },
];

export default function CommentsModal({ visible, onClose }) {
  const theme = useAppTheme();
  const [newComment, setNewComment] = useState('');

  const renderComment = ({ item }) => (
    <View style={styles.commentRow}>
      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
        <Text style={{ color: theme.colors.surface, fontWeight: '700', fontSize: 12 }}>
          {item.author.substring(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={[styles.commentBubble, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.commentAuthor, { color: theme.colors.text }]}>{item.author}</Text>
        <Text style={[styles.commentText, { color: theme.colors.textMuted }]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <LiquidModal visible={visible} onClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Commentaires</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {MOCK_COMMENTS.length} réponses
          </Text>
        </View>

        <FlatList
          data={MOCK_COMMENTS}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.inputContainer, { borderTopColor: theme.colors.divider }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
            placeholder="Écrire un commentaire..."
            placeholderTextColor={theme.colors.textDisabled}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <Pressable 
            style={[styles.sendButton, { backgroundColor: newComment.trim() ? theme.colors.primary : theme.colors.border }]}
            disabled={!newComment.trim()}
          >
            <Send color={theme.colors.surface} size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LiquidModal>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400, 
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 16,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentBubble: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});