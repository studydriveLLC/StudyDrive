import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getToken } from '../secureStoreAdapter';

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!rawBaseUrl && __DEV__) {
console.warn("ATTENTION: EXPO_PUBLIC_API_URL n'est pas defini dans le fichier .env !");
}

export const apiSlice = createApi({
reducerPath: 'api',
baseQuery: fetchBaseQuery({
baseUrl: rawBaseUrl,
prepareHeaders: async (headers, { getState, endpoint }) => {
// 1. Cherche le token dans Redux d'abord
let token = getState().auth?.token;

// 2. S'il n'est pas dans Redux, cherche dans SecureStore
if (!token) {
token = await getToken('accessToken');
}

// 3. Injecte le token si present
if (token) {
headers.set('Authorization', `Bearer ${token}`);
}

// 4. Pour les endpoints qui uploadent (detectes par le nom), ne pas set Content-Type
// Cela permet a React Native d'ajouter multipart/form-data avec le boundary
const uploadEndpoints = ['uploadResource', 'uploadAvatar', 'uploadPostMedia'];
if (uploadEndpoints.includes(endpoint)) {
headers.delete('Content-Type');
}

return headers;
},
}),
tagTypes: ['User', 'Post', 'Workspace', 'Notification', 'Resource'],
endpoints: (builder) => ({}),
});
