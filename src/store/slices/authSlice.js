// src/store/slices/authSlice.js
// GESTION SESSION - SECURISATION PII & FONCTIONS PURES REDUX
// CSCSM Level: Bank Grade

import { createSlice } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import socketService from '../../services/socketService';
import SecureStorageAdapter from '../secureStoreAdapter';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  tokenAcquiredAt: null, 
  isAuthenticated: false,
  isRefreshing: false, 
  isLoading: true, // Initialise a true pour retenir l'UI pendant le bootSequence
  subscriptionStatus: {
    isActive: false,
    isPending: false,
    isRejected: false,
    rejectionReason: null,
    expiresAt: null
  },
  promoMode: {
    isActive: false,
    message: ""
  }
};

const safeStorageSet = (key, value) => {
  Promise.resolve(SecureStorageAdapter.setItem(key, value)).catch(err => {
    console.error(`[Redux] Echec de sauvegarde pour ${key}:`, err);
  });
};

const safeStorageRemove = (key) => {
  Promise.resolve(SecureStorageAdapter.removeItem(key)).catch(err => {
    console.error(`[Redux] Echec de suppression pour ${key}:`, err);
  });
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, token, refreshToken } = action.payload || {};
      const finalToken = accessToken || token;

      if (!user && !finalToken && !refreshToken) {
        console.warn('[Redux] Donnees de connexion incompletes');
      }

      if (user) {
        state.user = user;
        if (user.subscription && typeof user.subscription === 'object') {
          state.subscriptionStatus = {
            ...state.subscriptionStatus,
            isActive: user.subscription.isActive || false,
            isPending: user.subscription.isPending || false,
            expiresAt: user.subscription.expiresAt || null
          };
        }
      }

      if (finalToken) {
        state.token = finalToken;
        state.tokenAcquiredAt = Date.now(); 
        safeStorageSet('tokenAcquiredAt', String(state.tokenAcquiredAt));
      }
      
      if (refreshToken) state.refreshToken = refreshToken;
      
      state.isAuthenticated = !!state.token;

      if (state.user) safeStorageSet('userInfo', JSON.stringify(state.user));
      if (state.token) safeStorageSet('token', state.token);
      if (state.refreshToken) safeStorageSet('refreshToken', state.refreshToken);
    },
    
    updateUserInfo: (state, action) => {
      if (!state.user) return;
      state.user = { 
        ...state.user, 
        ...action.payload,
        subscription: action.payload.subscription !== undefined ? action.payload.subscription : state.user.subscription
      };

      if (action.payload.subscription) {
        state.subscriptionStatus = {
          ...state.subscriptionStatus,
          isActive: action.payload.subscription.isActive || false,
          isPending: action.payload.subscription.isPending || false,
          isRejected: action.payload.subscription.isPending ? false : state.subscriptionStatus.isRejected,
          expiresAt: action.payload.subscription.expiresAt || null
        };
      }
      safeStorageSet('userInfo', JSON.stringify(state.user));
    },

    updateSubscriptionStatus: (state, action) => {
      state.subscriptionStatus = { ...state.subscriptionStatus, ...action.payload };
    },

    updatePromoMode: (state, action) => {
      state.promoMode = {
        isActive: action.payload.isGlobalFreeAccess || false,
        message: action.payload.promoMessage || "VIP Active."
      };
    },

    logout: (state, action) => {
      const reason = action.payload?.reason || 'USER_INITIATED';
      console.warn(`[AUTH] Deconnexion declenchee. Raison: ${reason}`);

      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tokenAcquiredAt = null; 
      state.isAuthenticated = false;
      state.isRefreshing = false;
      state.subscriptionStatus = { isActive: false, isPending: false, isRejected: false, rejectionReason: null, expiresAt: null };
      
      safeStorageRemove('userInfo');
      safeStorageRemove('token');
      safeStorageRemove('refreshToken');
      safeStorageRemove('tokenAcquiredAt');
    },

    restoreAuth: (state, action) => {
      const { user, token, refreshToken, tokenAcquiredAt } = action.payload || {};
      state.user = user || null;
      state.token = token;
      state.refreshToken = refreshToken;
      
      state.tokenAcquiredAt = tokenAcquiredAt ? Number(tokenAcquiredAt) : 0; 
      state.isAuthenticated = !!token;
      
      if (user && user.subscription && typeof user.subscription === 'object') {
        state.subscriptionStatus = {
          ...state.subscriptionStatus,
          isActive: user.subscription.isActive || false,
          isPending: user.subscription.isPending || false,
          expiresAt: user.subscription.expiresAt || null
        };
      }
    },

    setRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
    },

    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
});

