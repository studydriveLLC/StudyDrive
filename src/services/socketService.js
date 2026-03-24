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
    if (socket) return socket;
    
    const token = await getToken('accessToken');
    
    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      // Reconnexion agressive pour contrer les micro-coupures mobiles
      reconnection: true,
      reconnectionAttempts: Infinity, // Ne jamais abandonner
      reconnectionDelay: 1000, // Commencer à 1s
      reconnectionDelayMax: 5000, // Max 5s entre les tentatives
      timeout: 20000, // Timeout de connexion
      autoConnect: true
    });
    
    socket.on('connect', () => console.log('[Socket] Connecte au serveur avec succes'));
    
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Deconnecte. Raison:', reason);
      if (reason === 'io server disconnect') {
        // La déconnexion a été initiée par le serveur, on doit se reconnecter manuellement
        socket.connect();
      }
      // Les autres raisons (ping timeout, transport close) déclenchent la reconnexion automatique
    });

    socket.on('connect_error', (err) => console.log('[Socket] Erreur de connexion:', err.message));
    
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
    }
  }
};

export default socketService;