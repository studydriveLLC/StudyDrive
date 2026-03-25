// src/hooks/useResourceFileManager.js
import { useState } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

export default function useResourceFileManager(token, theme, logView, logDownload) {
  const [downloads, setDownloads] = useState({});
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeViewId, setActiveViewId] = useState(null);

  const handleViewAction = async (resource) => {
    let fileUrl = resource.fileUrl || resource.url || resource.tempFilePath;
    if (!fileUrl) return;

    if (!fileUrl.startsWith('http')) {
      const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000';
      fileUrl = `${rawBaseUrl.replace(/\/$/, '')}/${fileUrl.replace(/^\//, '')}`;
    }

    setActiveViewId(resource._id);
    logView(resource._id).unwrap().catch(() => {});

    const format = resource.format?.toLowerCase();
    const supportedFormats = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'];

    if (supportedFormats.includes(format)) {
      setActiveDocument({ ...resource, resolvedUrl: fileUrl });
    } else {
      try {
        await WebBrowser.openBrowserAsync(fileUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          toolbarColor: theme.colors.background,
        });
      } catch (error) {}
    }
  };

  const handleDownloadAction = async (resource) => {
    let fileUrl = resource.fileUrl || resource.url || resource.tempFilePath;
    if (!fileUrl || downloads[resource._id]?.status === 'downloading') return;
    
    const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000';
    if (!fileUrl.startsWith('http')) fileUrl = `${rawBaseUrl.replace(/\/$/, '')}/${fileUrl.replace(/^\//, '')}`;
    
    setDownloads(prev => ({ ...prev, [resource._id]: { status: 'downloading', progress: 0 } }));

    try {
      const fileName = `${(resource.title || 'Doc').replace(/[^a-zA-Z0-9]/g, '_')}.${resource.format || 'pdf'}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const isOurBackend = fileUrl.includes(rawBaseUrl) || fileUrl.includes('192.168.') || fileUrl.includes('localhost');
      const options = (isOurBackend && !fileUrl.includes('cloudinary.com') && token) ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const onProgress = (e) => setDownloads(prev => ({ ...prev, [resource._id]: { status: 'downloading', progress: (e.totalBytesWritten / e.totalBytesExpectedToWrite) * 100 || 50 } }));
      const downloadResumable = FileSystem.createDownloadResumable(fileUrl, fileUri, options, onProgress);

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) return setDownloads(prev => ({ ...prev, [resource._id]: { status: 'idle', progress: 0 } }));
        const result = await downloadResumable.downloadAsync();
        if (result && result.status < 400) {
          try {
            const base64Data = await FileSystem.readAsStringAsync(result.uri, { encoding: FileSystem.EncodingType.Base64 });
            const savedUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/octet-stream');
            await FileSystem.writeAsStringAsync(savedUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
            await FileSystem.deleteAsync(result.uri, { idempotent: true });
          } catch (safError) {
            if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { dialogTitle: 'Enregistrer le document' });
          }
        } else throw new Error('Erreur HTTP');
      } else {
        const result = await downloadResumable.downloadAsync();
        if (result && result.status < 400) {
          if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { dialogTitle: 'Enregistrer le document' });
        } else throw new Error('Erreur HTTP');
      }

      setDownloads(prev => ({ ...prev, [resource._id]: { status: 'success', progress: 100 } }));
      logDownload(resource._id).unwrap().catch(() => {});
      setTimeout(() => setDownloads(prev => ({ ...prev, [resource._id]: { status: 'idle', progress: 0 } })), 3000);
    } catch (error) {
      setDownloads(prev => ({ ...prev, [resource._id]: { status: 'idle', progress: 0 } }));
    }
  };

  return {
    downloads,
    activeDocument,
    setActiveDocument,
    activeViewId,
    handleViewAction,
    handleDownloadAction
  };
}