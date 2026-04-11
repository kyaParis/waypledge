import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || 'https://pledge-app-redesign.preview.emergentagent.com') + '/api';

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

// Admin functions
export interface PendingUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  email_verified: boolean;
}

export const getPendingUsers = async (): Promise<PendingUser[]> => {
  const response = await api.get('/admin/pending-users');
  return response.data;
};

export const approveUser = async (userId: string): Promise<void> => {
  await api.post(`/admin/approve-user/${userId}`);
};

export const rejectUser = async (userId: string): Promise<void> => {
  await api.post(`/admin/reject-user/${userId}`);
};

// Cloudinary image upload
export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloud_name: string;
  api_key: string;
  folder: string;
  resource_type: string;
}

export const getCloudinarySignature = async (folder: string = 'waypledge'): Promise<CloudinarySignature> => {
  const response = await api.get(`/cloudinary/signature?folder=${folder}`);
  return response.data;
};

export const uploadImageToCloudinary = async (
  imageUri: string, 
  folder: string = 'waypledge'
): Promise<string> => {
  // Get signature from backend
  const sig = await getCloudinarySignature(folder);
  
  // Create form data
  const formData = new FormData();
  
  // Handle different URI formats (file:// for mobile, blob for web)
  const filename = imageUri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  formData.append('file', {
    uri: imageUri,
    name: filename,
    type: type,
  } as any);
  formData.append('api_key', sig.api_key);
  formData.append('timestamp', sig.timestamp.toString());
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);
  
  // Upload to Cloudinary
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to upload image');
  }
  
  // Return the secure URL with auto-optimization
  return result.secure_url;
};
