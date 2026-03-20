import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedHeader from '../../components/navigation/AnimatedHeader';
import SkeletonResourceCard from '../../components/ressources/SkeletonResourceCard';
import ResourceCard from '../../components/ressources/ResourceCard';
import ResourceOptionsModal from '../../components/ressources/ResourceOptionsModal';
import { useAppTheme } from '../../theme/theme';

const MOCK_RESOURCES = [
  { id: '1', title: 'Cours Complet - Microbiologie Alimentaire', description: 'Fiches de révision détaillées sur les pathogènes alimentaires et les normes de contrôle qualité en industrie agroalimentaire.', format: 'pdf', fileSize: 4.2, level: 'BTS 2ème Année', category: 'IACC', views: 1240, downloads: 856, author: { pseudo: 'Kevy', avatar: null } },
  { id: '2', title: 'TP : Techniques de Contrôle Qualité', description: 'Protocole expérimental complet pour les analyses physico-chimiques en laboratoire de contrôle.', format: 'docx', fileSize: 1.8, level: 'BTS 1ère Année', category: 'Laboratoire', views: 890, downloads: 420, author: { pseudo: 'Marcio_ADM', avatar: 'https://i.pravatar.cc/150?img=11' } },
  { id: '3', title: 'Résumé - Biochimie Structurale', description: 'Synthèse claire sur les glucides, lipides et protéines. Idéal pour préparer les examens de fin de semestre.', format: 'pdf', fileSize: 3.5, level: 'Licence 3', category: 'Biochimie', views: 342, downloads: 112, author: { pseudo: 'SophieL', avatar: 'https://i.pravatar.cc/150?img=5' } }
];

export default function RessourcesScreen({ navigation }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [downloads, setDownloads] = useState({});
  const [activeOptionsResource, setActiveOptionsResource] = useState(null);
  
  const activeIntervals = useRef({});
  const resetTimeouts = useRef({});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => {
      clearTimeout(timer);
      Object.values(activeIntervals.current).forEach(clearInterval);
      Object.values(resetTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const handleDownloadAction = (resource) => {
    const currentStatus = downloads[resource.id]?.status;

    // 1. Annulation si déjà en cours de téléchargement
    if (currentStatus === 'downloading') {
      clearInterval(activeIntervals.current[resource.id]);
      setDownloads(prev => ({ ...prev, [resource.id]: { status: 'idle', progress: 0 } }));
      return;
    }

    // 2. Si on relance un téléchargement (même s'il était en 'success')
    // On nettoie l'éventuel timeout de reset auto
    if (resetTimeouts.current[resource.id]) {
      clearTimeout(resetTimeouts.current[resource.id]);
    }

    setDownloads(prev => ({ ...prev, [resource.id]: { status: 'downloading', progress: 0 } }));
    
    let simulatedProgress = 0;
    activeIntervals.current[resource.id] = setInterval(() => {
      simulatedProgress += Math.random() * 15 + 5;
      
      if (simulatedProgress >= 100) {
        clearInterval(activeIntervals.current[resource.id]);
        setDownloads(prev => ({ ...prev, [resource.id]: { status: 'success', progress: 100 } }));
        
        // AUTO-RESET : Après 3 secondes, on remet le bouton à zéro pour permettre de re-télécharger
        resetTimeouts.current[resource.id] = setTimeout(() => {
          setDownloads(prev => ({ ...prev, [resource.id]: { status: 'idle', progress: 0 } }));
        }, 3000);

      } else {
        setDownloads(prev => ({ ...prev, [resource.id]: { status: 'downloading', progress: simulatedProgress } }));
      }
    }, 400);
  };

  const handleOptions = (resource) => {
    setActiveOptionsResource(resource);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AnimatedHeader scrollY={scrollY} title="Ressources" navigation={navigation} />
      
      <Animated.FlatList
        data={isLoading ? [1, 2, 3] : MOCK_RESOURCES}
        keyExtractor={(item) => isLoading ? item.toString() : item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 140 + insets.top, paddingBottom: 100 }}
        renderItem={({ item }) => {
          if (isLoading) return <SkeletonResourceCard />;
          return (
            <ResourceCard 
              resource={item} 
              downloadState={downloads[item.id]}
              onDownloadAction={handleDownloadAction}
              onOptions={handleOptions}
            />
          );
        }}
      />

      {/* Modale des 3 points injectée à la racine pour un affichage parfait */}
      <ResourceOptionsModal 
        visible={!!activeOptionsResource}
        resource={activeOptionsResource}
        onClose={() => setActiveOptionsResource(null)}
        isMyResource={activeOptionsResource?.author?.pseudo === 'Kevy'} // Utilisation dynamique de ton pseudo
        onShare={() => { console.log('Partage'); setActiveOptionsResource(null); }}
        onSave={() => { console.log('Sauvegarde'); setActiveOptionsResource(null); }}
        onDelete={() => { console.log('Suppression'); setActiveOptionsResource(null); }}
        onReport={() => { console.log('Signalement'); setActiveOptionsResource(null); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});