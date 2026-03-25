//src/store/api/notificationApiSlice.js
import { apiSlice } from '../slices/apiSlice';
import socketService from '../../services/socketService';

export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 1, limit = 50 } = {}) => ({
        url: `/v1/notifications?page=${page}&limit=${limit}`,
      }),
      providesTags: (result) =>
        result?.data?.notifications
          ? [
              ...result.data.notifications.map(({ _id }) => ({ type: 'Notification', id: _id })),
              { type: 'Notification', id: 'LIST' }
            ]
          : [{ type: 'Notification', id: 'LIST' }]
    }),
    
    getUnreadCount: builder.query({
      query: () => ({ url: '/v1/notifications/unread-count' }),
      providesTags: ['NotificationCount'],
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        try {
          await cacheDataLoaded;
          
          const handleNewNotification = () => {
            updateCachedData((draft) => {
              if (draft && draft.data && typeof draft.data.count === 'number') {
                draft.data.count += 1;
              }
            });
          };

          socketService.on('new_notification', handleNewNotification);

          await cacheEntryRemoved;
          socketService.off('new_notification', handleNewNotification);
        } catch {
          // Si le chargement echoue, on ne plante pas l'application
        }
      }
    }),

    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/v1/notifications/${id}/read`,
        method: 'PATCH',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', { page: 1, limit: 50 }, (draft) => {
            const notif = draft?.data?.notifications?.find(n => String(n._id) === String(id));
            if (notif) notif.isRead = true;
          })
        );
        try {
          await queryFulfilled;
          dispatch(notificationApiSlice.util.invalidateTags(['NotificationCount']));
        } catch {
          patchResult.undo();
        }
      }
    }),

    markAllAsRead: builder.mutation({
      query: () => ({
        url: '/v1/notifications/read-all',
        method: 'PATCH',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', { page: 1, limit: 50 }, (draft) => {
            if (draft?.data?.notifications) {
              draft.data.notifications.forEach(n => { n.isRead = true; });
            }
          })
        );
        try {
          await queryFulfilled;
          dispatch(notificationApiSlice.util.invalidateTags(['NotificationCount']));
        } catch {
          patchResult.undo();
        }
      }
    }),

    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/v1/notifications/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', { page: 1, limit: 50 }, (draft) => {
            if (draft?.data?.notifications) {
              draft.data.notifications = draft.data.notifications.filter(n => String(n._id) !== String(id));
            }
          })
        );
        try {
          await queryFulfilled;
          dispatch(notificationApiSlice.util.invalidateTags(['NotificationCount']));
        } catch {
          patchResult.undo();
        }
      }
    }),

    deleteMultipleNotifications: builder.mutation({
      query: (notificationIds) => ({
        url: '/v1/notifications/bulk-delete',
        method: 'POST',
        body: { notificationIds },
      }),
      async onQueryStarted(notificationIds, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', { page: 1, limit: 50 }, (draft) => {
            if (draft?.data?.notifications) {
              draft.data.notifications = draft.data.notifications.filter(n => !notificationIds.includes(n._id));
            }
          })
        );
        try {
          await queryFulfilled;
          dispatch(notificationApiSlice.util.invalidateTags(['NotificationCount']));
        } catch {
          patchResult.undo();
        }
      }
    }),

    deleteAllNotifications: builder.mutation({
      query: () => ({
        url: '/v1/notifications/all',
        method: 'DELETE',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApiSlice.util.updateQueryData('getNotifications', { page: 1, limit: 50 }, (draft) => {
            if (draft?.data?.notifications) {
              draft.data.notifications = [];
            }
          })
        );
        try {
          await queryFulfilled;
          dispatch(notificationApiSlice.util.invalidateTags(['NotificationCount']));
        } catch {
          patchResult.undo();
        }
      }
    }),

    registerPushToken: builder.mutation({
      query: (token) => ({
        url: '/v1/notifications/register-token',
        method: 'POST',
        body: { token },
      }),
    }),

    unregisterPushToken: builder.mutation({
      query: (token) => ({
        url: '/v1/notifications/unregister-token',
        method: 'POST',
        body: { token },
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteMultipleNotificationsMutation,
  useDeleteAllNotificationsMutation,
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
} = notificationApiSlice;