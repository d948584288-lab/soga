import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { LlmModule } from './llm/llm.module';
import { ChatModule } from './chat/chat.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { CostsModule } from './costs/costs.module';

/**
 * 主应用模块
 * 注册所有业务模块和全局配置
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 基础设施模块
    PrismaModule,
    RedisModule,

    // 功能模块
    HealthModule,
    AuthModule,
    LlmModule,
    ChatModule,
    RateLimitModule,
    CostsModule,
  ],
  providers: [
    // 全局验证管道
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,           // 过滤未定义的属性
          forbidNonWhitelisted: true, // 禁止未定义的属性
          transform: true,           // 自动转换类型
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
    },
  ],
})
export class AppModule {}
