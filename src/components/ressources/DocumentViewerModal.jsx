import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';

export default function DocumentViewerModal({ visible, onClose, resourceUrl }) {
  const theme = useAppTheme();
  const [retryKey, setRetryKey] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (visible) {
      setRetryKey(1);
      setIsLoading(true);
    }
  }, [visible]);

  if (!resourceUrl) return null;

  const isLocalUrl = resourceUrl.includes('192.168.') || resourceUrl.includes('localhost');
  const finalUrl = isLocalUrl ? resourceUrl : resourceUrl.replace('http://', 'https://');
  const urlWithoutParams = finalUrl.split('?')[0];

  const isImage = urlWithoutParams.match(/\.(jpeg|jpg|png|gif)$/i) || finalUrl.includes('image') || finalUrl.includes('res.cloudinary.com/image');
  
  let viewerUrl = finalUrl;
  let isLocalDoc = false;

  if (!isImage) {
    if (isLocalUrl) {
      isLocalDoc = true;
    } else {
      viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(finalUrl)}`;
    }
  }

  const handleWebViewError = () => {
    setTimeout(() => {
      setRetryKey(prev => prev + 1);
    }, 1000);
  };

  return (
    <BottomSheet isVisible={visible} onClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {isImage ? (
          <Image 
            source={{ uri: viewerUrl }} 
            style={styles.imageViewer} 
            resizeMode="contain"
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
          />
        ) : isLocalDoc ? (
          <View style={[styles.localDocContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.localDocText, { color: theme.colors.text }]}>
              Apercu indisponible pour les documents en developpement local.
            </Text>
            <Text style={[styles.localDocSubtext, { color: theme.colors.textMuted }]}>
              Veuillez utiliser le bouton de telechargement.
            </Text>
          </View>
        ) : (
          <WebView
            key={retryKey}
            source={{ uri: viewerUrl }}
            style={[styles.webview, { backgroundColor: theme.colors.surface }]}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            originWhitelist={['*']}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            renderLoading={() => null} 
            onError={handleWebViewError}
            onHttpError={handleWebViewError}
          />
        )}
        
        {isLoading && !isLocalDoc && (
          <View style={[styles.loader, { backgroundColor: theme.colors.surface }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { 
    height: 500, 
    width: '100%', 
    overflow: 'hidden', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20 
  },
  webview: { 
    flex: 1
  },
  imageViewer: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  loader: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  localDocContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  localDocText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10
  },
  localDocSubtext: {
    fontSize: 14,
    textAlign: 'center'
  }
});