import axios from 'axios';
import { User, CreateUser } from '../types/incident';
import { API_BASE } from '../config/api';

export const userService = {
  authenticate: async (username: string, password: string): Promise<User> => {
    const response = await axios.post<any>(`${API_BASE}/users/login`, { username, password });
    return response.data.user || response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await axios.get<User[]>(`${API_BASE}/users`);
    return response.data;
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await axios.get<User>(`${API_BASE}/users/${id}`);
    return response.data;
  },

  createUser: async (user: CreateUser): Promise<User> => {
    const response = await axios.post<User>(`${API_BASE}/users`, user);
    return response.data;
  },

  updateUser: async (id: number, user: Partial<User>): Promise<User> => {
    const response = await axios.put<User>(`${API_BASE}/users/${id}`, user);
    return response.data;
  },

  checkFaceRegistered: async (username: string): Promise<boolean> => {
    try {
      const response = await axios.get<{ registered: boolean }>(`${API_BASE}/users/face/check/${username}`);
      return response.data.registered;
    } catch { return false; }
  },

  registerFace: async (userId: number, faceImage: string): Promise<boolean> => {
    try {
      const response = await axios.post<{ success: boolean }>(`${API_BASE}/users/face/register`, { userId, faceImage });
      return response.data.success;
    } catch { return false; }
  },

  faceLogin: async (username: string, faceImage: string): Promise<{ user: User | null; similarity?: number }> => {
    try {
      const response = await axios.post<any>(`${API_BASE}/users/face-login`, { username, faceImage });
      return { user: response.data.user || response.data };
    } catch (error: any) {
      return { user: null, similarity: error?.response?.data?.similarity };
    }
  },

  removeFace: async (userId: number): Promise<boolean> => {
    try {
      const response = await axios.delete<{ success: boolean }>(`${API_BASE}/users/${userId}/face`);
      return response.data.success;
    } catch { return false; }
  },

  deleteUser: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/users/${id}`);
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post<{ success: boolean; message: string }>(`${API_BASE}/users/forgot-password`, { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string; error?: string }> => {
    const response = await axios.post<{ success: boolean; message: string; error?: string }>(`${API_BASE}/users/reset-password`, { token, newPassword });
    return response.data;
  },
};
