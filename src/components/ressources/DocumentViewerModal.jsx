import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomSheet from '../ui/BottomSheet';
import { useAppTheme } from '../../theme/theme';

export default function DocumentViewerModal({ visible, onClose, resourceUrl }) {
  const theme = useAppTheme();
  const [retryKey, setRetryKey] = useState(1);
  
  useEffect(() => {
    if (visible) {
      setRetryKey(1);
    }
  }, [visible]);

  if (!resourceUrl) return null;

  const secureUrl = resourceUrl.replace('http://', 'https://');
  const isImage = secureUrl.match(/\.(jpeg|jpg|png|gif)$/i) || secureUrl.includes('image');
  const isOfficeDoc = secureUrl.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);
  const isPdf = secureUrl.match(/\.pdf$/i);
  
  let viewerUrl = secureUrl;
  if (!isImage) {
    if (isOfficeDoc) {
      viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(secureUrl)}`;
    } else if (isPdf && Platform.OS === 'ios') {
      viewerUrl = secureUrl;
    } else {
      viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(secureUrl)}`;
    }
  }

  const handleWebViewError = () => {
    if (!isPdf || Platform.OS === 'ios') return;
    setTimeout(() => {
      setRetryKey(prev => prev + 1);
    }, 1500);
  };

  return (
    <BottomSheet isVisible={visible} onClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {isImage ? (
          <Image 
            source={{ uri: viewerUrl }} 
            style={styles.imageViewer} 
            resizeMode="contain" 
          />
        ) : (
          <WebView
            key={retryKey}
            source={{ uri: viewerUrl }}
            style={styles.webview}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            originWhitelist={['*']}
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
            onError={handleWebViewError}
            onHttpError={handleWebViewError}
          />
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
    flex: 1,
    backgroundColor: '#FFFFFF'
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  }
});