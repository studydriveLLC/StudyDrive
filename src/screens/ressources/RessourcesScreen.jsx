import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, DeviceEventEmitter, RefreshControl } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import AnimatedHeader from '../../components/navigation/AnimatedHeader';
import SkeletonResourceCard from '../../components/ressources/SkeletonResourceCard';
import ResourceCard from '../../components/ressources/ResourceCard';
import ResourceOptionsModal from '../../components/ressources/ResourceOptionsModal';
import SmartRefreshOverlay from '../../components/ui/SmartRefreshOverlay';
import { useAppTheme } from '../../theme/theme';
import { 
  useGetResourcesQuery, 
  useDeleteResourceMutation, 
  useLogDownloadMutation,
  useGetResourceQuery
} from '../../store/api/resourceApiSlice';

export default function RessourcesScreen({ navigation }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const listRef = useRef(null);
  const isFetchingRef = useRef(false);

  const [downloads, setDownloads] = useState({});
  const [localStats, setLocalStats] = useState({});
  const [activeOptionsResource, setActiveOptionsResource] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSmartRefreshing, setIsSmartRefreshing] = useState(false);
  
  const [activeViewId, setActiveViewId] = useState(null);

  const { data: resources = [], isLoading, isError, refetch } = useGetResourcesQuery({ page: 1, limit: 20 });
  
  // Declencheur silencieux pour incrementer la vue cote backend
  useGetResourceQuery(activeViewId, { skip: !activeViewId });
  
  const [logDownload] = useLogDownloadMutation();
  const [deleteResource] = useDeleteResourceMutation();

  const currentUserId = navigation.getState()?.routes?.find((r) => r.name === 'Main')?.params?.user?._id;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SMART_TAB_PRESS', async (event) => {
      if (event.routeName !== 'Ressources') return;
      if (isFetchingRef.current) return;
      
      isFetchingRef.current = true;
      setIsSmartRefreshing(true);
      
      try {
        // 1. On attend que les donnees soient recuperees (avec retry automatique en fond)
        await refetch();
        
        // 2. Seulement apres le succes, on remonte l'ecran silencieusement
        if (listRef.current) {
          if (typeof listRef.current.scrollToOffset === 'function') {
            listRef.current.scrollToOffset({ offset: 0, animated: false });
          } else if (listRef.current.getNode && typeof listRef.current.getNode().scrollToOffset === 'function') {
            listRef.current.getNode().scrollToOffset({ offset: 0, animated: false });
          }
        }
      } catch (error) {
        console.log('Erreur silencieuse lors du rafraichissement des ressources', error);
      } finally {
        // 3. On coupe l'overlay
        setIsSmartRefreshing(false);
        isFetchingRef.current = false;
      }
    });
    return () => subscription.remove();
  }, [refetch]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const getOptimisticStats = (id, field, originalValue) => {
    if (localStats[id] && localStats[id][field] !== undefined) {
      return localStats[id][field];
    }
    return originalValue;
  };

  const handleViewAction = async (resource) => {
    const fileUrl = resource.fileUrl || resource.url || resource.tempFilePath;
    if (!fileUrl) return;

    setLocalStats(prev => ({
      ...prev,
      [resource._id]: { ...prev[resource._id], views: (resource.views || 0) + 1 }
    }));

    setActiveViewId(resource._id);
    
    try {
      await WebBrowser.openBrowserAsync(fileUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: theme.colors.background,
      });
    } catch (error) {
      console.log('Erreur ouverture:', error);
    }
  };

  const handleDownloadAction = async (resource) => {
    const fileUrl = resource.fileUrl || resource.url || resource.tempFilePath;
    if (!fileUrl) return;

    if (downloads[resource._id]?.status === 'downloading') return;

    setDownloads(prev => ({
      ...prev,
      [resource._id]: { status: 'downloading', progress: 0 },
    }));

    try {
      const fileName = `${resource.title.replace(/[^a-zA-Z0-9]/g, '_')}.${resource.format}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
          setDownloads(prev => ({
            ...prev,
            [resource._id]: { status: 'downloading', progress: isNaN(progress) ? 50 : progress },
          }));
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        setDownloads(prev => ({
          ...prev,
          [resource._id]: { status: 'success', progress: 100 },
        }));

        setLocalStats(prev => ({
          ...prev,
          [resource._id]: { ...prev[resource._id], downloads: (resource.downloads || 0) + 1 }
        }));

        await logDownload(resource._id).unwrap();

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri, {
            mimeType: 'application/octet-stream',
            dialogTitle: 'Enregistrer ou Partager la ressource',
          });
        }

        setTimeout(() => {
          setDownloads(prev => ({ ...prev, [resource._id]: { status: 'idle', progress: 0 } }));
        }, 3000);
      }
    } catch (error) {
      console.log('Erreur telechargement:', error);
      setDownloads(prev => ({ ...prev, [resource._id]: { status: 'idle', progress: 0 } }));
    }
  };

  const handleOptions = (resource) => {
    setActiveOptionsResource(resource);
  };

  const handleDelete = async () => {
    if (!activeOptionsResource) return;
    try {
      await deleteResource(activeOptionsResource._id).unwrap();
      setActiveOptionsResource(null);
    } catch (error) {}
  };

  const isMyResource = activeOptionsResource?.uploadedBy?._id === currentUserId;

  const renderItem = ({ item }) => {
    const optimisticResource = {
      ...item,
      views: getOptimisticStats(item._id, 'views', item.views),
      downloads: getOptimisticStats(item._id, 'downloads', item.downloads)
    };

    return (
      <ResourceCard
        resource={optimisticResource}
        downloadState={downloads[item._id]}
        onView={handleViewAction}
        onDownloadAction={handleDownloadAction}
        onOptions={handleOptions}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
        {isError ? 'Erreur lors du chargement' : 'Aucune ressource disponible'}
      </Text>
      <Pressable style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={refetch}>
        <Text style={[styles.retryText, { color: theme.colors.surface }]}>Reessayer</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AnimatedHeader scrollY={scrollY} title="Ressources" navigation={navigation} />
      <SmartRefreshOverlay isVisible={isSmartRefreshing} />

      {isLoading ? (
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
          ListEmptyComponent={renderEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        />
      )}

      <ResourceOptionsModal
        visible={!!activeOptionsResource}
        resource={activeOptionsResource}
        onClose={() => setActiveOptionsResource(null)}
        isMyResource={isMyResource}
        onShare={async () => {
          const fileUrl = activeOptionsResource.fileUrl || activeOptionsResource.url;
          if (fileUrl && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUrl);
          }
          setActiveOptionsResource(null);
        }}
        onSave={() => { setActiveOptionsResource(null); }}
        onDelete={handleDelete}
        onReport={() => { setActiveOptionsResource(null); }}
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