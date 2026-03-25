// src/hooks/useResourceSocketEvents.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import socketService from '../services/socketService';
import { resourceApiSlice } from '../store/api/resourceApiSlice';

export default function useResourceSocketEvents(queryArgsRef) {
  const dispatch = useDispatch();

  useEffect(() => {
    let socketInstance;
    const setupLiveResources = async () => {
      try {
        socketInstance = await socketService.connect();
        
        socketInstance.on('resourceStatsUpdated', (data) => {
          dispatch(resourceApiSlice.util.updateQueryData('getResources', queryArgsRef.current, (draft) => {
            const resource = draft.find(r => String(r._id) === String(data.id));
            if (resource) {
              if (data.views !== undefined) resource.views = data.views;
              if (data.downloads !== undefined) resource.downloads = data.downloads;
            }
          }));
          dispatch(resourceApiSlice.util.invalidateTags([{ type: 'Resource', id: data.id }]));
        });

        socketInstance.on('newResource', (newResource) => {
          dispatch(resourceApiSlice.util.updateQueryData('getResources', queryArgsRef.current, (draft) => {
            const index = draft.findIndex(r => String(r._id) === String(newResource._id));
            if (index !== -1) {
              draft[index] = { ...draft[index], ...newResource };
            } else if (queryArgsRef.current.page === 1) {
              draft.unshift(newResource);
            }
          }));
          dispatch(resourceApiSlice.util.invalidateTags([{ type: 'Resource', id: 'LIST' }]));
        });

        socketInstance.on('resourceUpdated', (updatedResource) => {
          dispatch(resourceApiSlice.util.updateQueryData('getResources', queryArgsRef.current, (draft) => {
            const index = draft.findIndex(r => String(r._id) === String(updatedResource._id));
            if (index !== -1) {
              draft[index] = { ...draft[index], ...updatedResource };
            }
          }));
        });

        socketInstance.on('resourceDeleted', (data) => {
          dispatch(resourceApiSlice.util.updateQueryData('getResources', queryArgsRef.current, (draft) => {
            const index = draft.findIndex(r => String(r._id) === String(data.id));
            if (index !== -1) {
              draft.splice(index, 1);
            }
          }));
        });

      } catch (error) {
        console.log('Erreur Socket UI:', error);
      }
    };

    setupLiveResources();

    return () => {
      if (socketInstance) {
        socketInstance.off('resourceStatsUpdated');
        socketInstance.off('newResource');
        socketInstance.off('resourceUpdated');
        socketInstance.off('resourceDeleted');
      }
    };
  }, [dispatch, queryArgsRef]);
}