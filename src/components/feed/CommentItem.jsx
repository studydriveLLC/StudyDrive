import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '../../theme/theme';

export default function CommentItem({ item }) {
  const theme = useAppTheme();
  const [maxLines, setMaxLines] = useState(5);
  const [totalLines, setTotalLines] = useState(0);

  const handleMeasure = useCallback((e) => {
    if (totalLines === 0) setTotalLines(e.nativeEvent.lines.length);
  }, [totalLines]);

  const hasMore = totalLines > maxLines;
  const isAtTheEnd = !hasMore && maxLines > 5;

  const toggleExpansion = () => {
    if (isAtTheEnd) {
      setMaxLines(5);
    } else {
      setMaxLines(prev => prev * 4);
    }
  };

  return (
    <View style={styles.commentRow}>
      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
        <Text style={{ color: theme.colors.primaryDark, fontWeight: '700' }}>
          {item.author[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentContentWrapper}>
        <Text style={[styles.commentAuthor, { color: theme.colors.text }]}>{item.author}</Text>
        <View style={[styles.commentBubble, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Texte invisible pour mesurer la totalité sans clipping */}
          <Text onTextLayout={handleMeasure} style={styles.hiddenMeasure}>
            {item.text}
          </Text>
          
          <Text 
            style={[styles.commentText, { color: theme.colors.textMuted }]}
            numberOfLines={maxLines}
          >
            {item.text}
          </Text>
          
          {(hasMore || isAtTheEnd) && (
            <Pressable onPress={toggleExpansion} style={styles.actionButton}>
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                {isAtTheEnd ? "Lire moins" : "Lire plus"}
              </Text>
            </Pressable>
          )}
        </View>
        <Text style={[styles.commentTime, { color: theme.colors.textDisabled }]}>{item.time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  commentRow: { flexDirection: 'row', marginBottom: 18, alignItems: 'flex-start' },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 4 },
  commentContentWrapper: { flex: 1 },
  commentAuthor: { fontSize: 13, fontWeight: '700', marginBottom: 4, marginLeft: 4 },
  commentBubble: { padding: 12, borderRadius: 18, borderTopLeftRadius: 4, borderWidth: 1, alignSelf: 'flex-start' },
  commentText: { fontSize: 15, lineHeight: 22 },
  commentTime: { fontSize: 11, marginTop: 4, marginLeft: 8, fontWeight: '500' },
  actionButton: { marginTop: 6, paddingVertical: 2 },
  actionText: { fontSize: 13, fontWeight: '700' },
  hiddenMeasure: { position: 'absolute', opacity: 0, zIndex: -1 }
});