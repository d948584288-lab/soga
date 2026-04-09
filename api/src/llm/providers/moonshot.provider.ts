import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subscriber } from 'rxjs';
import {
  ILlmProvider,
  type ChatMessage,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type ChatStreamChunk,
  type ModelConfig,
  type ProviderConfig,
} from '../interfaces/llm-provider.interface';

/**
 * 月之暗面 Kimi Provider
 * 兼容 OpenAI API 格式
 */
@Injectable()
export class MoonshotProvider implements ILlmProvider {
  readonly name = 'moonshot';
  private readonly logger = new Logger(MoonshotProvider.name);

  constructor(private config: ProviderConfig) {}

  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  getModels(): ModelConfig[] {
    return this.config.models.filter((m) => m.enabled);
  }

  getDefaultModel(): ModelConfig | null {
    return this.config.models.find((m) => m.default && m.enabled) || this.getModels()[0] || null;
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          top_p: request.topP ?? 1,
          max_tokens: request.maxTokens,
          presence_penalty: request.presencePenalty ?? 0,
          frequency_penalty: request.frequencyPenalty ?? 0,
          stream: false,
          user: request.user,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Moonshot API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      return {
        id: data.id,
        model: data.model,
        content: data.choices[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        finishReason: data.choices[0]?.finish_reason || 'stop',
        latency,
      };
    } catch (error) {
      this.logger.error('Chat completion failed', error);
      throw error;
    }
  }

  chatStream(request: ChatCompletionRequest): Observable<ChatStreamChunk> {
    return new Observable((subscriber: Subscriber<ChatStreamChunk>) => {
      const abortController = new AbortController();

      const fetchStream = async () => {
        try {
          const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Accept': 'text/event-stream',
            },
            body: JSON.stringify({
              model: request.model,
              messages: request.messages,
              temperature: request.temperature ?? 0.7,
              top_p: request.topP ?? 1,
              max_tokens: request.maxTokens,
              presence_penalty: request.presencePenalty ?? 0,
              frequency_penalty: request.frequencyPenalty ?? 0,
              stream: true,
              user: request.user,
            }),
            signal: abortController.signal,
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Moonshot API error: ${response.status} ${error}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  subscriber.complete();
                  return;
                }

                try {
                  const chunk = JSON.parse(data);
                  const choice = chunk.choices?.[0];
                  if (choice) {
                    subscriber.next({
                      id: chunk.id,
                      model: chunk.model,
                      content: choice.delta?.content || '',
                      finishReason: choice.finish_reason,
                    });
                  }
                } catch (e) {
                  this.logger.warn('Failed to parse SSE chunk', data);
                }
              }
            }
          }

          subscriber.complete();
        } catch (error) {
          if (error.name !== 'AbortError') {
            this.logger.error('Stream error', error);
            subscriber.error(error);
          }
        }
      };

      fetchStream();

      // 清理函数
      return () => {
        abortController.abort();
      };
    });
  }

  /**
   * 估算 Token 数（简化版）
   * 中文：1 字 ≈ 1.5 tokens
   * 英文：1 词 ≈ 1.3 tokens
   */
  estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const otherChars = text.length - chineseChars - englishWords;
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + otherChars * 0.5);
  }

  /**
   * 计算费用（美元）
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const modelConfig = this.config.models.find((m) => m.id === model);
    if (!modelConfig) return 0;

    const inputCost = (inputTokens / 1000) * modelConfig.inputPrice;
    const outputCost = (outputTokens / 1000) * modelConfig.outputPrice;
    return inputCost + outputCost;
  }
}
