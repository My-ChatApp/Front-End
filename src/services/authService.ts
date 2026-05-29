import { apiUrl } from '@/config/env';
import { createHttpClient, setStoredToken, clearStoredToken, getStoredToken } from './httpClient';
import { LoginRequest, RegisterRequest, LoginResponse, ApiResponse, AuthResponse } from '@/types';

const authClient = createHttpClient(apiUrl('/api/auth'));

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await authClient.post<ApiResponse<LoginResponse>>(
      '/signin',
      credentials
    );
    return response.data.data;
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await authClient.post<ApiResponse<LoginResponse>>(
      '/signup',
      {
        email: data.email,
        username: data.username,
        password: data.password,
      }
    );
    return response.data.data;
  },

  validateToken: async (token: string): Promise<AuthResponse> => {
    const response = await authClient.post<AuthResponse>(
      '/validate',
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
    clearStoredToken();
  },

  setToken: (token: string) => {
    setStoredToken(token);
  },

  getToken: (): string | null => {
    return getStoredToken();
  },
};
