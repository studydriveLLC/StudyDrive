// src/services/socketService.js
import { io } from 'socket.io-client';

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || '';

const getBaseOrigin = (url) => {
  const match = url.match(/^(https?:\/\/[^\/]+)/);
  return match ? match[1] : url;
};

const SOCKET_URL = getBaseOrigin(rawBaseUrl);

class SocketService {
  constructor() {
    // Fusion du pattern Yely avec la survie au Fast Refresh d'Expo
    if (!global.__LOKONET_SOCKET__) {
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this._listeners = [];
      this.refreshTimeout = null;
      global.__LOKONET_SOCKET__ = this;
    }
    return global.__LOKONET_SOCKET__;
  }

  connect(token) {
    if (!token || !SOCKET_URL) return;

    if (this.socket?.connected) {
      if (this.socket.auth.token !== token) {
        this.socket.auth.token = token;
        this.socket.disconnect().connect();
      }
      return;
    }

    if (this.socket) {
      this.socket.auth.token = token;
      this.socket.connect();
      return;
    }

    // Connexion propre, sans promesse asynchrone bloquante
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    // Re-attachement automatique des ecouteurs lors de la creation
    this._listeners.forEach(({ event, callback }) => {
      this.socket.on(event, callback);
    });

    this._setupCoreListeners();
  }

  updateToken(newToken) {
    if (!newToken) return;
    
    if (!this.socket) {
      this.connect(newToken);
      return;
    }

    if (this.socket.auth.token === newToken) {
      return; 
    }

    this.socket.auth.token = newToken;
    
    if (!this.socket.connected) {
      this.socket.connect(); 
    } else {
      this.socket.disconnect().connect();
    }
  }

  _setupCoreListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('[Socket] Connecte au serveur avec succes');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[Socket] Deconnecte. Raison:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.log('[Socket] Erreur de connexion:', error.message);
      
      if (error.message === 'Token invalide ou expire' || error.message === 'Authentification requise') {
        // Securite anti-spam temporelle
        if (!this.refreshTimeout) {
           console.log('[Socket] Declenchement protege du rafraichissement silencieux...');
           const { store } = require('../store/store');
           const { forceSilentRefresh } = require('../store/slices/authSlice');
           
           if (store && forceSilentRefresh) {
             store.dispatch(forceSilentRefresh());
           }
           
           this.refreshTimeout = setTimeout(() => {
             this.refreshTimeout = null;
           }, 10000);
        }
      }
    });
  }

  on(event, callback) {
    const exists = this._listeners.some(l => l.event === event && l.callback === callback);
    if (!exists) {
      this._listeners.push({ event, callback });
      if (this.socket) {
        this.socket.on(event, callback);
      }
    }
  }

  off(event, callback) {
    this._listeners = this._listeners.filter(
      (l) => !(l.event === event && l.callback === callback)
    );
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    this._listeners.forEach(({ event, callback }) => {
      this.socket?.off(event, callback);
    });

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

const socketService = new SocketService();
export default socketService;