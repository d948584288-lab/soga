import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 聊天消息
 */
export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant', 'system'], description: '消息角色' })
  @IsEnum(['user', 'assistant', 'system'])
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({ description: '消息内容' })
  @IsString()
  content: string;
}

/**
 * 创建会话请求
 */
export class CreateSessionDto {
  @ApiProperty({ description: '会话标题', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '使用的模型', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: 'Prompt ID', required: false })
  @IsOptional()
  @IsString()
  promptId?: string;
}

/**
 * 发送消息请求
 */
export class SendMessageDto {
  @ApiProperty({ description: '消息内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '模型ID', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: '是否流式输出', default: true })
  @IsOptional()
  stream?: boolean = true;

  @ApiProperty({ description: '温度参数', minimum: 0, maximum: 2, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({ description: '最大Token数', required: false })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;
}

/**
 * 会话响应
 */
export class SessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  messageCount: number;

  @ApiProperty()
  totalTokens: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * 消息响应
 */
export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ required: false })
  contentType?: string;

  @ApiProperty({ required: false })
  tokens?: number;

  @ApiProperty({ required: false })
  model?: string;

  @ApiProperty({ required: false })
  latencyMs?: number;

  @ApiProperty({ required: false })
  metadata?: any;

  @ApiProperty()
  createdAt: Date;
}

/**
 * 流式响应格式 (SSE)
 */
export interface ChatStreamResponse {
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
