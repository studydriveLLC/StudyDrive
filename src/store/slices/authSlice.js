import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isTokenRefreshing: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = !!token;
      state.isLoading = false;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isTokenRefreshing = false;
    },
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setTokenRefreshing: (state, action) => {
      state.isTokenRefreshing = action.payload;
    }
  },
});

export const { setCredentials, updateUser, logout, setAuthLoading, setTokenRefreshing } = authSlice.actions;

export default authSlice.reducer;