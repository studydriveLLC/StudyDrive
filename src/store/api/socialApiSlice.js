import { apiSlice } from '../slices/apiSlice';
import { postApiSlice } from './postApiSlice';

export const socialApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFollowStatus: builder.query({
      query: (targetId) => `/v1/social/status/${targetId}`,
      providesTags: (result, error, arg) => [{ type: 'FollowStatus', id: String(arg) }],
    }),
    
    getMyFollowStats: builder.query({
      query: () => '/v1/social/my-stats',
      providesTags: ['FollowStats'],
    }),
    
    followUser: builder.mutation({
      query: (targetId) => ({
        url: `/v1/social/follow/${targetId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'FollowStatus', id: String(arg) },
        'FollowStats'
      ],
      async onQueryStarted(targetId, { dispatch, queryFulfilled }) {
        const stringId = String(targetId);
        const patchStatus = dispatch(
          socialApiSlice.util.updateQueryData('getFollowStatus', stringId, (draft) => {
            if (draft) {
              if (draft.data !== undefined) draft.data.isFollowing = true;
              else draft.isFollowing = true;
            }
          })
        );
        const patchStats = dispatch(
          socialApiSlice.util.updateQueryData('getMyFollowStats', undefined, (draft) => {
            if (draft) {
              if (draft.data !== undefined && typeof draft.data.followingCount === 'number') {
                draft.data.followingCount += 1;
              } else if (typeof draft.followingCount === 'number') {
                draft.followingCount += 1;
              }
            }
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchStatus.undo();
          patchStats.undo();
        }
      },
    }),
    
    unfollowUser: builder.mutation({
      query: (targetId) => ({
        url: `/v1/social/unfollow/${targetId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'FollowStatus', id: String(arg) },
        'FollowStats'
      ],
      async onQueryStarted(targetId, { dispatch, queryFulfilled }) {
        const stringId = String(targetId);
        const patchStatus = dispatch(
          socialApiSlice.util.updateQueryData('getFollowStatus', stringId, (draft) => {
            if (draft) {
              if (draft.data !== undefined) draft.data.isFollowing = false;
              else draft.isFollowing = false;
            }
          })
        );
        const patchStats = dispatch(
          socialApiSlice.util.updateQueryData('getMyFollowStats', undefined, (draft) => {
            if (draft) {
              if (draft.data !== undefined && typeof draft.data.followingCount === 'number') {
                draft.data.followingCount = Math.max(0, draft.data.followingCount - 1);
              } else if (typeof draft.followingCount === 'number') {
                draft.followingCount = Math.max(0, draft.followingCount - 1);
              }
            }
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchStatus.undo();
          patchStats.undo();
        }
      },
    }),

    // NOUVEAU : Masquer un utilisateur ("Ne plus voir")
    hideUser: builder.mutation({
      query: (targetId) => ({
        url: `/v1/social/hide/${targetId}`,
        method: 'POST',
      }),
      async onQueryStarted(targetId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          postApiSlice.util.updateQueryData('getFeed', undefined, (draft) => {
            return draft.filter((post) => post.author._id !== targetId);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Post'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetFollowStatusQuery,
  useGetMyFollowStatsQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useHideUserMutation,
} = socialApiSlice;