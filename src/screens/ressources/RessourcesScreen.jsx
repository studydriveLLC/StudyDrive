import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, DeviceEventEmitter, RefreshControl, Platform } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { useSelector, useDispatch } from 'react-redux';
import AnimatedHeader from '../../components/navigation/AnimatedHeader';
import SkeletonResourceCard from '../../components/ressources/SkeletonResourceCard';
import ResourceCard from '../../components/ressources/ResourceCard';
import ResourceOptionsModal from '../../components/ressources/ResourceOptionsModal';
import DocumentViewerModal from '../../components/ressources/DocumentViewerModal';
import SmartRefreshOverlay from '../../components/ui/SmartRefreshOverlay';
import { useAppTheme } from '../../theme/theme';
import socketService from '../../services/socketService';
import { 
  resourceApiSlice,
  useGetResourcesQuery, 
  useDeleteResourceMutation, 
  useLogDownloadMutation,
  useLogViewMutation,
  useGetResourceQuery,
  useToggleFavoriteMutation,
  useReportResourceMutation
} from '../../store/api/resourceApiSlice';

export default function RessourcesScreen({ navigation }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const listRef = useRef(null);
  const isFetchingRef = useRef(false);
  const dispatch = useDispatch();

  const token = useSelector((state) => state.auth?.token);

  const [downloads, setDownloads] = useState({});
  const [activeOptionsResource, setActiveOptionsResource] = useState(null);
  const [activeDocumentUrl, setActiveDocumentUrl] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSmartRefreshing, setIsSmartRefreshing] = useState(false);
  const [activeViewId, setActiveViewId] = useState(null);

  const { data: resources = [], isLoading, isError, refetch } = useGetResourcesQuery({ page: 1, limit: 20 });
  useGetResourceQuery(activeViewId, { skip: !activeViewId });
  
  const [logDownload] = useLogDownloadMutation();
  const [logView] = useLogViewMutation();
  const [deleteResource] = useDeleteResourceMutation();
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [reportResource] = useReportResourceMutation();

  const currentUserId = navigation.getState()?.routes?.find((r) => r.name === 'Main')?.params?.user?._id;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    let socketInstance;

    const setupLiveResources = async () => {
      try {
        socketInstance = await socketService.connect();

        const handleStats = (data) => {
          dispatch(
            resourceApiSlice.util.updateQueryData('getResources', { page: 1, limit: 20 }, (draft) => {
              const resource = draft.find(r => String(r._id) === String(data.id));
              if (resource) {
                if (data.views !== undefined) resource.views = data.views;
                if (data.downloads !== undefined) resource.downloads = data.downloads;
              }
            })
          );
        };

        const handleNew = (newResource) => {
          dispatch(
            resourceApiSlice.util.updateQueryData('getResources', { page: 1, limit: 20 }, (draft) => {
              const exists = draft.find(r => String(r._id) === String(newResource._id));
              if (!exists) draft.unshift(newResource);
            })
          );
        };

        socketInstance.on('resourceStatsUpdated', handleStats);
        socketInstance.on('newResource', handleNew);

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
      if (event.routeName !== 'Ressources') return;
      if (isFetchingRef.current) return;
      
      isFetchingRef.current = true;
      setIsSmartRefreshing(true);

      if (listRef.current) {
        if (typeof listRef.current.scrollToOffset === 'function') {
          listRef.current.scrollToOffset({ offset: 0, animated: true });
        } else if (listRef.current.getNode && typeof listRef.current.getNode().scrollToOffset === 'function') {
          listRef.current.getNode().scrollToOffset({ offset: 0, animated: true });
        }
      }
      
      try {
        await refetch();
      } catch (error) {
        console.log('Erreur silencieuse refetch', error);
      } finally {
        setIsSmartRefreshing(false);
        isFetchingRef.current = false;
      }
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
    try {
      await logView(resource._id).unwrap();
    } catch (error) {
      console.log('Erreur log vue', error);
    }

    const format = resource.format?.toLowerCase();
    const supportedFormats = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'];

    if (supportedFormats.includes(format)) {
      setActiveDocumentUrl(fileUrl);
    } else {
      try {
        await WebBrowser.openBrowserAsync(fileUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          toolbarColor: theme.colors.background,
        });
      } catch (error) {
        console.log('Erreur ouverture WebBrowser:', error);
      }
    }
  };

  const handleDownloadAction = async (resource) => {
    let fileUrl = resource.fileUrl || resource.url || resource.tempFilePath;
    if (!fileUrl) return;
    
    if (downloads[resource._id]?.status === 'downloading') return;

    const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000';
    const isLocalPath = !fileUrl.startsWith('http');
    
    if (isLocalPath) {
      fileUrl = `${rawBaseUrl.replace(/\/$/, '')}/${fileUrl.replace(/^\//, '')}`;
    }

    setDownloads(prev => ({ ...prev, [resource._id]: { status: 'downloading', progress: 0 } }));

    try {
      const safeTitle = (resource.title || 'Document_LokoNet').replace(/[^a-zA-Z0-9]/g, '_');
      const ext = resource.format || 'pdf';
      const fileName = `${safeTitle}.${ext}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      const options = {};
      const isOurBackend = fileUrl.includes(rawBaseUrl) || fileUrl.includes('192.168.') || fileUrl.includes('localhost');
      
      if (isOurBackend) {
        options.headers = { Authorization: `Bearer ${token}` };
      }

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          setDownloads(prev => ({ ...prev, [resource._id]: { status: 'idle', progress: 0 } }));
          return;
        }

        const downloadResumable = FileSystem.createDownloadResumable(
          fileUrl, fileUri, options,
          (progressEvent) => {
            const progress = (progressEvent.totalBytesWritten / progressEvent.totalBytesExpectedToWrite) * 100;
            setDownloads(prev => ({ ...prev, [resource._id]: { status: 'downloading', progress: isNaN(progress) ? 50 : progress } }));
          }
        );

        const result = await downloadResumable.downloadAsync();

        if (result && result.status < 400) {
          const base64Data = await FileSystem.readAsStringAsync(result.uri, { encoding: FileSystem.EncodingType.Base64 });
          const savedUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/octet-stream');
          await FileSystem.writeAsStringAsync(savedUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
          await FileSystem.deleteAsync(result.uri, { idempotent: true });

          setDownloads(prev => ({ ...prev, [resource._id]: { status: 'success', progress: 100 } }));
          await logDownload(resource._id).unwrap();
        } else {
          throw new Error(`Erreur serveur HTTP ${result?.status}`);
        }
      } else {
        const downloadResumable = FileSystem.createDownloadResumable(
          fileUrl, fileUri, options,
          (progressEvent) => {
            const progress = (progressEvent.totalBytesWritten / progressEvent.totalBytesExpectedToWrite) * 100;
            setDownloads(prev => ({ ...prev, [resource._id]: { status: 'downloading', progress: isNaN(progress) ? 50 : progress } }));
          }
        );

        const result = await downloadResumable.downloadAsync();

        if (result && result.status < 400) {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(result.uri, { dialogTitle: 'Enregistrer le document', UTI: 'public.item' });
          }
          setDownloads(prev => ({ ...prev, [resource._id]: { status: 'success', progress: 100 } }));
          await logDownload(resource._id).unwrap();
        } else {
          throw new Error(`Erreur serveur HTTP ${result?.status}`);
        }
      }

      setTimeout(() => {
        setDownloads(prev => ({ ...prev, [resource._id]: { status: 'idle', progress: 0 } }));
      }, 3000);

    } catch (error) {
      console.log('Erreur telechargement native:', error);
      setDownloads(prev => ({ ...prev, [resource._id]: { status: 'idle', progress: 0 } }));
    }
  };

  const renderItem = ({ item }) => {
    return (
      <ResourceCard
        resource={item}
        downloadState={downloads[item._id]}
        onView={handleViewAction}
        onDownloadAction={handleDownloadAction}
        onOptions={setActiveOptionsResource}
      />
    );
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
          renderItem={renderItem}
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
          setActiveOptionsResource(null);
        }}
        onDelete={async () => {
          try { await deleteResource(activeOptionsResource._id).unwrap(); } catch (e) {}
          setActiveOptionsResource(null);
        }}
        onReport={async () => {
          try { await reportResource(activeOptionsResource._id).unwrap(); } catch (e) {}
          setActiveOptionsResource(null);
        }}
      />

      <DocumentViewerModal
        visible={!!activeDocumentUrl}
        onClose={() => setActiveDocumentUrl(null)}
        resourceUrl={activeDocumentUrl}
      />
    </View> 
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  retryText: { fontSize: 14, fontWeight: '700' },
});