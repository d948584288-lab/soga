import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // API 前缀 - v1 版本
  app.setGlobalPrefix('v1/api');

  // CORS 配置
  const corsReflect =
    process.env.CORS_REFLECT === '1' ||
    process.env.CORS_REFLECT === 'true';

  if (corsReflect) {
    app.enableCors({ origin: true, credentials: true });
    logger.log('CORS enabled with origin reflection');
  } else {
    const corsRaw = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
    let corsOrigins = corsRaw.split(',').map((o) => o.trim()).filter(Boolean);
    if (corsOrigins.length === 0) {
      corsOrigins = ['http://localhost:3000'];
    }
    const allowAny = corsOrigins.length === 1 && corsOrigins[0] === '*';
    app.enableCors({
      origin: allowAny ? true : corsOrigins,
      credentials: !allowAny,
    });
    logger.log(`CORS enabled for origins: ${corsOrigins.join(', ')}`);
  }

  // Swagger API 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Platform API')
    .setDescription('企业级 AI 平台 API - 支持多模型 LLM、流式输出、会话管理')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '输入 JWT Token: Bearer {token}',
      },
      'JWT',
    )
    .addTag('认证', '用户注册、登录、Token 刷新')
    .addTag('聊天', '会话管理、消息发送、流式输出')
    .addTag('LLM', '模型列表、直接调用 LLM API')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    jsonDocumentUrl: 'docs/json',
  });

  logger.log('Swagger documentation available at /docs');

  // 启动服务器
  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://0.0.0.0:${port}/api`);
  logger.log(`📚 API Documentation: http://0.0.0.0:${port}/docs`);
  logger.log(`🏥 Health Check: http://0.0.0.0:${port}/api/health`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
