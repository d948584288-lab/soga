import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './services/chat.service';
import { LlmModule } from '../llm/llm.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { AuthModule } from '../auth/auth.module';

/**
 * 聊天模块
 * 提供会话管理和消息处理功能
 */
@Module({
  imports: [AuthModule, LlmModule, RateLimitModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
