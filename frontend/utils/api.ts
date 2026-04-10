import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export interface Pledge {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  location: string;
  status: string;
  image?: string;
  available_until?: string;
  created_at: string;
}

export interface Wish {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  location: string;
  status: string;
  fulfilled_by?: string;
  needed_by?: string;
  urgency?: 'urgent' | 'normal' | 'flexible';
  created_at: string;
}

export interface Connection {
  id: string;
  pledge_id?: string;
  wish_id?: string;
  pledger_id: string;
  wisher_id: string;
  pledger_name?: string;
  wisher_name?: string;
  item_title?: string;
  item_type?: 'pledge' | 'wish';
  status: string;
  created_at: string;
}

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Gratitude {
  id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  connection_id?: string;
  message: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface BlockedUser {
  id: string;
  user_id: string;
  user_name: string;
  blocked_at: string;
}

// Block/Unblock user functions
export const blockUser = async (userId: string): Promise<void> => {
  await api.post(`/users/${userId}/block`);
};

export const unblockUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}/block`);
};

export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  const response = await api.get('/blocked-users');
  return response.data;
};

export const isUserBlocked = async (userId: string): Promise<boolean> => {
  const response = await api.get(`/users/${userId}/is-blocked`);
  return response.data.is_blocked;
};

// Account deletion
export const deleteAccount = async (confirmPassword: string, reason?: string): Promise<void> => {
  await api.delete('/account', { 
    data: { 
      confirm_password: confirmPassword,
      reason: reason 
    } 
  });
};
