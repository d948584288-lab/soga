import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness and dependency checks' })
  async getHealth() {
    let database: 'ok' | 'error' = 'error';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'ok';
    } catch {
      database = 'error';
    }

    const redisOk = await this.redis.ping();

    const status =
      database === 'ok' && redisOk ? ('healthy' as const) : ('degraded' as const);

    return {
      status,
      dependencies: {
        database,
        redis: redisOk ? 'ok' : 'error',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
