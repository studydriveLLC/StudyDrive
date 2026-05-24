// src/store/slices/apiSlice.js
// PASSERELLE RESEAU - Auto-Retry & Anti-Deadlock integres
// CSCSM Level: Bank Grade

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { Platform } from 'react-native';
import SecureStorageAdapter from '../secureStoreAdapter';
import { logout, setCredentials } from './authSlice';

const mutex = new Mutex();
const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || '';

if (!rawBaseUrl && __DEV__) {
  console.warn("ATTENTION: EXPO_PUBLIC_API_URL n'est pas defini dans le fichier .env !");
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const baseQuery = fetchBaseQuery({
  baseUrl: rawBaseUrl,
  timeout: 15000,
  prepareHeaders: async (headers, { getState, endpoint }) => {
    let token = getState().auth?.token;

    if (!token) {
      token = await SecureStorageAdapter.getItem('token');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const uploadEndpoints = ['uploadResource', 'uploadAvatar', 'uploadPostMedia'];
    if (uploadEndpoints.includes(endpoint)) {
      headers.delete('Content-Type');
    } else {
      headers.set('Accept', 'application/json');
    }

    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  
  const tokenBeforeRequest = api.getState().auth?.token;
  let requestUrl = typeof args === 'string' ? args : args?.url || '';
  
  // Enregistrement du temps de depart pour detecter la mise en veille de l'appareil
  const startTime = Date.now();
  let result = await baseQuery(args, api, extraOptions);
  const duration = Date.now() - startTime;

  // Logique de detection de veille / deconnexion Bank Grade (Yely)
  const wasSuspended = duration > 25000;
  const isBrowserHidden = Platform.OS === 'web' && typeof document !== 'undefined' && document.visibilityState === 'hidden';
  const isBrowserOffline = Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false;
  const isSleepingOrOffline = wasSuspended || isBrowserHidden || isBrowserOffline;

  if (api.signal && api.signal.aborted) {
    return result;
  }

  const isAuthEndpoint = requestUrl.includes('/login') || requestUrl.includes('/register') || requestUrl.includes('/refresh') || requestUrl.includes('/updateMyPassword');

  // Retry silencieux uniquement pour les micro-coupures reseau transitoires
  if (!isSleepingOrOffline && !isAuthEndpoint && result.error && (result.error.status === 'FETCH_ERROR' || result.error.status === 'TIMEOUT_ERROR')) {
    console.warn(`[API] Micro-coupure reseau detectee sur ${requestUrl}. Retry silencieux...`);
    await sleep(1500);
    result = await baseQuery(args, api, extraOptions);
  }

  if (result.error && result.error.status === 401 && !isAuthEndpoint) {
    // PROTECTION ANTI-DEADLOCK (Mutex de rafraichissement concurrent)
    if (mutex.isLocked() || api.getState().auth?.isRefreshing) {
      if (mutex.isLocked()) {
        await mutex.waitForUnlock();
      } else {
        let loopCount = 0;
        while (api.getState().auth?.isRefreshing && loopCount < 150) { 
          await sleep(100);
          loopCount++;
        }
      }

      const tokenAfterWait = api.getState().auth?.token;
      if (tokenBeforeRequest !== tokenAfterWait) {
        return await baseQuery(args, api, extraOptions); 
      }
    }

    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const tokenAfterLock = api.getState().auth?.token;
        if (tokenBeforeRequest !== tokenAfterLock) {
          return await baseQuery(args, api, extraOptions);
        }

        let currentRefreshToken = api.getState().auth?.refreshToken;
        if (!currentRefreshToken) {
           currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
           if (!currentRefreshToken) {
             await sleep(500);
             currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
           }
        }

        if (!currentRefreshToken) {
            console.warn("[API] Aucun refresh token. Deconnexion automatique forcee.");
            socketService.disconnect();
            api.dispatch(logout({ reason: 'MISSING_REFRESH_TOKEN_API_SLICE' }));
            return result;
        }

        const cleanBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout strict de 15s

        // Fetch manuel hors baseQuery pour eviter l'injection automatique de l'ancien token Authorization expire
        const refreshResponse = await fetch(`${cleanBaseUrl}/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ 
            refreshToken: currentRefreshToken,
            clientPlatform: Platform.OS
          }),
          credentials: 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const refreshData = await refreshResponse.json().catch(() => null);

        if (refreshResponse.ok && refreshData) {
          const payload = refreshData.data || refreshData;
          const newToken = payload?.accessToken || payload?.token;
          const newRefreshToken = payload?.refreshToken || currentRefreshToken;

          if (newToken) {
            try {
              const socketService = require('../../services/socketService').default;
              socketService.updateToken(newToken);
            } catch (e) {}

            api.dispatch(setCredentials({ 
              token: newToken, 
              refreshToken: newRefreshToken,
              user: payload?.user || api.getState().auth?.user
            }));

            result = await baseQuery(args, api, extraOptions);
          } else {
            const socketService = require('../../services/socketService').default;
            socketService.disconnect();
            api.dispatch(logout({ reason: 'MALFORMED_REFRESH_PAYLOAD' }));
          }
        } else if (refreshResponse.status === 401 || refreshResponse.status === 403) {
          const socketService = require('../../services/socketService').default;
          socketService.disconnect();
          api.dispatch(logout({ reason: 'REFRESH_REJECTED_401' }));
        }
      } catch (error) {
        console.error('[API] Echec du fetch de rafraichissement. Mutex libere.', error);
      } finally {
        release();
      }
    }
  }

  // Masquer silencieusement les erreurs transitoires liees a la mise en veille ou hors ligne
  if (isSleepingOrOffline && result.error && (result.error.status === 'FETCH_ERROR' || result.error.status === 'TIMEOUT_ERROR')) {
    console.info(`[API] Erreur transitoire masquee (Suspension du thread ou hors ligne detecte)`);
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  refetchOnMountOrArgChange: true,
  tagTypes: ['User', 'Post', 'Workspace', 'Notification', 'Resource', 'NotificationCount', 'FollowStatus', 'FollowStats'],
  endpoints: () => ({}),
});