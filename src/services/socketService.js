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
    if (!global.__LOKONET_SOCKET__) {
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this._listeners = [];
      global.__LOKONET_SOCKET__ = this;
    }
    return global.__LOKONET_SOCKET__;
  }

  async connect(tokenParam) {
    let token = tokenParam;
    
    if (!token) {
      const { getToken } = require('../store/secureStoreAdapter');
      token = await getToken('accessToken');
    }

    if (!token || !SOCKET_URL) return null;

    if (this.socket?.connected) {
      if (this.socket.auth.token !== token) {
        this.socket.auth.token = token;
        this.socket.disconnect().connect();
      }
      return this.socket;
    }

    if (this.socket) {
      this.socket.auth.token = token;
      this.socket.connect();
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this._listeners.forEach(({ event, callback }) => {
      this.socket.on(event, callback);
    });

    this._setupCoreListeners();

    return this.socket;
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

  async forceReconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    return await this.connect();
  }

  getSocket() {
    return this.socket;
  }

  _setupCoreListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('[Socket] Connecté au serveur');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[Socket] Déconnecté:', reason);
    });

    this.socket.on('connect_error', (error) => {
      // On retire la commande de rafraichissement forcée.
      // Le socket est passif, il attend que l'API (qui rencontre sûrement la même erreur 401 au même moment)
      // fasse le travail de rafraichissement proprement avec son Mutex, et lui injecte le nouveau token.
      console.log('[Socket] Erreur passive:', error.message);
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