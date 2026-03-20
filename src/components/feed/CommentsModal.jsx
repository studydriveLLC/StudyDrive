import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { Send } from 'lucide-react-native';
import BottomSheet from '../ui/BottomSheet';
import CommentItem from './CommentItem';
import { useAppTheme } from '../../theme/theme';

const MOCK_COMMENTS = [
  { id: '1', author: 'SophieL', text: 'Totalement d\'accord avec toi ! L\'interface est super fluide. C\'est vraiment du beau travail sur le design system. J\'ai hâte de voir comment la suite va évoluer avec l\'intégration du backend et des ressources PDF.', time: 'Il y a 5 min' },
  { id: '2', author: 'Marcio_ADM', text: 'Je valide cette approche. Continuez comme ça pour le reste du développement. La modularisation est la clé pour un projet qui dure 10 ans. On évite la dette technique dès le départ.', time: 'Il y a 12 min' },
];

export default function CommentsModal({ visible, onClose }) {
  const theme = useAppTheme();
  const [newComment, setNewComment] = useState('');

  const renderInputFooter = () => (
    <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
        placeholder="Ajouter un commentaire..."
        placeholderTextColor={theme.colors.textDisabled}
        value={newComment}
        onChangeText={setNewComment}
        multiline
      />
      <Pressable 
        style={[styles.sendButton, { backgroundColor: newComment.trim() ? theme.colors.primary : theme.colors.primaryLight }]}
        disabled={!newComment.trim()}
      >
        <Send color={theme.colors.surface} size={18} />
      </Pressable>
    </View>
  );

  return (
    <BottomSheet isVisible={visible} onClose={onClose} footer={renderInputFooter()}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Commentaires</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{MOCK_COMMENTS.length} réponses</Text>
      </View>

      <View style={styles.commentsList}>
        {MOCK_COMMENTS.map((item) => (
          <CommentItem key={item.id} item={item} />
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginVertical: 15 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  commentsList: { paddingHorizontal: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  input: { flex: 1, minHeight: 44, maxHeight: 100, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingTop: 10, fontSize: 15 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 12 }
});