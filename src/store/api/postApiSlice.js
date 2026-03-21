import { apiSlice } from '../slices/apiSlice';

export const postApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFeed: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: '/v1/social/feed',
        params: { page, limit },
      }),
      transformResponse: (response) => {
        return response.data?.posts || [];
      },
      providesTags: ['Post'],
    }),

    createPost: builder.mutation({
      query: (postData) => ({
        url: '/v1/social/posts',
        method: 'POST',
        body: postData,
      }),
      invalidatesTags: ['Post'],
    }),

    deletePost: builder.mutation({
      query: (postId) => ({
        url: `/v1/social/posts/${postId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Post'],
    }),

    toggleLike: builder.mutation({
      query: (postId) => ({
        url: `/v1/social/posts/${postId}/like`,
        method: 'POST',
      }),
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          postApiSlice.util.updateQueryData('getFeed', undefined, (draft) => {
            const post = draft.find((p) => p._id === postId);
            if (post) {
              post.isLikedByMe = !post.isLikedByMe;
              post.stats.likes += post.isLikedByMe ? 1 : -1;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    addComment: builder.mutation({
      query: ({ postId, text }) => ({
        url: `/v1/social/posts/${postId}/comments`,
        method: 'POST',
        body: { text },
      }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            postApiSlice.util.updateQueryData('getFeed', undefined, (draft) => {
              const post = draft.find((p) => p._id === postId);
              if (post) {
                post.comments.push(data.data.comment);
                post.stats.comments += 1;
              }
            })
          );
        } catch (error) {
          console.log('Erreur silencieuse ajout commentaire:', error);
        }
      },
      invalidatesTags: ['Post'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetFeedQuery,
  useCreatePostMutation,
  useDeletePostMutation,
  useToggleLikeMutation,
  useAddCommentMutation,
} = postApiSlice;