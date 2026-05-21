import { createHttpClient, setStoredToken, clearStoredToken, getStoredToken } from './httpClient';
import { LoginRequest, RegisterRequest, LoginResponse, ApiResponse, AuthResponse } from '@/types';

const authClient = createHttpClient('/api/auth');

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await authClient.post<ApiResponse<LoginResponse>>(
      '/signin',
      credentials
    );
    return response.data.data;
  },

  register: async (data: RegisterRequest): Promise<void> => {
    await authClient.post<ApiResponse>(
      '/signup',
      {
        email: data.email,
        username: data.username,
        password: data.password,
      }
    );
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
