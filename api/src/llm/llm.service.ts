import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Observable, catchError, throwError, finalize } from 'rxjs';
import { LlmConfigService } from './llm-config.service';
import { MoonshotProvider } from './providers/moonshot.provider';
import {
  ILlmProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatStreamChunk,
  ChatMessage,
  ModelConfig,
} from './interfaces/llm-provider.interface';

/**
 * LLM 网关服务
 * - 统一接入多提供商
 * - 自动 fallback
 * - Token 和成本计算
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private providers: Map<string, ILlmProvider> = new Map();

  constructor(private configService: LlmConfigService) {
    this.initializeProviders();
  }

  /**
   * 初始化所有启用的提供商
   */
  private initializeProviders(): void {
    for (const providerConfig of this.configService.getEnabledProviders()) {
      try {
        switch (providerConfig.name) {
          case 'moonshot':
            this.providers.set(providerConfig.name, new MoonshotProvider(providerConfig));
            this.logger.log(`Initialized provider: ${providerConfig.name}`);
            break;
          // TODO: 添加其他提供商
          // case 'openai':
          //   this.providers.set(providerConfig.name, new OpenAIProvider(providerConfig));
          //   break;
          default:
            this.logger.warn(`Unknown provider: ${providerConfig.name}`);
        }
      } catch (error) {
        this.logger.error(`Failed to initialize provider ${providerConfig.name}`, error);
      }
    }
  }

  /**
   * 获取可用提供商
   */
  private getAvailableProviders(): ILlmProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isAvailable());
  }

  /**
   * 获取指定提供商
   */
  getProvider(name: string): ILlmProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * 获取所有可用模型
   */
  getAvailableModels(): Array<{ provider: string; model: ModelConfig }> {
    return this.configService.getAllModels();
  }

  /**
   * 获取默认模型
   */
  getDefaultModel(): { provider: string; model: ModelConfig } {
    const defaultModel = this.configService.getDefaultModel();
    if (!defaultModel) {
      throw new ServiceUnavailableException('No LLM models available');
    }
    return defaultModel;
  }

  /**
   * 验证模型是否可用
   */
  validateModel(modelId: string): { provider: string; model: ModelConfig } {
    const config = this.configService.getModelConfig(modelId);
    if (!config) {
      throw new NotFoundException(`Model not found or not enabled: ${modelId}`);
    }
    return config;
  }

  /**
   * 非流式聊天完成
   */
  async chatCompletion(
    request: ChatCompletionRequest,
    options?: { userId?: string; sessionId?: string },
  ): Promise<ChatCompletionResponse & { provider: string; cost: number }> {
    // 如果没有指定模型，使用默认模型
    if (!request.model) {
      const defaultModel = this.getDefaultModel();
      request.model = defaultModel.model.id;
    }

    // 验证模型
    const modelConfig = this.validateModel(request.model);
    const provider = this.getProvider(modelConfig.provider);

    if (!provider) {
      throw new ServiceUnavailableException(`Provider ${modelConfig.provider} not available`);
    }

    const startTime = Date.now();

    try {
      const response = await provider.chatCompletion(request);
      const latency = Date.now() - startTime;

      // 计算成本
      const cost = provider.calculateCost(
        request.model,
        response.usage.promptTokens,
        response.usage.completionTokens,
      );

      this.logger.debug(
        `Chat completion: ${modelConfig.provider}/${request.model}, ` +
          `tokens: ${response.usage.totalTokens}, cost: $${cost.toFixed(6)}, latency: ${latency}ms`,
      );

      return {
        ...response,
        provider: modelConfig.provider,
        cost,
      };
    } catch (error) {
      this.logger.error(
        `Chat completion failed for ${modelConfig.provider}/${request.model}`,
        error,
      );

      // 尝试 fallback 到其他提供商
      const fallbackResponse = await this.tryFallback(request, modelConfig.provider);
      if (fallbackResponse) {
        return fallbackResponse;
      }

      throw new ServiceUnavailableException(`All LLM providers failed: ${error.message}`);
    }
  }

  /**
   * 流式聊天完成
   */
  chatStream(
    request: ChatCompletionRequest,
    options?: { userId?: string; sessionId?: string },
  ): Observable<ChatStreamChunk & { provider: string; cost?: number }> {
    // 如果没有指定模型，使用默认模型
    if (!request.model) {
      const defaultModel = this.getDefaultModel();
      request.model = defaultModel.model.id;
    }

    // 验证模型
    const modelConfig = this.validateModel(request.model);
    const provider = this.getProvider(modelConfig.provider);

    if (!provider) {
      return throwError(() => new ServiceUnavailableException(`Provider ${modelConfig.provider} not available`));
    }

    const startTime = Date.now();
    let totalContent = '';
    let finishReason: string | undefined;

    return provider.chatStream(request).pipe(
      catchError((error) => {
        this.logger.error(`Stream failed for ${modelConfig.provider}`, error);
        // 流式不支持 fallback，直接报错
        return throwError(() => new ServiceUnavailableException(`Stream failed: ${error.message}`));
      }),
      finalize(() => {
        const latency = Date.now() - startTime;
        
        // 估算 token 数并计算成本（流式响应没有准确 usage）
        if (totalContent) {
          const inputTokens = provider.estimateTokens(
            request.messages.map((m) => m.content).join(''),
          );
          const outputTokens = provider.estimateTokens(totalContent);
          const cost = provider.calculateCost(request.model, inputTokens, outputTokens);

          this.logger.debug(
            `Stream completed: ${modelConfig.provider}/${request.model}, ` +
              `estimated tokens: ${inputTokens}/${outputTokens}, cost: $${cost.toFixed(6)}, latency: ${latency}ms`,
          );
        }
      }),
      // 转换并收集内容
      (source) => {
        return new Observable((subscriber) => {
          return source.subscribe({
            next: (chunk) => {
              totalContent += chunk.content;
              if (chunk.finishReason) {
                finishReason = chunk.finishReason;
              }
              subscriber.next({
                ...chunk,
                provider: modelConfig.provider,
              });
            },
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
      },
    );
  }

  /**
   * 尝试 fallback 到其他提供商
   */
  private async tryFallback(
    request: ChatCompletionRequest,
    failedProvider: string,
  ): Promise<(ChatCompletionResponse & { provider: string; cost: number }) | null> {
    const availableProviders = this.getAvailableProviders().filter(
      (p) => p.name !== failedProvider,
    );

    for (const provider of availableProviders) {
      try {
        this.logger.warn(`Trying fallback to provider: ${provider.name}`);

        // 尝试使用相同模型 ID，如果不支持会报错
        const response = await provider.chatCompletion(request);
        const cost = provider.calculateCost(
          request.model,
          response.usage.promptTokens,
          response.usage.completionTokens,
        );

        this.logger.log(`Fallback successful: ${provider.name}`);

        return {
          ...response,
          provider: provider.name,
          cost,
        };
      } catch (error) {
        this.logger.error(`Fallback to ${provider.name} failed`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * 估算消息 Token 数
   */
  estimateTokens(messages: ChatMessage[], model?: string): number {
    const text = messages.map((m) => m.content).join('');
    const provider = this.getAvailableProviders()[0];
    return provider?.estimateTokens(text) || Math.ceil(text.length * 0.5);
  }

  /**
   * 计算成本
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const modelConfig = this.configService.getModelConfig(model);
    if (!modelConfig) return 0;

    const provider = this.getProvider(modelConfig.provider);
    return provider?.calculateCost(model, inputTokens, outputTokens) || 0;
  }
}
