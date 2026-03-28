import { apiSlice } from '../slices/apiSlice';

export const postApiSlice = apiSlice
  .enhanceEndpoints({ addTagTypes: ['UserPosts', 'Post'] })
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

      // NOUVEAU : Câblage du Repost
      createRepost: builder.mutation({
        query: (postId) => ({
          url: `/v1/social/posts/${postId}/repost`,
          method: 'POST',
        }),
        async onQueryStarted(postId, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(
              postApiSlice.util.updateQueryData('getFeed', undefined, (draft) => {
                if (data && data.data && data.data.post) {
                  draft.unshift(data.data.post);
                }
                const originalPost = draft.find((p) => p._id === postId);
                if(originalPost) {
                  originalPost.stats.shares += 1;
                }
              })
            );
          } catch (error) {
            console.log('Erreur silencieuse creation repost:', error);
          }
        },
        invalidatesTags: ['Post', 'UserPosts'],
      }),

      deletePost: builder.mutation({
        query: (postId) => ({
          url: `/v1/social/posts/${postId}`,
          method: 'DELETE',
        }),
        async onQueryStarted(postId, { dispatch, queryFulfilled }) {
          const patchResult = dispatch(
            postApiSlice.util.updateQueryData('getFeed', undefined, (draft) => {
              return draft.filter((post) => post._id !== postId);
            })
          );
          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        },
        invalidatesTags: ['UserPosts'],
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
        invalidatesTags: ['Post', 'UserPosts'],
      }),

      // NOUVEAU : Modifier un commentaire
      updateComment: builder.mutation({
        query: ({ postId, commentId, text }) => ({
          url: `/v1/social/posts/${postId}/comments/${commentId}`,
          method: 'PUT',
          body: { text },
        }),
        invalidatesTags: ['Post', 'UserPosts'],
      }),

      // NOUVEAU : Supprimer un commentaire avec Optimistic UI
      deleteComment: builder.mutation({
        query: ({ postId, commentId }) => ({
          url: `/v1/social/posts/${postId}/comments/${commentId}`,
          method: 'DELETE',
        }),
        async onQueryStarted({ postId, commentId }, { dispatch, queryFulfilled }) {
          const patchResult = dispatch(
            postApiSlice.util.updateQueryData('getFeed', undefined, (draft) => {
              const post = draft.find((p) => p._id === postId);
              if (post) {
                post.comments = post.comments.filter((c) => c._id !== commentId);
                post.stats.comments = Math.max(0, post.stats.comments - 1);
              }
            })
          );
          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        },
        invalidatesTags: ['UserPosts'],
      }),
    }),
    overrideExisting: true,
  });

export const {
  useGetFeedQuery,
  useGetUserPostsQuery,
  useCreatePostMutation,
  useCreateRepostMutation,
  useDeletePostMutation,
  useToggleLikeMutation,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = postApiSlice;