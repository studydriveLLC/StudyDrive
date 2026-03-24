import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, DeviceEventEmitter, RefreshControl, Platform, AppState, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { useSelector, useDispatch } from 'react-redux';
import { Trash2 } from 'lucide-react-native';

import AnimatedHeader from '../../components/navigation/AnimatedHeader';
import SkeletonResourceCard from '../../components/ressources/SkeletonResourceCard';
import ResourceCard from '../../components/ressources/ResourceCard';
import ResourceOptionsModal from '../../components/ressources/ResourceOptionsModal';
import DocumentViewerModal from '../../components/ressources/DocumentViewerModal';
import EditResourceModal from '../../components/ressources/EditResourceModal';
import ReportResourceModal from '../../components/ressources/ReportResourceModal';
import BottomSheet from '../../components/ui/BottomSheet';
import SmartRefreshOverlay from '../../components/ui/SmartRefreshOverlay';
import { useAppTheme } from '../../theme/theme';
import socketService from '../../services/socketService';
import { 
  resourceApiSlice, useGetResourcesQuery, useDeleteResourceMutation, 
  useLogDownloadMutation, useLogViewMutation, useGetResourceQuery, 
  useToggleFavoriteMutation 
} from '../../store/api/resourceApiSlice';

export default function RessourcesScreen({ navigation }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const listRef = useRef(null);
  const isFetchingRef = useRef(false);
  const dispatch = useDispatch();

  const token = useSelector((state) => state.auth?.token);
  const currentUserId = navigation.getState()?.routes?.find((r) => r.name === 'Main')?.params?.user?._id;

  const [queryArgs, setQueryArgs] = useState({ page: 1, limit: 20 });
  const queryArgsRef = useRef(queryArgs);

  const [downloads, setDownloads] = useState({});
  const [activeOptionsResource, setActiveOptionsResource] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSmartRefreshing, setIsSmartRefreshing] = useState(false);
  const [activeViewId, setActiveViewId] = useState(null);

  // Nouveaux etats pour les modales d'action
  const [editingResource, setEditingResource] = useState(null);
  const [reportingResource, setReportingResource] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);

  useEffect(() => {
    queryArgsRef.current = queryArgs;
  }, [queryArgs]);

  const { data: resources = [], isLoading, isError, refetch } = useGetResourcesQuery(queryArgs);
  useGetResourceQuery(activeViewId, { skip: !activeViewId });
  
  const [logDownload] = useLogDownloadMutation();
  const [logView] = useLogViewMutation();
  const [deleteResource, { isLoading: isDeleting }] = useDeleteResourceMutation();
  const [toggleFavorite] = useToggleFavoriteMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await socketService.forceReconnect();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        socketService.forceReconnect();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let socketInstance;
    const setupLiveResources = async () => {
      try {
        socketInstance = await socketService.connect();
        
        socketInstance.on('resourceStatsUpdated', (data) => {
          dispatch(resourceApiSlice.util.updateQueryData('getResources', queryArgsRef.current, (draft) => {
            const resource = draft.find(r => String(r._id) === String(data.id));
            if (resource) {
              if (data.views !== undefined) resource.views = data.views;
              if (data.downloads !== undefined) resource.downloads = data.downloads;
            }
          }));
          dispatch(resourceApiSlice.util.invalidateTags([{ type: 'Resource', id: data.id }]));
        });

        socketInstance.on('newResource', (newResource) => {
          dispatch(resourceApiSlice.util.updateQueryData('getResources', queryArgsRef.current, (draft) => {
            const index = draft.findIndex(r => String(r._id) === String(newResource._id));
            if (index !== -1) {
              draft[index] = { ...draft[index], ...newResource };
            } else if (queryArgsRef.current.page === 1) {
              draft.unshift(newResource);
            }
          }));
          dispatch(resourceApiSlice.util.invalidateTags([{ type: 'Resource', id: 'LIST' }]));
        });
      } catch (error) {
        console.log('Erreur Socket UI:', error);
      }
    };
    setupLiveResources();
    return () => {
      if (socketInstance) {
        socketInstance.off('resourceStatsUpdated');
        socketInstance.off('newResource');
      }
    };
  }, [dispatch]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SMART_TAB_PRESS', async (event) => {
      if (event.routeName !== 'Ressources' || isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsSmartRefreshing(true);
      if (listRef.current) {
        if (typeof listRef.current.scrollToOffset === 'function') listRef.current.scrollToOffset({ offset: 0, animated: true });
        else if (listRef.current.getNode && typeof listRef.current.getNode().scrollToOffset === 'function') listRef.current.getNode().scrollToOffset({ offset: 0, animated: true });
      }
      try { await refetch(); } catch (error) {} 
      finally { setIsSmartRefreshing(false); isFetchingRef.current = false; }
    });
    return () => subscription.remove();
  }, [refetch]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

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

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    try {
      await deleteResource(resourceToDelete._id).unwrap();
      setResourceToDelete(null);
    } catch (error) {
      console.log('Erreur de suppression:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AnimatedHeader scrollY={scrollY} title="Ressources" navigation={navigation} />
      <SmartRefreshOverlay isVisible={isSmartRefreshing} />

      {isLoading && resources.length === 0 ? (
        <Animated.FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={{ paddingTop: 140 + insets.top, paddingBottom: 100 }}
          renderItem={() => <SkeletonResourceCard />}
        />
      ) : (
        <Animated.FlatList
          ref={listRef}
          data={resources}
          keyExtractor={(item) => item._id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 140 + insets.top, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <ResourceCard
              resource={item}
              downloadState={downloads[item._id]}
              onView={handleViewAction}
              onDownloadAction={handleDownloadAction}
              onOptions={setActiveOptionsResource}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                {isError ? 'Erreur lors du chargement' : 'Aucune ressource disponible'}
              </Text>
              <Pressable style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={refetch}>
                <Text style={[styles.retryText, { color: theme.colors.surface }]}>Reessayer</Text>
              </Pressable>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        />
      )}

      {/* Les Modales d'Action */}
      <ResourceOptionsModal
        visible={!!activeOptionsResource}
        resource={activeOptionsResource}
        onClose={() => setActiveOptionsResource(null)}
        isMyResource={activeOptionsResource?.uploadedBy?._id === currentUserId}
        onShare={async () => {
          const url = activeOptionsResource.fileUrl || activeOptionsResource.url;
          if (url && await Sharing.isAvailableAsync()) await Sharing.shareAsync(url);
          setActiveOptionsResource(null);
        }}
        onSave={async () => {
          try { await toggleFavorite(activeOptionsResource._id).unwrap(); } catch (e) {}
          setActiveOptionsResource(null);
        }}
        onEdit={() => {
          setEditingResource(activeOptionsResource);
          setActiveOptionsResource(null);
        }}
        onDelete={() => {
          setResourceToDelete(activeOptionsResource);
          setActiveOptionsResource(null);
        }}
        onReport={() => {
          setReportingResource(activeOptionsResource);
          setActiveOptionsResource(null);
        }}
      />

      <EditResourceModal
        visible={!!editingResource}
        resource={editingResource}
        onClose={() => setEditingResource(null)}
      />

      <ReportResourceModal
        visible={!!reportingResource}
        resource={reportingResource}
        onClose={() => setReportingResource(null)}
      />

      <DocumentViewerModal
        visible={!!activeDocument}
        onClose={() => setActiveDocument(null)}
        resource={activeDocument}
        token={token}
      />

      {/* Confirmation de Suppression (Design System strict, sans alert natif) */}
      <BottomSheet isVisible={!!resourceToDelete} onClose={() => setResourceToDelete(null)}>
        <View style={styles.deleteConfirmContainer}>
          <View style={styles.deleteIconBox}>
            <Trash2 color={theme.colors.error} size={32} />
          </View>
          <Text style={[styles.deleteConfirmTitle, { color: theme.colors.text }]}>Supprimer ce document ?</Text>
          <Text style={[styles.deleteConfirmText, { color: theme.colors.textMuted }]}>
            Cette action est irreversible. Le document "{resourceToDelete?.title}" sera definitivement efface du serveur.
          </Text>
          <View style={styles.deleteConfirmActions}>
            <Pressable 
              style={[styles.cancelBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} 
              onPress={() => setResourceToDelete(null)}
              disabled={isDeleting}
            >
              <Text style={[styles.cancelBtnText, { color: theme.colors.text }]}>Annuler</Text>
            </Pressable>
            <Pressable 
              style={[styles.confirmDeleteBtn, { backgroundColor: theme.colors.error }]} 
              onPress={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmDeleteText}>Oui, supprimer</Text>
              )}
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </View> 
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  retryText: { fontSize: 14, fontWeight: '700' },
  
  // Styles pour la modale de suppression interne
  deleteConfirmContainer: { paddingHorizontal: 24, paddingBottom: 30, paddingTop: 10, alignItems: 'center' },
  deleteIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(235, 87, 87, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  deleteConfirmTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  deleteConfirmText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  deleteConfirmActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, height: 50, borderRadius: 25, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '700' },
  confirmDeleteBtn: { flex: 1, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  confirmDeleteText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' }
});