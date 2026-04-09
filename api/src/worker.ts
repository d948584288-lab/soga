/**
 * Worker 进程入口
 * 处理异步任务：embedding、文件解析、长文本生成等
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker/worker.module';

async function bootstrap() {
  const logger = new Logger('Worker');

  logger.log('🚀 Starting Worker process...');

  const app = await NestFactory.createApplicationContext(WorkerModule);

  // 处理优雅关闭
  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    });
  });

  logger.log('✅ Worker is running and waiting for jobs...');
}

bootstrap().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