export const { 
  setCredentials, 
  updateUserInfo, 
  updateSubscriptionStatus,
  updatePromoMode,
  logout, 
  restoreAuth, 
  setRefreshing,
  setAuthLoading
} = authSlice.actions;

export const fetchPromoConfig = () => async (dispatch, getState) => {
  const { auth } = getState();
  if (!auth.token) return null;

  try {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    const response = await fetch(`${cleanBaseUrl}/v1/subscription/config`, {
      headers: { 'Authorization': `Bearer ${auth.token}`, 'Accept': 'application/json' }
    });

    const result = await response.json();
    if (response.ok && result?.data) {
      dispatch(updatePromoMode({
        isGlobalFreeAccess: result.data.isGlobalFreeAccess,
        promoMessage: result.data.promoMessage
      }));
      return result.data; 
    }
  } catch (error) {
    console.warn("[AUTH] Impossible de synchroniser la config VIP au demarrage/login");
  }
  return null;
};

// ANTI-RACE CONDITION MODULE VARIABLE
let isSilentRefreshing = false;

export const forceSilentRefresh = () => async (dispatch, getState) => {
  const { auth } = getState();

  if (isSilentRefreshing) return;

  if (auth.token && auth.tokenAcquiredAt) {
    const ageInMs = Date.now() - auth.tokenAcquiredAt;
    if (ageInMs < 14 * 60 * 1000) { 
      return;
    }
  }

  isSilentRefreshing = true;

  try {
    let currentRefreshToken = auth.refreshToken;
    if (!currentRefreshToken) {
       currentRefreshToken = await SecureStorageAdapter.getItem('refreshToken');
    }

    if (!currentRefreshToken) {
      return;
    }

    const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Alignement 15s (comme Yely)

    const response = await fetch(`${cleanBaseUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ 
        refreshToken: currentRefreshToken,
        clientPlatform: Platform.OS
      }),
      credentials: 'omit',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const result = await response.json().catch(() => null);

    if (response.ok && result?.success) {
      const payload = result.data || result;
      const newAccessToken = payload.accessToken || payload.token;
      const newRefreshToken = payload.refreshToken || currentRefreshToken;

      if (newAccessToken) {
        socketService.updateToken(newAccessToken);
        dispatch(setCredentials({
          user: payload.user || auth.user,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }));
        
        dispatch(fetchPromoConfig());
      }
    } else if (response.status === 401 || response.status === 403) {
      const currentAuth = getState().auth;
      if (currentAuth.tokenAcquiredAt !== auth.tokenAcquiredAt) {
        console.info('[AUTH] Race condition evitee silencieusement : apiSlice a pris le relais.');
      } else {
        socketService.disconnect();
        dispatch(logout({ reason: 'WAKEUP_REFRESH_REJECTED' }));
      }
    }
  } catch (error) {
    console.error("[AUTH] Echec reseau du rafraichissement force. Session conservee:", error);
  } finally {
    isSilentRefreshing = false;
  }
};

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectToken = (state) => state.auth.token;
export const selectIsRefreshing = (state) => state.auth.isRefreshing;
export const selectSubscriptionStatus = (state) => state.auth.subscriptionStatus;
export const selectPromoMode = (state) => state.auth.promoMode;