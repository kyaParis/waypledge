import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface User {
  id: string;
  email: string;
  name: string;
  display_name?: string;
  bio: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  avatar: string | null;
  created_at: string;
  is_admin: boolean;
  email_verified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, bio: string, location: string, latitude?: number | null, longitude?: number | null, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  setUser: (user: User) => void;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { access_token, user } = response.data;
      await AsyncStorage.setItem('token', access_token);
      set({ token: access_token, user, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (email: string, password: string, name: string, bio: string, location: string, latitude?: number | null, longitude?: number | null, displayName?: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name,
        display_name: displayName,
        bio,
        location,
        latitude,
        longitude
      });
      const { access_token, user } = response.data;
      await AsyncStorage.setItem('token', access_token);
      set({ token: access_token, user, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        set({ token, user: response.data, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      await AsyncStorage.removeItem('token');
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user: User) => set({ user }),

  verifyEmail: async (code: string) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    try {
      await axios.post(
        `${API_URL}/auth/verify-email`,
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh user data to get updated email_verified status
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Verification failed');
    }
  },

  resendVerification: async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    
    try {
      await axios.post(
        `${API_URL}/auth/resend-verification`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to resend verification');
    }
  }
}));
