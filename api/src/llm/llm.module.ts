import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { LlmConfigService } from './llm-config.service';

/**
 * LLM 模块
 * 提供大语言模型统一接入能力
 */
@Module({
  controllers: [LlmController],
  providers: [LlmService, LlmConfigService],
  exports: [LlmService, LlmConfigService],
})
export class LlmModule {}
