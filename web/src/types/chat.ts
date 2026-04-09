/**
 * 聊天相关类型定义
 */

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

export interface Session {
  id: string;
  title: string;
  model: string;
  status: string;
  messageCount: number;
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contentType?: string;
  tokens?: number;
  model?: string;
  latencyMs?: number;
  metadata?: any;
  createdAt: string;
}

export interface ChatStreamChunk {
  id: string;
  type: 'start' | 'chunk' | 'end' | 'error';
  content?: string;
  role?: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  latency?: number;
  error?: string;
}

export interface LlmModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  contextWindow: number;
  inputPrice: number;
  outputPrice: number;
  default: boolean;
}
