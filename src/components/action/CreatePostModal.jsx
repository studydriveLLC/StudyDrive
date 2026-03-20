import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Keyboard } from 'react-native';
import { Image as ImageIcon, Link as LinkIcon, BarChart2, Globe, Lock } from 'lucide-react-native';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';

const MAX_CHARS = 500;

export default function CreatePostModal({ visible, onClose }) {
  const theme = useAppTheme();
  const [postText, setPostText] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handlePublish = () => {
    console.log("Publication envoyée :", postText);
    setPostText('');
    Keyboard.dismiss();
    onClose();
  };

  const renderFooter = () => (
    <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.divider }]}>
      <View style={styles.mediaActions}>
        <Pressable style={styles.mediaButton} hitSlop={10}>
          <ImageIcon color={theme.colors.primary} size={22} />
        </Pressable>
        <Pressable style={styles.mediaButton} hitSlop={10}>
          <LinkIcon color={theme.colors.primary} size={22} />
        </Pressable>
        <Pressable style={styles.mediaButton} hitSlop={10}>
          <BarChart2 color={theme.colors.primary} size={22} />
        </Pressable>
      </View>
      
      <View style={styles.publishContainer}>
        <Text style={[styles.charCount, { 
          color: postText.length > MAX_CHARS - 50 ? theme.colors.error : theme.colors.textMuted 
        }]}>
          {postText.length}/{MAX_CHARS}
        </Text>
        
        <Pressable 
          style={[styles.publishButton, { backgroundColor: postText.trim() ? theme.colors.primary : theme.colors.primaryLight }]}
          disabled={!postText.trim()}
          onPress={handlePublish}
        >
          <Text style={[styles.publishText, { color: postText.trim() ? theme.colors.surface : theme.colors.textDisabled }]}>
            Publier
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <BottomSheet isVisible={visible} onClose={onClose} footer={renderFooter()}>
      <View style={styles.container}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Nouvelle publication</Text>
        
        <View style={styles.postBody}>
          <View style={styles.avatarColumn}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={{ color: theme.colors.primaryDark, fontWeight: '700', fontSize: 16 }}>K</Text>
            </View>
            <View style={[styles.verticalLine, { backgroundColor: theme.colors.border }]} />
          </View>
          
          <View style={styles.inputColumn}>
            <View style={styles.authorHeader}>
              <Text style={[styles.authorName, { color: theme.colors.text }]}>Kevy</Text>
              
              <Pressable 
                style={[styles.visibilityPill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => setIsPublic(!isPublic)}
              >
                {isPublic ? <Globe color={theme.colors.textMuted} size={12} /> : <Lock color={theme.colors.textMuted} size={12} />}
                <Text style={[styles.visibilityText, { color: theme.colors.textMuted }]}>
                  {isPublic ? 'Public' : 'Abonnés'}
                </Text>
              </Pressable>
            </View>
            
            {/* CORRECTION : Le champ est libre, c'est le ScrollView parent qui défile */}
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              placeholder="Que se passe-t-il ?"
              placeholderTextColor={theme.colors.textDisabled}
              multiline={true}
              maxLength={MAX_CHARS}
              autoFocus={true} 
              scrollEnabled={false} // Désactivé pour que le ScrollView global prenne le relais
              value={postText}
              onChangeText={setPostText}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  postBody: { flexDirection: 'row' },
  avatarColumn: { alignItems: 'center', marginRight: 12 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  verticalLine: { width: 2, flex: 1, marginTop: 8, borderRadius: 1 },
  inputColumn: { flex: 1, paddingBottom: 10 },
  authorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  authorName: { fontSize: 16, fontWeight: '700', marginRight: 10 },
  visibilityPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, gap: 4 },
  visibilityText: { fontSize: 11, fontWeight: '600' },
  
  // CORRECTION DU STYLE : On enlève le maxHeight
  textInput: { 
    fontSize: 17, 
    lineHeight: 24, 
    minHeight: 120, 
    paddingTop: 0, 
    paddingBottom: 10,
    textAlignVertical: 'top', 
  },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  mediaActions: { flexDirection: 'row', gap: 16 },
  mediaButton: { padding: 4 },
  publishContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  charCount: { fontSize: 12, fontWeight: '600' },
  publishButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  publishText: { fontWeight: '700', fontSize: 15 },
});