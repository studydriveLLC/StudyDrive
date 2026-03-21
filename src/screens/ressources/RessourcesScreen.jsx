import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, DeviceEventEmitter, RefreshControl } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedHeader from '../../components/navigation/AnimatedHeader';
import SkeletonResourceCard from '../../components/ressources/SkeletonResourceCard';
import ResourceCard from '../../components/ressources/ResourceCard';
import ResourceOptionsModal from '../../components/ressources/ResourceOptionsModal';
import { useAppTheme } from '../../theme/theme';
import { useGetResourcesQuery, useDeleteResourceMutation } from '../../store/api/resourceApiSlice';

export default function RessourcesScreen({ navigation }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const listRef = useRef(null);

  const [downloads, setDownloads] = useState({});
  const [activeOptionsResource, setActiveOptionsResource] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const activeIntervals = useRef({});
  const resetTimeouts = useRef({});

  const {
    data: resources = [],
    isLoading,
    isError,
    refetch,
  } = useGetResourcesQuery({ page: 1, limit: 20 });

  const [deleteResource] = useDeleteResourceMutation();
  const currentUserId = navigation.getState()?.routes?.find(
    (r) => r.name === 'Main'
  )?.params?.user?._id;

  useEffect(() => {
    return () => {
      Object.values(activeIntervals.current).forEach(clearInterval);
      Object.values(resetTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SMART_TAB_PRESS', (event) => {
      if (event.routeName !== 'Ressources') return;
      if (listRef.current) {
        listRef.current.scrollToOffset({ offset: 0, animated: true });
      }
      refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleDownloadAction = (resource) => {
    const currentStatus = downloads[resource.id]?.status;

    if (currentStatus === 'downloading') {
      clearInterval(activeIntervals.current[resource.id]);
      setDownloads((prev) => ({
        ...prev,
        [resource.id]: { status: 'idle', progress: 0 },
      }));
      return;
    }

    if (resetTimeouts.current[resource.id]) {
      clearTimeout(resetTimeouts.current[resource.id]);
    }

    setDownloads((prev) => ({
      ...prev,
      [resource.id]: { status: 'downloading', progress: 0 },
    }));

    let simulatedProgress = 0;
    activeIntervals.current[resource.id] = setInterval(() => {
      simulatedProgress += Math.random() * 15 + 5;

      if (simulatedProgress >= 100) {
        clearInterval(activeIntervals.current[resource.id]);
        setDownloads((prev) => ({
          ...prev,
          [resource.id]: { status: 'success', progress: 100 },
        }));

        resetTimeouts.current[resource.id] = setTimeout(() => {
          setDownloads((prev) => ({
            ...prev,
            [resource.id]: { status: 'idle', progress: 0 },
          }));
        }, 3000);
      } else {
        setDownloads((prev) => ({
          ...prev,
          [resource.id]: { status: 'downloading', progress: simulatedProgress },
        }));
      }
    }, 400);
  };

  const handleOptions = (resource) => {
    setActiveOptionsResource(resource);
  };

  const handleDelete = async () => {
    if (!activeOptionsResource) return;
    try {
      await deleteResource(activeOptionsResource._id).unwrap();
      setActiveOptionsResource(null);
    } catch (error) {
      console.log('Erreur suppression:', error);
    }
  };

  const isMyResource = activeOptionsResource?.uploadedBy?._id === currentUserId;

  const renderItem = ({ item }) => (
    <ResourceCard
      resource={item}
      downloadState={downloads[item._id]}
      onDownloadAction={handleDownloadAction}
      onOptions={handleOptions}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
        {isError ? 'Erreur lors du chargement' : 'Aucune ressource disponible'}
      </Text>
      <Pressable
        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
        onPress={refetch}
      >
        <Text style={[styles.retryText, { color: theme.colors.surface }]}>Reessayer</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AnimatedHeader scrollY={scrollY} title="Ressources" navigation={navigation} />

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}

      <ResourceOptionsModal
        visible={!!activeOptionsResource}
        resource={activeOptionsResource}
        onClose={() => setActiveOptionsResource(null)}
        isMyResource={isMyResource}
        onShare={() => {
          console.log('Partage');
          setActiveOptionsResource(null);
        }}
        onSave={() => {
          console.log('Sauvegarde');
          setActiveOptionsResource(null);
        }}
        onDelete={handleDelete}
        onReport={() => {
          console.log('Signalement');
          setActiveOptionsResource(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  retryText: { fontSize: 14, fontWeight: '700' },
});