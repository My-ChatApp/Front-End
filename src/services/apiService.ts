import axios from 'axios';
import { authService } from './authService';

export const apiService = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiService.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const publicApiService = {
  welcome: async (): Promise<string> => {
    const response = await apiService.get('/welcome');
    return response.data;
  },
};

export const userApiService = {
  getUserContent: async (): Promise<string> => {
    const response = await apiService.get('/user');
    return response.data;
  },

  getSpecialContent: async (): Promise<string> => {
    const response = await apiService.get('/special');
    return response.data;
  },

  getAdminContent: async (): Promise<string> => {
    const response = await apiService.get('/admin');
    return response.data;
  },
};
