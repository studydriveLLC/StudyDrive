import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Eye, Download as DownloadIcon, MoreVertical } from 'lucide-react-native';
import DownloadProgress from './DownloadProgress';
import { useAppTheme } from '../../theme/theme';

export default function ResourceCard({ resource, downloadState, onDownloadAction, onOptions }) {
  const theme = useAppTheme();

  const getFormatColor = (format) => {
    switch(format?.toLowerCase()) {
      case 'pdf': return '#E25950'; 
      case 'docx': case 'doc': return '#2B579A'; 
      case 'xlsx': case 'xls': return '#217346'; 
      default: return theme.colors.primary;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.internalPadding}>
        
        <View style={styles.headerRow}>
          <View style={styles.formatBadgeContainer}>
            <View style={[styles.formatDot, { backgroundColor: getFormatColor(resource.format) }]} />
            <Text style={[styles.formatText, { color: theme.colors.textMuted }]}>
              {resource.format?.toUpperCase()} • {resource.fileSize} MB
            </Text>
          </View>
          <Pressable onPress={() => onOptions(resource)} hitSlop={15}>
            <MoreVertical color={theme.colors.textMuted} size={20} />
          </Pressable>
        </View>

        <View style={styles.contentRow}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {resource.title}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]} numberOfLines={3}>
            {resource.description}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.leftFooter}>
            <View style={[styles.levelBadge, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.levelText, { color: theme.colors.primaryDark }]}>{resource.level}</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Eye color={theme.colors.textDisabled} size={14} />
                <Text style={[styles.statText, { color: theme.colors.textMuted }]}>{resource.views}</Text>
              </View>
              <View style={styles.statItem}>
                <DownloadIcon color={theme.colors.textDisabled} size={14} />
                <Text style={[styles.statText, { color: theme.colors.textMuted }]}>{resource.downloads}</Text>
              </View>
            </View>
          </View>

          {/* Connexion au moteur Smart Gauge */}
          <DownloadProgress 
            status={downloadState?.status || 'idle'} 
            progress={downloadState?.progress || 0} 
            onPress={() => onDownloadAction(resource)} 
          />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, paddingTop: 16, paddingBottom: 16, borderRadius: 24, borderWidth: 1, borderLeftWidth: 0, borderRightWidth: 0 },
  internalPadding: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  formatBadgeContainer: { flexDirection: 'row', alignItems: 'center' },
  formatDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  formatText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  contentRow: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 8, lineHeight: 24 },
  description: { fontSize: 14, lineHeight: 22 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  leftFooter: { flex: 1, gap: 10 },
  levelBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  levelText: { fontSize: 12, fontWeight: '700' },
  statsContainer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, fontWeight: '600' },
});