import { Module } from '@nestjs/common';
import { CostsService } from './costs.service';

/**
 * 成本统计模块
 */
@Module({
  providers: [CostsService],
  exports: [CostsService],
})
export class CostsModule {}
