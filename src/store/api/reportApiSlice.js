import { apiSlice } from '../slices/apiSlice';

export const reportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createReport: builder.mutation({
      query: (formData) => ({
        url: '/v1/reports',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useCreateReportMutation } = reportApiSlice;