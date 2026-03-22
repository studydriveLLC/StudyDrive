import { apiSlice } from '../slices/apiSlice';
import socketService from '../../services/socketService';

export const resourceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getResources: builder.query({
      query: ({ page = 1, limit = 10, category, level, search, sort } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (category) params.append('category', category);
        if (level) params.append('level', level);
        if (search) params.append('search', search);
        if (sort) params.append('sort', sort);
        return { url: `/v1/resources?${params.toString()}` };
      },
      transformResponse: (response) => {
        return response.data?.resources || [];
      },
      keepUnusedDataFor: 300, 
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Resource', id: _id })),
              { type: 'Resource', id: 'LIST' }
            ]
          : [{ type: 'Resource', id: 'LIST' }],
          
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        try {
          await cacheDataLoaded;
          const socket = await socketService.connect();
          
          const handleNewResource = (newResource) => {
            updateCachedData((draft) => {
              const exists = draft.find(r => String(r._id) === String(newResource._id));
              if (!exists) {
                draft.unshift(newResource);
              }
            });
          };

          const handleStatsUpdated = (data) => {
            updateCachedData((draft) => {
              const resource = draft.find(r => String(r._id) === String(data.id));
              if (resource) {
                if (data.views !== undefined) resource.views = data.views;
                if (data.downloads !== undefined) resource.downloads = data.downloads;
              }
            });
          };
          
          socket.on('newResource', handleNewResource);
          socket.on('resourceStatsUpdated', handleStatsUpdated);
          
          await cacheEntryRemoved;
          socket.off('newResource', handleNewResource);
          socket.off('resourceStatsUpdated', handleStatsUpdated);
        } catch (error) {
          console.log('Erreur synchronisation socket ressources', error);
        }
      }
    }),
    
    getResource: builder.query({
      query: (id) => ({ url: `/v1/resources/${id}` }),
      transformResponse: (response) => response.data?.resource,
      keepUnusedDataFor: 300,
      providesTags: (result, error, id) => [{ type: 'Resource', id }],
    }),
    
    uploadResource: builder.mutation({
      queryFn: async (formData, { getState }) => {
        const headers = {};
        let token = getState().auth?.token;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
        const fullUrl = `${rawBaseUrl}/v1/resources`;
        try {
          const response = await fetch(fullUrl, {
            method: 'POST',
            body: formData,
            headers,
          });
          const data = await response.json();
          if (!response.ok) {
            return { error: { status: response.status, data } };
          }
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: [], 
    }),
    
    logView: builder.mutation({
      query: (id) => ({ url: `/v1/resources/${id}/view`, method: 'PATCH' }),
    }),

    logDownload: builder.mutation({
      query: (id) => ({ url: `/v1/resources/${id}/download`, method: 'PATCH' }),
    }),
    
    deleteResource: builder.mutation({
      query: (id) => ({ url: `/v1/resources/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Resource', id: 'LIST' }],
    }),
    
    updateResource: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/v1/resources/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Resource', id }, { type: 'Resource', id: 'LIST' }],
    }),
    
    toggleFavorite: builder.mutation({
      query: (id) => ({ url: `/v1/resources/${id}/favorite`, method: 'POST' }),
    }),
    
    reportResource: builder.mutation({
      query: (id) => ({ url: `/v1/resources/${id}/report`, method: 'POST' }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetResourcesQuery,
  useGetResourceQuery,
  useUploadResourceMutation,
  useLogViewMutation,
  useLogDownloadMutation,
  useDeleteResourceMutation,
  useUpdateResourceMutation,
  useToggleFavoriteMutation,
  useReportResourceMutation,
} = resourceApiSlice;