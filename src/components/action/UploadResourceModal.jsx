import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { FileUp, X, File, CheckCircle2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';

const CATEGORIES = ['Microbiologie', 'Biochimie', 'Qualité', 'Laboratoire'];
// La liste complète et précise des niveaux d'étude
const LEVELS = ['BTS 1', 'BTS 2', 'Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'];

export default function UploadResourceModal({ visible, onClose }) {
  const theme = useAppTheme();
  
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [level, setLevel] = useState(LEVELS[0]);
  
  const [isUploading, setIsUploading] = useState(false);
  const uploadProgress = useSharedValue(0);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets[0];
        const sizeInMB = (picked.size / (1024 * 1024)).toFixed(2);
        setFile({
          name: picked.name,
          uri: picked.uri,
          size: sizeInMB,
          mimeType: picked.mimeType
        });
      }
    } catch (error) {
      console.log("Erreur lors de la sélection du fichier :", error);
    }
  };

  const handleUpload = () => {
    if (!file || !title.trim()) return;

    setIsUploading(true);
    uploadProgress.value = 0;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        uploadProgress.value = withTiming(100, { duration: 200 });
        clearInterval(interval);
        
        setTimeout(() => {
          setIsUploading(false);
          setFile(null);
          setTitle('');
          uploadProgress.value = 0;
          onClose();
        }, 1000);
      } else {
        uploadProgress.value = withTiming(progress, { duration: 200, easing: Easing.linear });
      }
    }, 300);
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${uploadProgress.value}%`,
  }));

  const isFormValid = file && title.trim().length > 3;

  const renderFooter = () => (
    <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.divider }]}>
      <Pressable 
        style={[styles.submitButton, { backgroundColor: isFormValid ? theme.colors.primary : theme.colors.primaryLight }]}
        disabled={!isFormValid || isUploading}
        onPress={handleUpload}
      >
        {isUploading && (
          <Animated.View style={[styles.progressBar, { backgroundColor: '#217346' }, progressStyle]} />
        )}
        <Text style={[styles.submitText, { color: isFormValid ? theme.colors.surface : theme.colors.textDisabled }]}>
          {isUploading ? "Envoi en cours..." : "Partager le document"}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <BottomSheet isVisible={visible} onClose={onClose} footer={renderFooter()}>
      <View style={styles.container}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Partager une ressource</Text>
        
        {!file ? (
          <Pressable 
            style={[styles.uploadZone, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderStyle: 'dashed', borderWidth: 2 }]}
            onPress={handlePickFile}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
              <FileUp color={theme.colors.primaryDark} size={32} />
            </View>
            <Text style={[styles.uploadText, { color: theme.colors.text }]}>Appuyez pour sélectionner</Text>
            <Text style={[styles.uploadSub, { color: theme.colors.textMuted }]}>PDF, DOCX, XLSX (Max 15 MB)</Text>
          </Pressable>
        ) : (
          <View style={[styles.fileCard, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}>
            <View style={styles.fileIconBox}>
              <File color={theme.colors.primaryDark} size={28} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: theme.colors.primaryDark }]} numberOfLines={1}>{file.name}</Text>
              <Text style={[styles.fileSize, { color: theme.colors.primary }]}>{file.size} MB</Text>
            </View>
            {!isUploading && (
              <Pressable onPress={() => setFile(null)} hitSlop={10} style={styles.removeFileBtn}>
                <X color={theme.colors.primaryDark} size={20} />
              </Pressable>
            )}
            {isUploading && uploadProgress.value === 100 && (
              <CheckCircle2 color="#217346" size={24} />
            )}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Titre du document</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Ex: Fiches de révision Qualité..."
            placeholderTextColor={theme.colors.textDisabled}
            value={title}
            onChangeText={setTitle}
            editable={!isUploading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Niveau d'étude</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillContainer}>
            {LEVELS.map((lvl) => (
              <Pressable 
                key={lvl} 
                style={[styles.pill, { 
                  backgroundColor: level === lvl ? theme.colors.primary : theme.colors.surface,
                  borderColor: level === lvl ? theme.colors.primary : theme.colors.border
                }]}
                onPress={() => !isUploading && setLevel(lvl)}
              >
                <Text style={[styles.pillText, { color: level === lvl ? theme.colors.surface : theme.colors.text }]}>
                  {lvl}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillContainer}>
            {CATEGORIES.map((cat) => (
              <Pressable 
                key={cat} 
                style={[styles.pill, { 
                  backgroundColor: category === cat ? theme.colors.primary : theme.colors.surface,
                  borderColor: category === cat ? theme.colors.primary : theme.colors.border
                }]}
                onPress={() => !isUploading && setCategory(cat)}
              >
                <Text style={[styles.pillText, { color: category === cat ? theme.colors.surface : theme.colors.text }]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  
  uploadZone: { borderRadius: 20, padding: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  uploadText: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  uploadSub: { fontSize: 13, fontWeight: '500' },
  
  fileCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  fileIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  fileSize: { fontSize: 13, fontWeight: '600' },
  removeFileBtn: { padding: 4 },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 15, fontWeight: '700', marginBottom: 10, marginLeft: 4 },
  textInput: { height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontWeight: '500' },
  
  pillContainer: { gap: 10, paddingRight: 20 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 14, fontWeight: '600' },

  footer: { padding: 16, borderTopWidth: 1 },
  submitButton: { height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  submitText: { fontSize: 16, fontWeight: '700', zIndex: 1 },
});