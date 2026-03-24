import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { Platform } from 'react-native';
import { getToken } from '../secureStoreAdapter';
import { setCredentials, logout, setTokenRefreshing } from '../slices/authSlice';

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
      token = await getToken('accessToken');
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
  
  const startTime = Date.now();
  let result = await baseQuery(args, api, extraOptions);

  const duration = Date.now() - startTime;
  const wasSuspended = duration > 25000;
  
  const isBrowserHidden = Platform.OS === 'web' && typeof document !== 'undefined' && document.visibilityState === 'hidden';
  const isBrowserOffline = Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false;

  const isSleepingOrOffline = wasSuspended || isBrowserHidden || isBrowserOffline;

  let requestUrl = typeof args === 'string' ? args : args?.url || '';
  const isAuthEndpoint = requestUrl.includes('/login') || requestUrl.includes('/register') || requestUrl.includes('/refresh');

  let retries = 0;
  const maxRetries = 3;

  while (
    !isSleepingOrOffline && 
    !isAuthEndpoint && 
    result.error && 
    (result.error.status === 'FETCH_ERROR' || result.error.status === 'TIMEOUT_ERROR') && 
    retries < maxRetries
  ) {
    retries++;
    const delay = Math.min(1500 * Math.pow(2, retries - 1), 6000); 
    console.warn(`[API] Micro-coupure réseau détectée sur ${requestUrl}. Tentative ${retries}/${maxRetries} dans ${delay}ms...`);
    
    await sleep(delay);
    result = await baseQuery(args, api, extraOptions);
  }

  if (result.error && result.error.status === 401 && !isAuthEndpoint) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const tokenAfterLock = api.getState().auth?.token;
        if (tokenBeforeRequest !== tokenAfterLock) {
          return await baseQuery(args, api, extraOptions);
        }

        api.dispatch(setTokenRefreshing(true));

        let currentRefreshToken = api.getState().auth?.refreshToken;
        if (!currentRefreshToken) {
           currentRefreshToken = await getToken('refreshToken');
        }

        if (!currentRefreshToken) {
            console.warn("[API] Aucun refresh token disponible. Déconnexion.");
            api.dispatch(logout());
            return result;
        }

        const refreshResult = await baseQuery(
          { 
            url: '/v1/auth/refresh', 
            method: 'POST',
            body: { refreshToken: currentRefreshToken } 
          },
          api,
          extraOptions
        );

        if (refreshResult.data?.status === 'success') {
          const newToken = refreshResult.data.data.accessToken;
          const newRefreshToken = refreshResult.data.data.refreshToken || currentRefreshToken;

          // Pas besoin de passer le 'user' ici, authSlice s'en charge en l'ignorant si undefined
          api.dispatch(setCredentials({ 
            token: newToken, 
            refreshToken: newRefreshToken 
          }));
          
          result = await baseQuery(args, api, extraOptions);
        } else if (refreshResult.error && refreshResult.error.status !== 'FETCH_ERROR' && refreshResult.error.status !== 'TIMEOUT_ERROR') {
          // Securite Absolue : On ne deconnecte QUE si le serveur a rejete le token (4xx, 5xx).
          // Si c'est un FETCH_ERROR (perte de connexion pendant le rafraichissement), on tolere.
          console.warn("[API] Le serveur a rejete le refresh token. Déconnexion.");
          api.dispatch(logout());
        }
      } catch (error) {
        console.error('[API] Echec critique lors du rafraichissement', error);
      } finally {
        api.dispatch(setTokenRefreshing(false));
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Post', 'Workspace', 'Notification', 'Resource'],
  endpoints: () => ({}),
});