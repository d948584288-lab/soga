import { Observable } from 'rxjs';

/**
 * 消息角色
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * 模型配置
 */
export interface ModelConfig {
  id: string;
  name: string;
  maxTokens: number;
  contextWindow: number;
  inputPrice: number;
  outputPrice: number;
  default: boolean;
  enabled: boolean;
}

/**
 * 提供商配置
 */
export interface ProviderConfig {
  name: string;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  priority: number;
  enabled: boolean;
  models: ModelConfig[];
}

/**
 * LLM 配置
 */
export interface LlmConfig {
  providers: ProviderConfig[];
  defaults: {
    temperature: number;
    topP: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
  };
  streaming: {
    enabled: boolean;
    chunkSize: number;
    maxConcurrent: number;
  };
  costControl: {
    enabled: boolean;
    maxMonthlyBudget: number;
    alertThreshold: number;
  };
}

/**
 * 聊天请求参数
 */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stream?: boolean;
  user?: string;
}

/**
 * 聊天响应（非流式）
 */
export interface ChatCompletionResponse {
  id: string;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latency: number; // 响应时间（毫秒）
}

/**
 * 流式响应块
 */
export interface ChatStreamChunk {
  id: string;
  model: string;
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * LLM Provider 接口
 */
export interface ILlmProvider {
  /**
   * 提供商名称
   */
  readonly name: string;

  /**
   * 是否可用
   */
  isAvailable(): boolean;

  /**
   * 获取可用模型列表
   */
  getModels(): ModelConfig[];

  /**
   * 获取默认模型
   */
  getDefaultModel(): ModelConfig | null;

  /**
   * 非流式聊天完成
   */
  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  /**
   * 流式聊天完成
   */
  chatStream(request: ChatCompletionRequest): Observable<ChatStreamChunk>;

  /**
   * 计算 Token 数（估算）
   */
  estimateTokens(text: string): number;

  /**
   * 计算费用
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number;
}
