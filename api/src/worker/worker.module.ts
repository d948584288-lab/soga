import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { LlmModule } from '../llm/llm.module';
import { EmbeddingProcessor } from './processors/embedding.processor';

/**
 * Worker 模块
 * 处理异步任务队列
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
    PrismaModule,
    RedisModule,
    LlmModule,
  ],
  providers: [EmbeddingProcessor, Logger],
})
export class WorkerModule {}
