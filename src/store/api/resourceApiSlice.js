import { apiSlice } from '../slices/apiSlice';

export const resourceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadResource: builder.mutation({
      query: (formData) => ({
        url: '/resources',
        method: 'POST',
        body: formData,
        formData: true, // <--- LA CLÉ MAGIQUE : Empêche RTK Query de forcer le JSON !
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useUploadResourceMutation } = resourceApiSlice;