/**
 * API 客户端 - 企业级封装
 * - 统一错误处理
 * - Token 刷新机制
 * - 请求/响应拦截
 */

import { User, Session, Message, LlmModel } from '@/types/chat';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ======== 类型定义 ========

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// ======== Token 管理 ========

class TokenManager {
  private static ACCESS_TOKEN_KEY = 'token';
  private static REFRESH_TOKEN_KEY = 'refreshToken';
  private static USER_KEY = 'user';
  private static REMEMBER_KEY = 'remember';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY) || sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) || sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string, remember: boolean = false) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    if (remember) {
      localStorage.setItem(this.REMEMBER_KEY, 'true');
    }
  }

  static clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REMEMBER_KEY);
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user: User) {
    const remember = localStorage.getItem(this.REMEMBER_KEY) === 'true';
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static isRemembered(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.REMEMBER_KEY) === 'true';
  }
}

// ======== 请求封装 ========

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuth: boolean = false
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // 添加认证头
  if (!skipAuth) {
    const token = TokenManager.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 处理 401 - Token 过期，尝试刷新
    if (response.status === 401 && !skipAuth) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // 重试原请求
        return request(endpoint, options, skipAuth);
      } else {
        // 刷新失败，清除登录状态
        TokenManager.clearTokens();
        window.location.href = '/';
        throw new Error('登录已过期，请重新登录');
      }
    }

    // 解析响应
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error: ApiError = {
        message: data.message || data || '请求失败',
        statusCode: response.status,
        code: data.code,
      };
      throw error;
    }

    return data as T;
  } catch (error) {
    if ((error as ApiError).statusCode) {
      throw error;
    }
    // 网络错误
    throw {
      message: '网络连接失败，请检查网络',
      statusCode: 0,
    } as ApiError;
  }
}

// Token 刷新
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing) {
    return refreshPromise!;
  }

  isRefreshing = true;
  refreshPromise = doRefresh();
  
  try {
    return await refreshPromise;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = TokenManager.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await request<AuthResponse>(
      '/api/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
      true // 跳过认证检查
    );

    TokenManager.setTokens(
      response.accessToken,
      response.refreshToken,
      TokenManager.isRemembered()
    );
    TokenManager.setUser(response.user);
    return true;
  } catch {
    return false;
  }
}

// ======== API 方法 ========

export const authApi = {
  /**
   * 登录
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await request<AuthResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      },
      true
    );
    
    TokenManager.setTokens(
      response.accessToken,
      response.refreshToken,
      data.remember
    );
    TokenManager.setUser(response.user);
    return response;
  },

  /**
   * 注册
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await request<AuthResponse>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true
    );
    
    TokenManager.setTokens(response.accessToken, response.refreshToken, false);
    TokenManager.setUser(response.user);
    return response;
  },

  /**
   * 忘记密码
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    // TODO: 后端需要实现此接口
    return { message: '密码重置链接已发送到您的邮箱' };
  },

  /**
   * 重置密码
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    // TODO: 后端需要实现此接口
    return { message: '密码重置成功' };
  },

  /**
   * 退出登录
   */
  logout: () => {
    TokenManager.clearTokens();
  },

  /**
   * 获取当前用户
   */
  getCurrentUser: (): User | null => {
    return TokenManager.getUser();
  },

  /**
   * 检查是否已登录
   */
  isAuthenticated: (): boolean => {
    return !!TokenManager.getAccessToken();
  },
};

// ======== 聊天 API ========

export const chatApi = {
  getSessions: () =>
    request<{ data: Session[] }>('/api/chat/sessions'),

  getSession: (id: string) =>
    request<Session & { messages: Message[] }>(`/api/chat/sessions/${id}`),

  createSession: (data?: { title?: string; model?: string }) =>
    request<Session>('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  deleteSession: (id: string) =>
    request<{ success: boolean }>(`/api/chat/sessions/${id}`, {
      method: 'DELETE',
    }),

  getMessages: (sessionId: string) =>
    request<{ data: Message[] }>(`/api/chat/sessions/${sessionId}/messages`),

  sendMessage: (sessionId: string, content: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) =>
    request<{ userMessage: Message; assistantMessage: Message }>(
      `/api/chat/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content, ...options }),
      }
    ),

  clearMessages: (sessionId: string) =>
    request<{ success: boolean }>(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'DELETE',
    }),
};

// ======== LLM API ========

export const llmApi = {
  getModels: () =>
    request<{ data: LlmModel[]; default: { id: string; provider: string } | null }>(
      '/api/llm/models'
    ),
};

// ======== 流式聊天 ========

export interface StreamOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onChunk?: (content: string) => void;
  onComplete?: (data: {
    fullContent: string;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    cost?: number;
    latency?: number;
  }) => void;
  onError?: (error: Error) => void;
}

export function createChatStream(
  sessionId: string,
  content: string,
  options: StreamOptions = {}
): { start: () => Promise<void>; cancel: () => void } {
  const token = TokenManager.getAccessToken();
  let abortController: AbortController | null = null;

  const start = async () => {
    if (!token) {
      options.onError?.(new Error('请先登录'));
      return;
    }

    abortController = new AbortController();
    let fullContent = '';

    try {
      const response = await fetch(
        `${API_BASE}/api/chat/sessions/${sessionId}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            content,
            stream: true,
            model: options.model,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: '请求失败' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              
              if (data.type === 'chunk' && data.content) {
                fullContent += data.content;
                options.onChunk?.(fullContent);
              } else if (data.type === 'end') {
                options.onComplete?.({
                  fullContent,
                  usage: data.usage,
                  cost: data.cost,
                  latency: data.latency,
                });
                return;
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Stream error');
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        options.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  const cancel = () => {
    abortController?.abort();
  };

  return { start, cancel };
}

export { TokenManager };
export default {
  auth: authApi,
  chat: chatApi,
  llm: llmApi,
};
