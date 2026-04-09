/**
 * 认证状态管理 - Context
 * 全局用户状态、登录/登出逻辑
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User } from '@/types/chat';
import { authApi, TokenManager } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 初始化：检查本地存储的登录状态
  useEffect(() => {
    const initAuth = () => {
      const user = TokenManager.getCurrentUser();
      const isAuthenticated = TokenManager.isAuthenticated();
      
      setState({
        user,
        isAuthenticated,
        isLoading: false,
      });
    };

    initAuth();
  }, []);

  // 登录
  const login = useCallback(async (email: string, password: string, remember?: boolean) => {
    const response = await authApi.login({ email, password, remember });
    
    setState({
      user: response.user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  // 注册
  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const response = await authApi.register({ email, password, displayName });
    
    setState({
      user: response.user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  // 登出
  const logout = useCallback(() => {
    authApi.logout();
    
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  // 检查认证状态（用于页面刷新后）
  const checkAuth = useCallback(async (): Promise<boolean> => {
    const isAuthenticated = TokenManager.isAuthenticated();
    const user = TokenManager.getCurrentUser();
    
    setState({
      user,
      isAuthenticated,
      isLoading: false,
    });
    
    return isAuthenticated;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 高阶组件：保护路由
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // 或者返回登录提示
    }

    return <Component {...props} />;
  };
}
