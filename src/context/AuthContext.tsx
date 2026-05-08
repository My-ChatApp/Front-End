import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginRequest, RegisterRequest } from '@/types';
import { authService } from '@/services';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = authService.getToken();
    if (token) {
      try {
        const authResponse = await authService.validateToken(token);
        if (authResponse.valid) {
          setState((prev) => ({
            ...prev,
            token,
            isAuthenticated: true,
            user: {
              id: '',
              email: authResponse.email,
              username: '',
            },
            isLoading: false,
            error: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            token: null,
            isAuthenticated: false,
          }));
          authService.logout();
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          token: null,
          isAuthenticated: false,
        }));
        authService.logout();
      }
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const login = async (credentials: LoginRequest) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await authService.login(credentials);
      authService.setToken(response.accessToken);

      setState((prev) => ({
        ...prev,
        token: response.accessToken,
        isAuthenticated: true,
        user: {
          id: '',
          email: credentials.email,
          username: '',
        },
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Login failed';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await authService.register(data);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Registration failed';

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
    setState((prev) => ({
      ...prev,
      error: null,
    }));
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
