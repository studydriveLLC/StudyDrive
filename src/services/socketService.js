// src/services/socketService.js
import { io } from 'socket.io-client';
import { getToken } from '../store/secureStoreAdapter';

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || '';

const getBaseOrigin = (url) => {
  const match = url.match(/^(https?:\/\/[^\/]+)/);
  return match ? match[1] : url;
};

const socketUrl = getBaseOrigin(rawBaseUrl);

// 1. Singleton Global : Survie au Fast Refresh d'Expo
const getSocketInstance = () => {
  return global.__SOCKET_INSTANCE__ || null;
};

const setSocketInstance = (instance) => {
  global.__SOCKET_INSTANCE__ = instance;
};

// Verrou de sécurité pour éviter le spam de Redux
let isRefreshingTriggered = false;

const socketService = {
  connect: () => {
    let socket = getSocketInstance();
    
    // Si l'instance existe et est connectée (suite à un Fast Refresh), on la réutilise
    if (socket && socket.connected) return socket;
    
    if (socket) {
      socket.disconnect();
    }
    
    // 2. Authentification Dynamique (Lazy Evaluation)
    socket = io(socketUrl, {
      auth: async (cb) => {
        // Le socket lira toujours le token le plus récent avant chaque reconnexion
        const token = await getToken('accessToken');
        cb({ token });
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });
    
    setSocketInstance(socket);
    
    socket.on('connect', () => {
      console.log('[Socket] Connecte au serveur avec succes');
      isRefreshingTriggered = false; // Réinitialise le verrou
    });
    
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Deconnecte. Raison:', reason);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] Erreur de connexion:', err.message);
      
      // 3. Sécurité Anti-Spam (Debounce)
      if ((err.message === 'Token invalide ou expire' || err.message === 'Authentification requise')) {
         if (!isRefreshingTriggered) {
           isRefreshingTriggered = true;
           console.log('[Socket] Declenchement protege du rafraichissement silencieux...');
           const { store } = require('../store/store');
           const { forceSilentRefresh } = require('../store/slices/authSlice');
           
           if (store) store.dispatch(forceSilentRefresh());
           
           // Libération du verrou après 10s pour permettre une autre tentative si echec
           setTimeout(() => {
               isRefreshingTriggered = false;
           }, 10000);
         } else {
           console.log('[Socket] Rafraichissement deja en cours, tentative ignoree.');
         }
      }
    });
    
    return socket;
  },
  
  disconnect: () => {
    let socket = getSocketInstance();
    if (socket) {
      socket.disconnect();
      setSocketInstance(null);
      console.log('[Socket] Deconnexion volontaire');
    }
  },
  
  updateToken: () => {
    let socket = getSocketInstance();
    if (socket) {
      // Grâce à l'évaluation paresseuse, on a juste à forcer la déconnexion/reconnexion.
      // Le socket ira chercher le nouveau token lui-même.
      socket.disconnect().connect();
      console.log('[Socket] Token mis a jour et reconnexion forcee');
    }
  },

  forceReconnect: () => {
    console.log('[Socket] Reconnexion forcee demandee...');
    let socket = getSocketInstance();
    if (socket) {
      socket.disconnect().connect();
    } else {
      socketService.connect();
    }
  }
};

export default socketService;