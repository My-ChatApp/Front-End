import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginRequest, RegisterRequest } from '@/types';
import { authService } from '@/services';
import { decodeJwtPayload, getUserIdFromToken } from '@/utils/jwt';
import { getUserFacingMessage } from '@/utils/userMessage';
import { validateEmail, validateLoginForm, validateRegisterForm } from '@/utils/validation';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  verifyRegistrationOtp: (email: string, otp: string) => Promise<void>;
  resendRegistrationOtp: (email: string) => Promise<void>;
  sendLoginOtp: (email: string) => Promise<void>;
  resendLoginOtp: (email: string) => Promise<void>;
  loginWithOtp: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const userFromToken = (token: string, emailFallback = ''): User => {
  const payload = decodeJwtPayload(token);
  return {
    id: payload.userId || '',
    email: payload.sub || payload.username || emailFallback,
    username: payload.username || '',
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitializing: true,
    isSubmitting: false,
    error: null,
  });

  const checkAuth = async () => {
    const token = authService.getToken();
    if (!token) {
      setState((prev) => ({ ...prev, isInitializing: false }));
      return;
    }

    try {
      const authResponse = await authService.validateToken(token);
      if (authResponse.valid) {
        const user = userFromToken(token, authResponse.email);
        if (!user.id) {
          user.id = getUserIdFromToken(token);
        }
        setState((prev) => ({
          ...prev,
          token,
          isAuthenticated: true,
          user,
          isInitializing: false,
          error: null,
        }));
      } else {
        authService.logout();
        setState((prev) => ({
          ...prev,
          isInitializing: false,
          token: null,
          isAuthenticated: false,
          user: null,
        }));
      }
    } catch {
      authService.logout();
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        token: null,
        isAuthenticated: false,
        user: null,
      }));
    }
  };

  useEffect(() => {
    void checkAuth();
  }, []);

  const applySession = (accessToken: string, emailFallback: string) => {
    authService.setToken(accessToken);
    const user = userFromToken(accessToken, emailFallback);
    setState((prev) => ({
      ...prev,
      token: accessToken,
      isAuthenticated: true,
      user,
      isSubmitting: false,
      error: null,
    }));
  };

  const runAuthAction = async (
    action: () => Promise<void>,
    fallbackError: string
  ): Promise<void> => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      await action();
      setState((prev) => ({ ...prev, isSubmitting: false, error: null }));
    } catch (error: unknown) {
      const errorMessage = getUserFacingMessage(error, fallbackError);
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const login = async (credentials: LoginRequest) => {
    const validation = validateLoginForm(credentials.email, credentials.password);
    if (!validation.valid) {
      setState((prev) => ({ ...prev, error: validation.message }));
      throw new Error(validation.message);
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      const response = await authService.login(credentials);
      if (!response?.accessToken) {
        throw new Error('Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.');
      }
      applySession(response.accessToken, credentials.email);
    } catch (error: unknown) {
      const errorMessage = getUserFacingMessage(
        error,
        'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.'
      );
      setState((prev) => ({ ...prev, isSubmitting: false, error: errorMessage }));
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    const validation = validateRegisterForm(data);
    if (!validation.valid) {
      setState((prev) => ({ ...prev, error: validation.message }));
      throw new Error(validation.message);
    }

    await runAuthAction(async () => {
      await authService.register(data);
    }, 'Đăng ký thất bại. Vui lòng thử lại.');
  };

  const verifyRegistrationOtp = async (email: string, otp: string) => {
    const emailError = validateEmail(email);
    if (emailError) {
      setState((prev) => ({ ...prev, error: emailError }));
      throw new Error(emailError);
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      const response = await authService.verifyRegistrationOtp(email, otp);
      if (!response?.accessToken) {
        throw new Error('Xác thực OTP thất bại. Vui lòng kiểm tra mã hoặc gửi lại.');
      }
      applySession(response.accessToken, email);
    } catch (error: unknown) {
      const errorMessage = getUserFacingMessage(
        error,
        'Xác thực OTP thất bại. Vui lòng kiểm tra mã hoặc gửi lại.'
      );
      setState((prev) => ({ ...prev, isSubmitting: false, error: errorMessage }));
      throw error;
    }
  };

  const resendRegistrationOtp = async (email: string) => {
    await runAuthAction(async () => {
      await authService.resendRegistrationOtp(email);
    }, 'Không gửi lại được mã OTP. Vui lòng thử lại sau.');
  };

  const sendLoginOtp = async (email: string) => {
    await runAuthAction(async () => {
      await authService.sendLoginOtp(email);
    }, 'Không gửi được mã OTP đăng nhập. Vui lòng thử lại.');
  };

  const resendLoginOtp = async (email: string) => {
    await runAuthAction(async () => {
      await authService.resendLoginOtp(email);
    }, 'Không gửi lại được mã OTP. Vui lòng thử lại sau.');
  };

  const loginWithOtp = async (email: string, otp: string) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      const response = await authService.loginWithOtp(email, otp);
      if (!response?.accessToken) {
        throw new Error('Đăng nhập bằng OTP thất bại. Vui lòng kiểm tra mã OTP.');
      }
      applySession(response.accessToken, email);
    } catch (error: unknown) {
      const errorMessage = getUserFacingMessage(
        error,
        'Đăng nhập bằng OTP thất bại. Vui lòng kiểm tra mã OTP.'
      );
      setState((prev) => ({ ...prev, isSubmitting: false, error: errorMessage }));
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    await runAuthAction(async () => {
      await authService.forgotPassword(email);
    }, 'Không gửi được yêu cầu đặt lại mật khẩu. Vui lòng thử lại.');
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await runAuthAction(async () => {
      await authService.resetPassword(token, newPassword);
    }, 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
  };

  const logout = () => {
    authService.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
      isSubmitting: false,
      error: null,
    });
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        verifyRegistrationOtp,
        resendRegistrationOtp,
        sendLoginOtp,
        resendLoginOtp,
        loginWithOtp,
        forgotPassword,
        resetPassword,
        logout,
        clearError,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
