import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Observable, Subscriber } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from '../../llm/llm.service';
import { RateLimitService } from '../../rate-limit/rate-limit.service';
import { ChatMessage, ChatCompletionRequest } from '../../llm/interfaces/llm-provider.interface';
import { ChatStreamResponse } from '../dto/chat.dto';

/**
 * 聊天服务
 * 处理会话管理、消息处理、流式输出
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
    private rateLimitService: RateLimitService,
  ) {}

  // ==================== 会话管理 ====================

  /**
   * 获取用户的会话列表
   */
  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        model: true,
        status: true,
        messageCount: true,
        totalTokens: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * 获取单个会话
   */
  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            contentType: true,
            tokens: true,
            model: true,
            latencyMs: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    return session;
  }

  /**
   * 创建会话
   */
  async createSession(userId: string, dto: { title?: string; model?: string; promptId?: string }) {
    // 如果没有指定模型，使用默认模型
    const model = dto.model || this.llmService.getDefaultModel()?.model.id || 'moonshot-v1-32k';

    // 生成默认标题
    const title = dto.title || `新会话 ${new Date().toLocaleString('zh-CN')}`;

    const session = await this.prisma.session.create({
      data: {
        userId,
        title,
        model,
        promptId: dto.promptId,
        status: 'ACTIVE',
      },
    });

    // 如果指定了 prompt，添加 system message
    if (dto.promptId) {
      const prompt = await this.prisma.prompt.findUnique({
        where: { id: dto.promptId },
      });

      if (prompt) {
        await this.prisma.message.create({
          data: {
            sessionId: session.id,
            role: 'SYSTEM',
            content: prompt.systemPrompt,
            contentType: 'TEXT',
          },
        });

        await this.prisma.session.update({
          where: { id: session.id },
          data: { messageCount: 1 },
        });
      }
    }

    return session;
  }

  /**
   * 删除会话（软删除）
   */
  async deleteSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'DELETED' },
    });

    return { success: true };
  }

  // ==================== 消息处理 ====================

  /**
   * 发送消息（非流式）
   */
  async sendMessage(
    userId: string,
    sessionId: string,
    content: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ) {
    // 1. 验证会话
    const session = await this.getSession(userId, sessionId);

    // 2. 限流检查
    const limitCheck = await this.rateLimitService.checkLimit(userId, 'request', 1);
    if (!limitCheck.allowed) {
      throw new ForbiddenException(limitCheck.reason || '请求过于频繁');
    }

    // 3. 获取历史消息
    const historyMessages: ChatMessage[] = session.messages.map((m) => ({
      role: m.role.toLowerCase() as any,
      content: m.content,
    }));

    // 4. 添加用户消息到数据库
    const userMessage = await this.prisma.message.create({
      data: {
        sessionId,
        role: 'USER',
        content,
        contentType: 'TEXT',
      },
    });

    // 5. 调用 LLM
    const model = options?.model || session.model;
    const request: ChatCompletionRequest = {
      model,
      messages: [...historyMessages, { role: 'user', content }],
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    };

    const startTime = Date.now();
    const response = await this.llmService.chatCompletion(request, { userId, sessionId });
    const latency = Date.now() - startTime;

    // 6. 记录 Token 消耗
    await this.rateLimitService.recordTokenUsage(userId, response.usage.totalTokens);

    // 7. 保存 AI 回复
    const assistantMessage = await this.prisma.message.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: response.content,
        contentType: 'TEXT',
        tokens: response.usage.completionTokens,
        model: response.model,
        latencyMs: latency,
      },
    });

    // 8. 更新会话统计
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        messageCount: { increment: 2 },
        totalTokens: { increment: response.usage.totalTokens },
        updatedAt: new Date(),
      },
    });

    return {
      userMessage,
      assistantMessage: {
        ...assistantMessage,
        cost: response.cost,
        latency,
      },
    };
  }

  /**
   * 发送消息（流式 SSE）
   * 这是核心方法，支持打字机效果
   */
  sendMessageStream(
    userId: string,
    sessionId: string,
    content: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Observable<ChatStreamResponse> {
    return new Observable((subscriber: Subscriber<ChatStreamResponse>) => {
      let isCleanedUp = false;

      const execute = async () => {
        try {
          // 1. 验证会话
          const session = await this.getSession(userId, sessionId);

          // 2. 限流检查
          const limitCheck = await this.rateLimitService.checkLimit(userId, 'request', 1);
          if (!limitCheck.allowed) {
            subscriber.next({
              id: 'error',
              type: 'error',
              error: limitCheck.reason || '请求过于频繁',
            });
            subscriber.complete();
            return;
          }

          // 3. 获取历史消息
          const historyMessages: ChatMessage[] = session.messages.map((m) => ({
            role: m.role.toLowerCase() as any,
            content: m.content,
          }));

          // 4. 保存用户消息
          const userMessage = await this.prisma.message.create({
            data: {
              sessionId,
              role: 'USER',
              content,
              contentType: 'TEXT',
            },
          });

          // 5. 发送开始事件
          subscriber.next({
            id: userMessage.id,
            type: 'start',
            role: 'assistant',
          });

          // 6. 调用 LLM 流式接口
          const model = options?.model || session.model;
          const request: ChatCompletionRequest = {
            model,
            messages: [...historyMessages, { role: 'user', content }],
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
            stream: true,
          };

          const startTime = Date.now();
          let fullContent = '';
          let messageId = '';
          let finishReason: string | undefined;

          const stream = this.llmService.chatStream(request, { userId, sessionId });

          stream.subscribe({
            next: (chunk) => {
              if (isCleanedUp) return;

              fullContent += chunk.content;
              messageId = chunk.id;
              finishReason = chunk.finishReason;

              // 发送内容块
              subscriber.next({
                id: chunk.id,
                type: 'chunk',
                content: chunk.content,
              });
            },
            error: (error) => {
              if (isCleanedUp) return;

              this.logger.error('Stream error', error);
              subscriber.next({
                id: messageId || 'error',
                type: 'error',
                error: error.message || '生成失败',
              });
              subscriber.complete();
            },
            complete: async () => {
              if (isCleanedUp) return;

              const latency = Date.now() - startTime;

              // 估算 token（流式没有准确 usage）
              const inputTokens = this.llmService.estimateTokens(historyMessages);
              const outputTokens = this.llmService.estimateTokens([{ role: 'assistant', content: fullContent }]);
              const totalTokens = inputTokens + outputTokens;
              const cost = this.llmService.calculateCost(model, inputTokens, outputTokens);

              // 保存 AI 回复到数据库
              try {
                await this.prisma.message.create({
                  data: {
                    sessionId,
                    role: 'ASSISTANT',
                    content: fullContent,
                    contentType: 'TEXT',
                    tokens: outputTokens,
                    model,
                    latencyMs: latency,
                  },
                });

                // 更新会话统计
                await this.prisma.session.update({
                  where: { id: sessionId },
                  data: {
                    messageCount: { increment: 2 },
                    totalTokens: { increment: totalTokens },
                    updatedAt: new Date(),
                  },
                });

                // 记录 Token 消耗
                await this.rateLimitService.recordTokenUsage(userId, totalTokens);
              } catch (dbError) {
                this.logger.error('Failed to save message', dbError);
              }

              // 发送结束事件
              subscriber.next({
                id: messageId,
                type: 'end',
                finishReason: finishReason || 'stop',
                usage: {
                  promptTokens: inputTokens,
                  completionTokens: outputTokens,
                  totalTokens,
                },
                cost,
                latency,
              });

              subscriber.complete();
            },
          });
        } catch (error) {
          if (isCleanedUp) return;

          this.logger.error('Execute error', error);
          subscriber.next({
            id: 'error',
            type: 'error',
            error: error.message || '执行失败',
          });
          subscriber.complete();
        }
      };

      execute();

      // 清理函数
      return () => {
        isCleanedUp = true;
      };
    });
  }

  /**
   * 获取会话的消息历史
   */
  async getMessages(userId: string, sessionId: string) {
    // 验证会话所有权
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        contentType: true,
        tokens: true,
        model: true,
        latencyMs: true,
        metadata: true,
        createdAt: true,
      },
    });
  }

  /**
   * 清空会话历史
   */
  async clearMessages(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    await this.prisma.message.deleteMany({
      where: { sessionId },
    });

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        messageCount: 0,
        totalTokens: 0,
      },
    });

    return { success: true };
  }
}
