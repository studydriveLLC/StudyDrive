import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';

export default function DocumentViewerModal({ visible, onClose, resourceUrl }) {
  const theme = useAppTheme();
  // On utilise un timestamp pour le retryKey. Il servira aussi de Cache-Buster.
  const [retryKey, setRetryKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (visible) {
      setRetryKey(Date.now());
      setIsLoading(true);
      
      // On passe le timeout à 8 secondes, car l'API de Microsoft ou Google 
      // peut prendre un peu de temps pour générer le premier aperçu.
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, resourceUrl]);

  if (!resourceUrl) return null;

  const isLocalUrl = resourceUrl.includes('192.168.') || resourceUrl.includes('localhost');
  const finalUrl = isLocalUrl ? resourceUrl : resourceUrl.replace('http://', 'https://');
  const urlWithoutParams = finalUrl.split('?')[0];

  const isImage = urlWithoutParams.match(/\.(jpeg|jpg|png|gif)$/i) || finalUrl.includes('image') || finalUrl.includes('res.cloudinary.com/image');
  
  let viewerUrl = finalUrl;
  let isLocalDoc = false;

  // STRATÉGIE 1 : Le Cache Buster
  // On ajoute un paramètre unique à l'URL cible pour forcer Google et iOS à ignorer leur cache 401 précédent
  const targetUrl = finalUrl + (finalUrl.includes('?') ? '&cb=' : '?cb=') + retryKey;
  const encodedUrl = encodeURIComponent(targetUrl);

  if (!isImage) {
    if (isLocalUrl) {
      isLocalDoc = true;
    } else if (Platform.OS === 'android') {
      
      // STRATÉGIE 2 : Le Routeur de Format
      const isOfficeDoc = urlWithoutParams.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);
      
      if (isOfficeDoc) {
        // Microsoft Office Viewer : Extrêmement stable pour les formats Office
        viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
      } else {
        // Google Docs Viewer : Excellent pour les PDF
        viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;
      }
    } else {
      // Sur iOS, le moteur WebKit lit parfaitement les PDF et DOCX nativement.
      // Mais on utilise "targetUrl" pour bénéficier du Cache-Buster et éviter l'écran blanc.
      viewerUrl = targetUrl;
    }
  }

  const handleWebViewError = () => {
    setTimeout(() => {
      setRetryKey(Date.now());
    }, 1500);
  };

  // STRATÉGIE 3 : Détection d'erreur renforcée
  const injectedJavaScript = `
    setTimeout(function() {
      try {
        var body = document.body;
        if (!body) return;
        
        // 1. Détection de page 100% blanche
        var isEmpty = body.innerText.trim().length === 0 && body.children.length === 0;
        
        // 2. Détection des classes CSS d'erreur typiques de Google Docs Viewer
        var isGoogleError = document.querySelector('.ndfHFb-c4YZDc-Wrql6b') || document.querySelector('.ndfHFb-c4YZDc-GSQQnc-LgbsSe');
        
        if (isEmpty || isGoogleError) {
          window.ReactNativeWebView.postMessage('BLANK_PAGE');
        }
      } catch(e) {}
    }, 3500);
    true;
  `;

  const onMessage = (event) => {
    if (event.nativeEvent.data === 'BLANK_PAGE') {
      setIsLoading(true);
      setRetryKey(Date.now()); // Déclenche un nouveau rendu ET génère un nouveau Cache-Buster
    }
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
            scalesPageToFit={true}
            injectedJavaScript={injectedJavaScript}
            onMessage={onMessage}
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
            <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
              Ouverture du document...
            </Text>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700'
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