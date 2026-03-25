// src/screens/profile/MyResourcesScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
// AJOUT DE "Share" DEPUIS REACT NATIVE
import { View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator, Share } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { useDispatch } from 'react-redux';

import ResourceCard from '../../components/ressources/ResourceCard';
import ResourceOptionsModal from '../../components/ressources/ResourceOptionsModal';
import EditResourceModal from '../../components/ressources/EditResourceModal';
import BottomSheet from '../../components/ui/BottomSheet';
import ScrollToTopButton from '../../components/ui/ScrollToTopButton';
import { useAppTheme } from '../../theme/theme';
import socketService from '../../services/socketService';
import { showSuccessToast } from '../../store/slices/uiSlice';
import { 
  resourceApiSlice, 
  useGetMyResourcesQuery, 
  useDeleteResourceMutation 
} from '../../store/api/resourceApiSlice';

export default function MyResourcesScreen({ navigation }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  const scrollY = useSharedValue(0);
  const listRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const [activeOptionsResource, setActiveOptionsResource] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);

  const { data: myResources = [], isLoading, isError, refetch } = useGetMyResourcesQuery();
  const [deleteResource, { isLoading: isDeleting }] = useDeleteResourceMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const handleScrollToTop = () => {
    if (listRef.current) {
      if (typeof listRef.current.scrollToOffset === 'function') {
        listRef.current.scrollToOffset({ offset: 0, animated: true });
      } else if (listRef.current.getNode && typeof listRef.current.getNode().scrollToOffset === 'function') {
        listRef.current.getNode().scrollToOffset({ offset: 0, animated: true });
      }
    }
  };

  useEffect(() => {
    let socketInstance;
    const setupLiveStats = async () => {
      socketInstance = await socketService.connect();
      
      socketInstance.on('resourceStatsUpdated', (data) => {
        dispatch(resourceApiSlice.util.updateQueryData('getMyResources', undefined, (draft) => {
          const resource = draft.find(r => String(r._id) === String(data.id));
          if (resource) {
            if (data.views !== undefined) resource.views = data.views;
            if (data.downloads !== undefined) resource.downloads = data.downloads;
          }
        }));
      });

      socketInstance.on('resourceUpdated', (updatedResource) => {
        dispatch(resourceApiSlice.util.updateQueryData('getMyResources', undefined, (draft) => {
          const index = draft.findIndex(r => String(r._id) === String(updatedResource._id));
          if (index !== -1) draft[index] = { ...draft[index], ...updatedResource };
        }));
      });

      socketInstance.on('resourceDeleted', (data) => {
        dispatch(resourceApiSlice.util.updateQueryData('getMyResources', undefined, (draft) => {
          return draft.filter(r => String(r._id) !== String(data.id));
        }));
      });
    };

    setupLiveStats();

    return () => {
      if (socketInstance) {
        socketInstance.off('resourceStatsUpdated');
        socketInstance.off('resourceUpdated');
        socketInstance.off('resourceDeleted');
      }
    };
  }, [dispatch]);

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    try {
      await deleteResource(resourceToDelete._id).unwrap();
      dispatch(showSuccessToast({ message: "Votre document a ete definitivement supprime." }));
      setResourceToDelete(null);
    } catch (error) {
      console.log('Erreur de suppression:', error);
    }
  };

  // NOUVELLE LOGIQUE DE PARTAGE NATIVE
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
    } catch (error) {
      console.log('Erreur de partage:', error);
    } finally {
      setActiveOptionsResource(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={15}>
          <ArrowLeft color={theme.colors.text} size={28} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Mes documents</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <Animated.FlatList
          ref={listRef}
          data={myResources}
          keyExtractor={(item) => item._id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <ResourceCard
              resource={item}
              onOptions={setActiveOptionsResource}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                {isError ? 'Erreur lors du chargement' : 'Vous n avez publie aucun document.'}
              </Text>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        />
      )}

      <ScrollToTopButton scrollY={scrollY} onPress={handleScrollToTop} />

      <ResourceOptionsModal
        visible={!!activeOptionsResource}
        resource={activeOptionsResource}
        onClose={() => setActiveOptionsResource(null)}
        isMyResource={true} 
        onShare={handleShareResource} // APPEL DE LA NOUVELLE FONCTION ICI
        onEdit={() => {
          setEditingResource(activeOptionsResource);
          setActiveOptionsResource(null);
        }}
        onDelete={() => {
          setResourceToDelete(activeOptionsResource);
          setActiveOptionsResource(null);
        }}
      />

      <EditResourceModal
        visible={!!editingResource}
        resource={editingResource}
        onClose={() => setEditingResource(null)}
      />

      <BottomSheet isVisible={!!resourceToDelete} onClose={() => setResourceToDelete(null)}>
        <View style={styles.deleteConfirmContainer}>
          <View style={styles.deleteIconBox}>
            <Trash2 color={theme.colors.error} size={32} />
          </View>
          <Text style={[styles.deleteConfirmTitle, { color: theme.colors.text }]}>Supprimer votre publication ?</Text>
          <Text style={[styles.deleteConfirmText, { color: theme.colors.textMuted }]}>
            Cette action retirera definitivement le document "{resourceToDelete?.title}" de la plateforme.
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 100 },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
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