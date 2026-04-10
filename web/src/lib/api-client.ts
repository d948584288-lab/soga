"use client"

import { TokenManager } from "./api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1/api"

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options
    
    let url = `${API_BASE}${endpoint}`
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    const token = TokenManager.getAccessToken()

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "请求失败" }))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" })
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" })
  }
}

const apiClient = new ApiClient()

// Chat API
export const chatApi = {
  getSessions: (page = 1, limit = 20) =>
    apiClient.get<{ items: any[]; total: number }>("/chat/sessions", {
      params: { page, limit },
    }),

  getSession: (id: string) => apiClient.get(`/chat/sessions/${id}`),

  createSession: (data: { title?: string; model?: string }) =>
    apiClient.post("/chat/sessions", data),

  deleteSession: (id: string) => apiClient.delete(`/chat/sessions/${id}`),

  getMessages: (sessionId: string) =>
    apiClient.get<{ data: any[] }>(`/chat/sessions/${sessionId}/messages`),

  sendMessageStream: (sessionId: string, data: { content: string; model?: string }) => {
    const token = TokenManager.getAccessToken()
    return fetch(`${API_BASE}/chat/sessions/${sessionId}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    })
  },
}

// LLM API
export const llmApi = {
  getModels: () => apiClient.get<{ data: any[]; default: any }>("/llm/models"),
}

// Auth API
export const authApiClient = {
  login: (email: string, password: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string; user: any }>(
      "/auth/login",
      { email, password }
    ),

  register: (email: string, password: string, displayName?: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string; user: any }>(
      "/auth/register",
      { email, password, displayName }
    ),
}
