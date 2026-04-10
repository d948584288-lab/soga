import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Sse,
  UseGuards,
  ParseEnumPipe,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ChatService } from './services/chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { CurrentUser, type CurrentUserType } from '../auth/decorators/current-user.decorator';
import {
  CreateSessionDto,
  SendMessageDto,
  ChatStreamResponse,
  SessionResponseDto,
  MessageResponseDto,
} from './dto/chat.dto';
import { map } from 'rxjs/operators';

/**
 * 聊天控制器
 * 提供会话管理、消息发送（含流式）接口
 */
@ApiTags('聊天')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RateLimitGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ==================== 会话管理 ====================

  /**
   * 获取会话列表
   */
  @Get('sessions')
  @ApiOperation({ summary: '获取会话列表' })
  async getSessions(
    @CurrentUser() user: CurrentUserType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: SessionResponseDto[]; total: number; page: number; limit: number }> {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '20', 10);
    const result = await this.chatService.getSessions(user.userId, pageNum, limitNum);
    return { 
      items: result.items as SessionResponseDto[],
      total: result.total,
      page: pageNum,
      limit: limitNum,
    };
  }

  /**
   * 获取单个会话（含消息历史）
   */
  @Get('sessions/:id')
  @ApiOperation({ summary: '获取会话详情' })
  @ApiParam({ name: 'id', description: '会话ID' })
  async getSession(
    @CurrentUser() user: CurrentUserType,
    @Param('id') sessionId: string,
  ) {
    return this.chatService.getSession(user.userId, sessionId);
  }

  /**
   * 创建会话
   */
  @Post('sessions')
  @ApiOperation({ summary: '创建新会话' })
  async createSession(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    return this.chatService.createSession(user.userId, dto) as Promise<SessionResponseDto>;
  }

  /**
   * 删除会话
   */
  @Delete('sessions/:id')
  @ApiOperation({ summary: '删除会话' })
  @ApiParam({ name: 'id', description: '会话ID' })
  async deleteSession(
    @CurrentUser() user: CurrentUserType,
    @Param('id') sessionId: string,
  ) {
    return this.chatService.deleteSession(user.userId, sessionId);
  }

  // ==================== 消息处理 ====================

  /**
   * 获取消息历史
   */
  @Get('sessions/:id/messages')
  @ApiOperation({ summary: '获取会话消息历史' })
  @ApiParam({ name: 'id', description: '会话ID' })
  async getMessages(
    @CurrentUser() user: CurrentUserType,
    @Param('id') sessionId: string,
  ): Promise<{ data: MessageResponseDto[] }> {
    const messages = await this.chatService.getMessages(user.userId, sessionId);
    return { data: messages as MessageResponseDto[] };
  }

  /**
   * 发送消息（非流式）
   * 用于简单场景或测试
   */
  @Post('sessions/:id/messages')
  @ApiOperation({ summary: '发送消息（非流式）' })
  @ApiParam({ name: 'id', description: '会话ID' })
  async sendMessage(
    @CurrentUser() user: CurrentUserType,
    @Param('id') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.userId, sessionId, dto.content, {
      model: dto.model,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
    });
  }

  /**
   * 发送消息（流式 SSE）
   * 核心接口，支持打字机效果
   */
  @Post('sessions/:id/stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')  // 禁用 Nginx 缓冲
  @ApiOperation({ summary: '发送消息（流式SSE）' })
  @ApiParam({ name: 'id', description: '会话ID' })
  sendMessageStream(
    @CurrentUser() user: CurrentUserType,
    @Param('id') sessionId: string,
    @Body() dto: SendMessageDto,
  ): Observable<{ data: ChatStreamResponse }> {
    return this.chatService
      .sendMessageStream(user.userId, sessionId, dto.content, {
        model: dto.model,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      })
      .pipe(
        map((response) => ({
          data: response,
        })),
      );
  }

  /**
   * 清空会话消息
   */
  @Delete('sessions/:id/messages')
  @ApiOperation({ summary: '清空会话消息' })
  @ApiParam({ name: 'id', description: '会话ID' })
  async clearMessages(
    @CurrentUser() user: CurrentUserType,
    @Param('id') sessionId: string,
  ) {
    return this.chatService.clearMessages(user.userId, sessionId);
  }
}
