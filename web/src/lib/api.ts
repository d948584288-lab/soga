import { User, AuthResponse } from "@/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

// 请求封装
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const token = TokenManager.getToken()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  }

  const response = await fetch(url, { ...options, headers })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "请求失败")
  }

  return data
}

// Token 管理
export class TokenManager {
  private static ACCESS_KEY = "token"
  private static REFRESH_KEY = "refreshToken"
  private static USER_KEY = "user"

  static getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(this.ACCESS_KEY)
  }

  static getAccessToken(): string | null {
    return this.getToken()
  }

  static getInstance(): typeof TokenManager {
    return this
  }

  static setTokens(access: string, refresh: string) {
    localStorage.setItem(this.ACCESS_KEY, access)
    localStorage.setItem(this.REFRESH_KEY, refresh)
  }

  static clear() {
    localStorage.removeItem(this.ACCESS_KEY)
    localStorage.removeItem(this.REFRESH_KEY)
    localStorage.removeItem(this.USER_KEY)
  }

  static getUser(): User | null {
    if (typeof window === "undefined") return null
    const userStr = localStorage.getItem(this.USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  }

  static setUser(user: User) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  static isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

// 认证 API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await request<AuthResponse>("/v1/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    TokenManager.setTokens(res.accessToken, res.refreshToken)
    TokenManager.setUser(res.user)
    return res
  },

  register: async (email: string, password: string, displayName?: string): Promise<AuthResponse> => {
    const res = await request<AuthResponse>("/v1/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    })
    TokenManager.setTokens(res.accessToken, res.refreshToken)
    TokenManager.setUser(res.user)
    return res
  },

  logout: () => {
    TokenManager.clear()
  },

  getCurrentUser: (): User | null => TokenManager.getUser(),
  isAuthenticated: (): boolean => TokenManager.isAuthenticated(),
}
