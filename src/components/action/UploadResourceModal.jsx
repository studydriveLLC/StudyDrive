import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Platform } from 'react-native';
import { FileUp, X, File, CheckCircle2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';
import { useUploadResourceMutation } from '../../store/api/resourceApiSlice';

const CATEGORIES = ['Microbiologie', 'Biochimie', 'Qualite', 'Laboratoire'];
const LEVELS = ['BTS 1', 'BTS 2', 'Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'];

const getMimeType = (fileName, fallbackMime) => {
  if (fallbackMime && fallbackMime !== 'application/octet-stream') return fallbackMime;
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls': return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    default: return 'application/octet-stream';
  }
};

export default function UploadResourceModal({ visible, onClose }) {
  const theme = useAppTheme();
  
  const [uploadResource, { isLoading }] = useUploadResourceMutation();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [level, setLevel] = useState(LEVELS[0]);
  
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const progressValue = useSharedValue(0);

  useEffect(() => {
    if (isLoading) {
      progressValue.value = withRepeat(
        withSequence(
          withTiming(100, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      );
    } else {
      progressValue.value = 0;
    }
  }, [isLoading]);

  const handlePickFile = async () => {
    setUploadError('');
    setIsUploadSuccess(false);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets[0];
        
        if (picked.size > 15 * 1024 * 1024) {
          setUploadError("Le fichier depasse la limite de 15 MB.");
          return;
        }

        const sizeInMB = (picked.size / (1024 * 1024)).toFixed(2);
        
        let fileUri = picked.uri;
        if (Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
          fileUri = `file://${fileUri}`;
        }

        setFile({
          name: picked.name,
          uri: fileUri,
          size: sizeInMB,
          mimeType: getMimeType(picked.name, picked.mimeType)
        });
      }
    } catch (error) {
      console.log("Erreur lors de la selection du fichier :", error);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    setIsUploadSuccess(false);
    setUploadError('');

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('category', category);
    formData.append('level', level);
    
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    });

    try {
      await uploadResource(formData).unwrap();
      
      setIsUploadSuccess(true);
      setTimeout(() => {
        setFile(null);
        setTitle('');
        setIsUploadSuccess(false);
        onClose();
      }, 1500);

    } catch (error) {
      console.log("[FRONTEND UPLOAD ERROR] Detail :", error);
      const errorMessage = error?.data?.message || "Erreur réseau. Le fichier a été rejeté ou le délai a expiré.";
      setUploadError(errorMessage);
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
    opacity: isLoading ? 0.3 : 0
  }));

  const isFormValid = file && title.trim().length > 3;

  const renderFooter = () => (
    <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.divider }]}>
      {uploadError ? <Text style={[styles.errorText, { color: theme.colors.error || 'red' }]}>{uploadError}</Text> : null}
      <Pressable 
        style={[styles.submitButton, { backgroundColor: isFormValid ? theme.colors.primary : theme.colors.primaryLight }]}
        disabled={!isFormValid || isLoading}
        onPress={handleUpload}
      >
        {isLoading && (
          <Animated.View style={[styles.progressBar, { backgroundColor: theme.colors.primaryDark }, progressStyle]} />
        )}
        <Text style={[styles.submitText, { color: isFormValid ? theme.colors.surface : theme.colors.textDisabled }]}>
          {isLoading ? "Envoi en cours..." : "Partager le document"}
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
            <Text style={[styles.uploadText, { color: theme.colors.text }]}>Appuyez pour selectionner</Text>
            <Text style={[styles.uploadSub, { color: theme.colors.textMuted }]}>PDF, DOCX, XLSX, JPG, PNG (Max 15 MB)</Text>
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
            {!isLoading && (
              <Pressable onPress={() => setFile(null)} hitSlop={10} style={styles.removeFileBtn}>
                <X color={theme.colors.primaryDark} size={20} />
              </Pressable>
            )}
            {isUploadSuccess && (
              <CheckCircle2 color={theme.colors.primaryDark} size={24} />
            )}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Titre du document</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Ex: Fiches de revision..."
            placeholderTextColor={theme.colors.textDisabled}
            value={title}
            onChangeText={setTitle}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Niveau d'etude</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillContainer}>
            {LEVELS.map((lvl) => (
              <Pressable 
                key={lvl} 
                style={[styles.pill, { 
                  backgroundColor: level === lvl ? theme.colors.primary : theme.colors.surface,
                  borderColor: level === lvl ? theme.colors.primary : theme.colors.border
                }]}
                onPress={() => !isLoading && setLevel(lvl)}
              >
                <Text style={[styles.pillText, { color: level === lvl ? theme.colors.surface : theme.colors.text }]}>
                  {lvl}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Categorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillContainer}>
            {CATEGORIES.map((cat) => (
              <Pressable 
                key={cat} 
                style={[styles.pill, { 
                  backgroundColor: category === cat ? theme.colors.primary : theme.colors.surface,
                  borderColor: category === cat ? theme.colors.primary : theme.colors.border
                }]}
                onPress={() => !isLoading && setCategory(cat)}
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
  errorText: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
});