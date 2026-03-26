//src/store/api/postApiSlice.js
import { apiSlice } from '../slices/apiSlice';

export const postApiSlice = apiSlice
  .enhanceEndpoints({ addTagTypes: ['UserPosts'] })
  .injectEndpoints({
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

      getUserPosts: builder.query({
        query: ({ userId, page = 1, limit = 10 }) => ({
          url: `/v1/social/user-posts/${userId}`,
          params: { page, limit },
        }),
        transformResponse: (response) => {
          return response.data?.posts || [];
        },
        providesTags: (result, error, arg) => [{ type: 'UserPosts', id: arg.userId }],
      }),

      createPost: builder.mutation({
        query: (postData) => ({
          url: '/v1/social/posts',
          method: 'POST',
          body: postData,
        }),
        async onQueryStarted(postData, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(
              postApiSlice.util.updateQueryData('getFeed', undefined, (draft) => {
                if (data && data.data && data.data.post) {
                  draft.unshift(data.data.post);
                }
              })
            );
          } catch (error) {
            console.log('Erreur silencieuse creation post:', error);
          }
        },
        invalidatesTags: ['Post', 'UserPosts'],
      }),

      deletePost: builder.mutation({
        query: (postId) => ({
          url: `/v1/social/posts/${postId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Post', 'UserPosts'],
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
        invalidatesTags: ['Post', 'UserPosts'],
      }),
    }),
    overrideExisting: true,
  });

export const {
  useGetFeedQuery,
  useGetUserPostsQuery,
  useCreatePostMutation,
  useDeletePostMutation,
  useToggleLikeMutation,
  useAddCommentMutation,
} = postApiSlice;