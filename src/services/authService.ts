import { apiUrl } from '@/config/env';
import { createHttpClient, setStoredToken, clearStoredToken, getStoredToken } from './httpClient';
import { isUserFriendlyMessage } from '@/utils/userMessage';
import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  ApiResponse,
  AuthResponse,
} from '@/types';

const authClient = createHttpClient(apiUrl('/api/auth'));

/** Backend có thể trả HTTP 200 với success=false, data=null — không đọc accessToken trực tiếp */
function unwrapLoginResponse(
  body: ApiResponse<LoginResponse | null>,
  fallbackError: string
): LoginResponse {
  const token = body.data?.accessToken;
  if (body.success && typeof token === 'string' && token.length > 0) {
    return { accessToken: token };
  }

  const apiMessage = body.message?.trim();
  if (apiMessage && isUserFriendlyMessage(apiMessage)) {
    throw new Error(apiMessage);
  }

  throw new Error(fallbackError);
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await authClient.post<ApiResponse<LoginResponse | null>>(
      '/signin',
      credentials
    );
    return unwrapLoginResponse(
      response.data,
      'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.'
    );
  },

  register: async (data: RegisterRequest): Promise<void> => {
    await authClient.post<ApiResponse<void>>('/signup', {
      email: data.email,
      username: data.username,
      password: data.password,
    });
  },

  resendRegistrationOtp: async (email: string): Promise<void> => {
    await authClient.post<ApiResponse<void>>('/signup/resend-otp', { email });
  },

  verifyRegistrationOtp: async (email: string, otp: string): Promise<LoginResponse> => {
    const response = await authClient.post<ApiResponse<LoginResponse | null>>('/verify-otp', {
      email,
      otp,
    });
    return unwrapLoginResponse(
      response.data,
      'Xác thực OTP thất bại. Vui lòng kiểm tra mã hoặc gửi lại.'
    );
  },

  sendLoginOtp: async (email: string): Promise<void> => {
    await authClient.post<ApiResponse<void>>('/signin-otp/send', { email });
  },

  resendLoginOtp: async (email: string): Promise<void> => {
    await authClient.post<ApiResponse<void>>('/signin-otp/resend', { email });
  },

  loginWithOtp: async (email: string, otp: string): Promise<LoginResponse> => {
    const response = await authClient.post<ApiResponse<LoginResponse | null>>('/signin-otp', {
      email,
      otp,
    });
    return unwrapLoginResponse(
      response.data,
      'Đăng nhập bằng OTP thất bại. Vui lòng kiểm tra mã OTP.'
    );
  },

  forgotPassword: async (email: string): Promise<void> => {
    await authClient.post<ApiResponse<unknown>>('/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await authClient.post<ApiResponse<unknown>>('/reset-password', { token, newPassword });
  },

  validateResetToken: async (token: string): Promise<boolean> => {
    const response = await authClient.get<ApiResponse<boolean>>('/validate-reset-token', {
      params: { token },
    });
    return response.data.data === true;
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
