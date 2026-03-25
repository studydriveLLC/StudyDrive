// src/store/slices/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { Platform } from 'react-native';
import { getToken } from '../secureStoreAdapter';
import { setCredentials, performLogout, setTokenRefreshing } from '../slices/authSlice';

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
  let result = await baseQuery(args, api, extraOptions);

  // PROTECTION ANTI-DDOS: Si la requête est annulée par React (Fast Refresh, démontage), on stoppe tout de suite.
  if (api.signal && api.signal.aborted) {
    return result;
  }

  let requestUrl = typeof args === 'string' ? args : args?.url || '';
  const isAuthEndpoint = requestUrl.includes('/login') || requestUrl.includes('/register') || requestUrl.includes('/refresh') || requestUrl.includes('/updateMyPassword');

  let retries = 0;
  const maxRetries = 1; // Une seule tentative de courtoisie suffit pour une vraie micro-coupure.

  while (
    !isAuthEndpoint && 
    result.error && 
    result.error.status === 'FETCH_ERROR' && 
    (!api.signal || !api.signal.aborted) && 
    retries < maxRetries
  ) {
    retries++;
    console.warn(`[API] Tentative de récupération réseau sur ${requestUrl}...`);
    await sleep(1000);
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
            console.warn("[API] Aucun refresh token. Déconnexion.");
            api.dispatch(performLogout());
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

          api.dispatch(setCredentials({ 
            token: newToken, 
            refreshToken: newRefreshToken 
          }));
          
          // C'est ici que l'on réveille le socket en toute sécurité
          const socketService = require('../../services/socketService').default;
          socketService.updateToken(newToken);

          result = await baseQuery(args, api, extraOptions);
        } else if (refreshResult.error && refreshResult.error.status !== 'FETCH_ERROR' && refreshResult.error.status !== 'TIMEOUT_ERROR') {
          console.warn("[API] Refresh token rejeté. Déconnexion.");
          api.dispatch(performLogout());
        }
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

const createOrGetApiSlice = () => {
  if (global.__API_SLICE__) {
    return global.__API_SLICE__;
  }

  const newApiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    refetchOnMountOrArgChange: true,
    tagTypes: ['User', 'Post', 'Workspace', 'Notification', 'Resource'],
    endpoints: () => ({}),
  });

  global.__API_SLICE__ = newApiSlice;
  return newApiSlice;
};

export const apiSlice = createOrGetApiSlice();