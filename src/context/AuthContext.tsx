import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginRequest, RegisterRequest } from '@/types';
import { authService } from '@/services';
import { decodeJwtPayload, getUserIdFromToken } from '@/utils/jwt';
import { validateLoginForm, validateRegisterForm } from '@/utils/validation';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
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
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = authService.getToken();
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
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
          isLoading: false,
          error: null,
        }));
      } else {
        authService.logout();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          token: null,
          isAuthenticated: false,
          user: null,
        }));
      }
    } catch {
      authService.logout();
      setState((prev) => ({
        ...prev,
        isLoading: false,
        token: null,
        isAuthenticated: false,
        user: null,
      }));
    }
  };

  const applySession = (accessToken: string, emailFallback: string) => {
    authService.setToken(accessToken);
    const user = userFromToken(accessToken, emailFallback);
    setState((prev) => ({
      ...prev,
      token: accessToken,
      isAuthenticated: true,
      user,
      isLoading: false,
      error: null,
    }));
  };

  const login = async (credentials: LoginRequest) => {
    const validation = validateLoginForm(credentials.email, credentials.password);
    if (!validation.valid) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: validation.message,
      }));
      throw new Error(validation.message);
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.login(credentials);
      applySession(response.accessToken, credentials.email);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.message || err.message || 'Login failed';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    const validation = validateRegisterForm(data);
    if (!validation.valid) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: validation.message,
      }));
      throw new Error(validation.message);
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authService.register(data);
      applySession(response.accessToken, data.email);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.message || err.message || 'Registration failed';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
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
