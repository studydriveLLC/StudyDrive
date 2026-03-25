import { apiSlice } from '../slices/apiSlice';

export const socialApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFollowStatus: builder.query({
      query: (targetId) => `/v1/social/status/${targetId}`,
      providesTags: (result, error, arg) => [{ type: 'FollowStatus', id: arg }],
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
      async onQueryStarted(targetId, { dispatch, queryFulfilled }) {
        const patchStatus = dispatch(
          socialApiSlice.util.updateQueryData('getFollowStatus', targetId, (draft) => {
            if (draft && draft.data) {
              draft.data.isFollowing = true;
            }
          })
        );
        const patchStats = dispatch(
          socialApiSlice.util.updateQueryData('getMyFollowStats', undefined, (draft) => {
            if (draft && draft.data && typeof draft.data.followingCount === 'number') {
              draft.data.followingCount += 1;
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
      invalidatesTags: (result, error, arg) => [
        { type: 'FollowStatus', id: arg },
        'FollowStats'
      ],
    }),
    
    unfollowUser: builder.mutation({
      query: (targetId) => ({
        url: `/v1/social/unfollow/${targetId}`,
        method: 'POST',
      }),
      async onQueryStarted(targetId, { dispatch, queryFulfilled }) {
        const patchStatus = dispatch(
          socialApiSlice.util.updateQueryData('getFollowStatus', targetId, (draft) => {
            if (draft && draft.data) {
              draft.data.isFollowing = false;
            }
          })
        );
        const patchStats = dispatch(
          socialApiSlice.util.updateQueryData('getMyFollowStats', undefined, (draft) => {
            if (draft && draft.data && typeof draft.data.followingCount === 'number') {
              draft.data.followingCount = Math.max(0, draft.data.followingCount - 1);
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
      invalidatesTags: (result, error, arg) => [
        { type: 'FollowStatus', id: arg },
        'FollowStats'
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetFollowStatusQuery,
  useGetMyFollowStatsQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
} = socialApiSlice;