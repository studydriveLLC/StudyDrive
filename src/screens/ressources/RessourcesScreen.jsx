// src/screens/ressources/RessourcesScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, DeviceEventEmitter, RefreshControl, AppState, Share } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';

import AnimatedHeader from '../../components/navigation/AnimatedHeader';
import SkeletonResourceCard from '../../components/ressources/SkeletonResourceCard';
import ResourceCard from '../../components/ressources/ResourceCard';
import ResourceOptionsModal from '../../components/ressources/ResourceOptionsModal';
import DocumentViewerModal from '../../components/ressources/DocumentViewerModal';
import EditResourceModal from '../../components/ressources/EditResourceModal';
import ReportResourceModal from '../../components/ressources/ReportResourceModal';
import DeleteResourceModal from '../../components/ressources/DeleteResourceModal';
import SmartRefreshOverlay from '../../components/ui/SmartRefreshOverlay';

import { useAppTheme } from '../../theme/theme';
import socketService from '../../services/socketService';
import { showSuccessToast } from '../../store/slices/uiSlice';
import { 
  useGetResourcesQuery, useDeleteResourceMutation, 
  useLogDownloadMutation, useLogViewMutation, useGetResourceQuery, 
  useToggleFavoriteMutation 
} from '../../store/api/resourceApiSlice';

// IMPORT DES CUSTOM HOOKS
import useResourceSocketEvents from '../../hooks/useResourceSocketEvents';
import useResourceFileManager from '../../hooks/useResourceFileManager';

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

  const [activeOptionsResource, setActiveOptionsResource] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSmartRefreshing, setIsSmartRefreshing] = useState(false);

  const [editingResource, setEditingResource] = useState(null);
  const [reportingResource, setReportingResource] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);

  useEffect(() => { queryArgsRef.current = queryArgs; }, [queryArgs]);

  const { data: resources = [], isLoading, isError, refetch } = useGetResourcesQuery(queryArgs);
  
  const [logDownload] = useLogDownloadMutation();
  const [logView] = useLogViewMutation();
  const [deleteResource, { isLoading: isDeleting }] = useDeleteResourceMutation();
  const [toggleFavorite, { isLoading: isTogglingFavorite }] = useToggleFavoriteMutation();

  // CUSTOM HOOKS
  useResourceSocketEvents(queryArgsRef);
  const { downloads, activeDocument, setActiveDocument, activeViewId, handleViewAction, handleDownloadAction } = useResourceFileManager(token, theme, logView, logDownload);

  useGetResourceQuery(activeViewId, { skip: !activeViewId });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await socketService.forceReconnect();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') socketService.forceReconnect();
    });
    return () => subscription.remove();
  }, []);

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

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    try {
      await deleteResource(resourceToDelete._id).unwrap();
      dispatch(showSuccessToast({ message: "Le document a ete supprime avec succes." }));
      setResourceToDelete(null);
    } catch (error) {
      console.log('Erreur de suppression:', error);
    }
  };

  const handleShareResource = async () => {
    if (!activeOptionsResource) return;
    let fileUrl = activeOptionsResource.fileUrl || activeOptionsResource.url || activeOptionsResource.tempFilePath;
    if (fileUrl && !fileUrl.startsWith('http')) {
      const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000';
      fileUrl = `${rawBaseUrl.replace(/\/$/, '')}/${fileUrl.replace(/^\//, '')}`;
    }
    try {
      await Share.share({
        message: `📚 Document LokoNet : *${activeOptionsResource.title}*\nNiveau : ${activeOptionsResource.level || 'Non spécifié'}\n\nLien : ${fileUrl}`,
        title: activeOptionsResource.title,
      });
    } catch (error) {} 
    finally { setActiveOptionsResource(null); }
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

      <ResourceOptionsModal
        visible={!!activeOptionsResource}
        resource={activeOptionsResource}
        onClose={() => setActiveOptionsResource(null)}
        isMyResource={activeOptionsResource?.uploadedBy?._id === currentUserId}
        isSaving={isTogglingFavorite}
        onShare={handleShareResource}
        onSave={async () => {
          try { 
            const result = await toggleFavorite(activeOptionsResource._id).unwrap();
            dispatch(showSuccessToast({ message: result.message }));
          } catch (e) {}
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

      <EditResourceModal visible={!!editingResource} resource={editingResource} onClose={() => setEditingResource(null)} />
      <ReportResourceModal visible={!!reportingResource} resource={reportingResource} onClose={() => setReportingResource(null)} />
      <DocumentViewerModal visible={!!activeDocument} onClose={() => setActiveDocument(null)} resource={activeDocument} token={token} />
      
      {/* MODALE DE SUPPRESSION EXTRAITE */}
      <DeleteResourceModal 
        visible={!!resourceToDelete} 
        onClose={() => setResourceToDelete(null)} 
        onConfirm={handleConfirmDelete} 
        resourceTitle={resourceToDelete?.title} 
        isLoading={isDeleting} 
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