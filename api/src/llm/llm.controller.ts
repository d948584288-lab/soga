import { Controller, Get, Post, Body, Sse, Query, UseGuards } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { LlmService } from './llm.service';
import { type ChatCompletionRequest, type ChatStreamChunk } from './interfaces/llm-provider.interface';

/**
 * LLM 控制器
 * 提供模型列表、聊天完成（非流式/流式）接口
 */
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  /**
   * 获取可用模型列表
   */
  @Get('models')
  getModels() {
    const models = this.llmService.getAvailableModels();
    const defaultModel = this.llmService.getDefaultModel();

    return {
      data: models.map(({ provider, model }) => ({
        id: model.id,
        name: model.name,
        provider,
        maxTokens: model.maxTokens,
        contextWindow: model.contextWindow,
        inputPrice: model.inputPrice,
        outputPrice: model.outputPrice,
        default: model.default,
      })),
      default: defaultModel
        ? {
            id: defaultModel.model.id,
            provider: defaultModel.provider,
          }
        : null,
    };
  }

  /**
   * 非流式聊天完成
   */
  @Post('chat/completions')
  async chatCompletion(@Body() request: ChatCompletionRequest) {
    const result = await this.llmService.chatCompletion(request);

    return {
      id: result.id,
      model: result.model,
      content: result.content,
      usage: result.usage,
      finishReason: result.finishReason,
      provider: result.provider,
      cost: result.cost,
      latency: result.latency,
    };
  }

  /**
   * 流式聊天完成 (SSE)
   */
  @Sse('chat/stream')
  chatStream(@Query('model') model: string, @Body() body: { messages: any[]; temperature?: number; maxTokens?: number }) {
    const request: ChatCompletionRequest = {
      model,
      messages: body.messages,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      stream: true,
    };

    return this.llmService.chatStream(request).pipe(
      map((chunk) => ({
        event: 'message',
        data: JSON.stringify({
          id: chunk.id,
          model: chunk.model,
          content: chunk.content,
          finishReason: chunk.finishReason,
          provider: chunk.provider,
        }),
      })),
    );
  }
}
