// src/store/api/resourceApiSlice.js
import { apiSlice } from '../slices/apiSlice';

export const resourceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // NOUVEAU : Récupérer mes propres ressources
    getMyResources: builder.query({
      query: () => ({ url: '/v1/resources/me' }),
      transformResponse: (response) => response.data?.resources || [],
      keepUnusedDataFor: 300,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Resource', id: _id })),
              { type: 'Resource', id: 'MY_LIST' }
            ]
          : [{ type: 'Resource', id: 'MY_LIST' }]
    }),

    getResources: builder.query({
      query: ({ page = 1, limit = 20, category, level, search, sort } = {}) => {
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
          : [{ type: 'Resource', id: 'LIST' }]
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
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          resourceApiSlice.util.updateQueryData('getResources', { page: 1, limit: 20 }, (draft) => {
            const resource = draft.find(r => String(r._id) === String(id));
            if (resource) resource.views += 1;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      }
    }),

    logDownload: builder.mutation({
      query: (id) => ({ url: `/v1/resources/${id}/download`, method: 'PATCH' }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          resourceApiSlice.util.updateQueryData('getResources', { page: 1, limit: 20 }, (draft) => {
            const resource = draft.find(r => String(r._id) === String(id));
            if (resource) resource.downloads += 1;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      }
    }),
    
    deleteResource: builder.mutation({
      query: (id) => ({ url: `/v1/resources/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Resource', id: 'LIST' }, { type: 'Resource', id: 'MY_LIST' }],
    }),
    
    updateResource: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/v1/resources/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Resource', id }, { type: 'Resource', id: 'LIST' }, { type: 'Resource', id: 'MY_LIST' }],
    }),
    
    toggleFavorite: builder.mutation({
      query: (id) => ({ url: `/v1/resources/${id}/favorite`, method: 'POST' }),
    }),
    
    reportResource: builder.mutation({
      query: ({ id, reason }) => ({ 
        url: `/v1/resources/${id}/signal`, 
        method: 'POST',
        body: { reason }
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetMyResourcesQuery,
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