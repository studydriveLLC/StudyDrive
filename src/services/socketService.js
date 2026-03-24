import { io } from 'socket.io-client';
import { getToken } from '../store/secureStoreAdapter';

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || '';

const getBaseOrigin = (url) => {
  const match = url.match(/^(https?:\/\/[^\/]+)/);
  return match ? match[1] : url;
};

const socketUrl = getBaseOrigin(rawBaseUrl);
let socket = null;

const socketService = {
  connect: async () => {
    if (socket && socket.connected) return socket;
    
    if (socket) {
      socket.disconnect();
    }
    
    const token = await getToken('accessToken');
    
    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });
    
    socket.on('connect', () => console.log('[Socket] Connecte au serveur avec succes'));
    
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Deconnecte. Raison:', reason);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] Erreur de connexion:', err.message);
      
      // Auto-reparation : Si le token est mort, on force Redux a en chercher un nouveau
      if (err.message === 'Token invalide ou expire' || err.message === 'Authentification requise') {
         const { store } = require('../store/store');
         const { forceSilentRefresh } = require('../store/slices/authSlice');
         if (store) store.dispatch(forceSilentRefresh());
      }
    });
    
    return socket;
  },
  
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log('[Socket] Deconnexion volontaire');
    }
  },
  
  updateToken: (token) => {
    if (socket) {
      socket.auth = { token };
      socket.disconnect().connect();
      console.log('[Socket] Token mis a jour et reconnexion forcee');
    }
  },

  forceReconnect: async () => {
    console.log('[Socket] Reconnexion forcee demandee...');
    if (socket) {
      socket.disconnect();
    }
    const token = await getToken('accessToken');
    if (socket) {
      socket.auth = { token };
      socket.connect();
    } else {
      await socketService.connect();
    }
  }
};

export default socketService;