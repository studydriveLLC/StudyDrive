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
      async onQueryStarted(targetId, { dispatch, queryFulfilled }) {
        const patchStatus = dispatch(
          socialApiSlice.util.updateQueryData('getFollowStatus', targetId, (draft) => {
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
  }),
  overrideExisting: true,
});

export const {
  useGetFollowStatusQuery,
  useGetMyFollowStatsQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
} = socialApiSlice;