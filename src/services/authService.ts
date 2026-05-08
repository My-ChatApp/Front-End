import axios, { AxiosInstance } from 'axios';
import { LoginRequest, RegisterRequest, LoginResponse, ApiResponse, AuthResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
    this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  clearToken() {
    localStorage.removeItem('token');
    delete this.client.defaults.headers.common.Authorization;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getInstance() {
    return this.client;
  }
}

const apiClient = new ApiClient();

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.getInstance().post<ApiResponse<LoginResponse>>(
      '/auth/signin',
      credentials
    );
    return response.data.data;
  },

  register: async (data: RegisterRequest): Promise<void> => {
    await apiClient.getInstance().post<ApiResponse>(
      '/auth/signup',
      {
        email: data.email,
        username: data.username,
        password: data.password,
      }
    );
  },

  validateToken: async (token: string): Promise<AuthResponse> => {
    const response = await apiClient.getInstance().post<AuthResponse>(
      '/auth/validate',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  logout: () => {
    apiClient.clearToken();
  },

  setToken: (token: string) => {
    apiClient.setToken(token);
  },

  getToken: (): string | null => {
    return apiClient.getToken();
  },
};

export default apiClient;
