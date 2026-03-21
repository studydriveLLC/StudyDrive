import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import { getToken, saveToken, deleteToken } from '../secureStoreAdapter';
import { setCredentials, logout, setTokenRefreshing } from './authSlice';

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!rawBaseUrl && __DEV__) {
  console.warn("ATTENTION: EXPO_PUBLIC_API_URL n'est pas defini dans le fichier .env !");
}

// Creation de notre moteur de requete avec un systeme de tentatives automatiques
const staggeredBaseQuery = retry(
  fetchBaseQuery({
    baseUrl: rawBaseUrl,
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
      }

      return headers;
    },
  }),
  { maxRetries: 3 } // Si le reseau coupe, on retente jusqu'a 3 fois silencieusement
);

// Verrous pour gerer les appels concurrents au rafraichissement
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // On utilise notre nouveau moteur avec retry ici
  let result = await staggeredBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      api.dispatch(setTokenRefreshing(true));

      // On tente de rafraichir. Le cookie httpOnly est envoye automatiquement.
      const refreshResult = await staggeredBaseQuery(
        { url: '/v1/auth/refresh', method: 'POST' },
        api,
        extraOptions
      );

      if (refreshResult.data?.status === 'success') {
        const newToken = refreshResult.data.data.accessToken;
        const user = api.getState().auth.user;

        api.dispatch(setCredentials({ user, token: newToken }));
        await saveToken('accessToken', newToken);
        
        isRefreshing = false;
        onRefreshed(newToken);
        api.dispatch(setTokenRefreshing(false));

        // Rejouer la requete initiale echouee avec le nouveau token
        result = await staggeredBaseQuery(args, api, extraOptions);
      } else {
        // Le refresh token est mort ou invalide, deconnexion totale
        isRefreshing = false;
        api.dispatch(setTokenRefreshing(false));
        api.dispatch(logout());
        await deleteToken('accessToken');
        await deleteToken('userData');
      }
    } else {
      // Une autre requete a deja lance le refresh, on met celle-ci en pause
      await new Promise((resolve) => {
        subscribeTokenRefresh(() => {
          resolve();
        });
      });
      // Une fois le refresh fini, on rejoue
      result = await staggeredBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Post', 'Workspace', 'Notification', 'Resource'],
  endpoints: (builder) => ({}),
});