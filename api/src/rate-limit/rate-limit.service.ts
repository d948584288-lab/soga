import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/**
 * 限流配置
 */
interface RateLimitConfig {
  // 每分钟请求数
  requestsPerMinute: number;
  // 每天请求数
  requestsPerDay: number;
  // 每分钟 Token 数
  tokensPerMinute: number;
  // 每天 Token 数
  tokensPerDay: number;
}

/**
 * 限流检查结果
 */
export interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
  reason?: string;
}

/**
 * 限流服务
 * 基于 Redis 的滑动窗口限流
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  // 默认限流配置
  private readonly defaultConfig: RateLimitConfig = {
    requestsPerMinute: 20,
    requestsPerDay: 1000,
    tokensPerMinute: 100000,  // 100k tokens/min
    tokensPerDay: 1000000,    // 1M tokens/day
  };

  constructor(private redisService: RedisService) {}

  /**
   * 检查请求限流
   * @param userId 用户 ID
   * @param type 限流类型: 'request' | 'token'
   * @param cost 消耗（token 数）
   */
  async checkLimit(
    userId: string,
    type: 'request' | 'token' = 'request',
    cost: number = 1,
  ): Promise<RateLimitCheck> {
    const now = Math.floor(Date.now() / 1000);

    // 检查每分钟限制
    const minuteKey = `ratelimit:${userId}:${type}:minute:${Math.floor(now / 60)}`;
    const minuteLimit = type === 'request' 
      ? this.defaultConfig.requestsPerMinute 
      : this.defaultConfig.tokensPerMinute;
    
    const minuteCheck = await this.checkWindow(minuteKey, minuteLimit, cost, 60);
    if (!minuteCheck.allowed) {
      return {
        ...minuteCheck,
        reason: `每分钟${type === 'request' ? '请求' : 'Token'}数超限`,
      };
    }

    // 检查每天限制
    const dayKey = `ratelimit:${userId}:${type}:day:${Math.floor(now / 86400)}`;
    const dayLimit = type === 'request'
      ? this.defaultConfig.requestsPerDay
      : this.defaultConfig.tokensPerDay;
    
    const dayCheck = await this.checkWindow(dayKey, dayLimit, cost, 86400);
    if (!dayCheck.allowed) {
      return {
        ...dayCheck,
        reason: `每天${type === 'request' ? '请求' : 'Token'}数超限`,
      };
    }

    return minuteCheck;
  }

  /**
   * 检查滑动窗口
   */
  private async checkWindow(
    key: string,
    limit: number,
    cost: number,
    windowSeconds: number,
  ): Promise<RateLimitCheck> {
    const redis = this.redisService.getClient();
    
    // 使用 Redis INCR 原子操作
    const current = await redis.incrby(key, cost);
    
    // 首次设置过期时间
    if (current === cost) {
      await redis.expire(key, windowSeconds);
    }

    const remaining = Math.max(0, limit - current);
    const allowed = current <= limit;
    
    // 计算重置时间
    const ttl = await redis.ttl(key);
    const resetTime = Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds);

    return {
      allowed,
      remaining,
      resetTime,
      limit,
    };
  }

  /**
   * 记录 Token 消耗
   */
  async recordTokenUsage(userId: string, tokens: number): Promise<void> {
    await this.checkLimit(userId, 'token', tokens);
  }

  /**
   * 获取用户限流状态
   */
  async getLimitStatus(userId: string): Promise<{
    requests: { used: number; limit: number; resetTime: number };
    tokens: { used: number; limit: number; resetTime: number };
  }> {
    const now = Math.floor(Date.now() / 1000);
    const redis = this.redisService.getClient();

    const minuteKey = `ratelimit:${userId}:request:minute:${Math.floor(now / 60)}`;
    const dayKey = `ratelimit:${userId}:request:day:${Math.floor(now / 86400)}`;
    const tokenMinuteKey = `ratelimit:${userId}:token:minute:${Math.floor(now / 60)}`;
    const tokenDayKey = `ratelimit:${userId}:token:day:${Math.floor(now / 86400)}`;

    const [
      minuteUsed,
      dayUsed,
      tokenMinuteUsed,
      tokenDayUsed,
      minuteTtl,
      dayTtl,
    ] = await Promise.all([
      redis.get(minuteKey).then((v) => parseInt(v || '0', 10)),
      redis.get(dayKey).then((v) => parseInt(v || '0', 10)),
      redis.get(tokenMinuteKey).then((v) => parseInt(v || '0', 10)),
      redis.get(tokenDayKey).then((v) => parseInt(v || '0', 10)),
      redis.ttl(minuteKey),
      redis.ttl(dayKey),
    ]);

    return {
      requests: {
        used: dayUsed,
        limit: this.defaultConfig.requestsPerDay,
        resetTime: Math.floor(Date.now() / 1000) + (dayTtl > 0 ? dayTtl : 86400),
      },
      tokens: {
        used: tokenDayUsed,
        limit: this.defaultConfig.tokensPerDay,
        resetTime: Math.floor(Date.now() / 1000) + (dayTtl > 0 ? dayTtl : 86400),
      },
    };
  }

  /**
   * 清理用户的限流记录（管理员用）
   */
  async resetLimit(userId: string): Promise<void> {
    const redis = this.redisService.getClient();
    const now = Math.floor(Date.now() / 1000);
    
    const keys = [
      `ratelimit:${userId}:request:minute:${Math.floor(now / 60)}`,
      `ratelimit:${userId}:request:day:${Math.floor(now / 86400)}`,
      `ratelimit:${userId}:token:minute:${Math.floor(now / 60)}`,
      `ratelimit:${userId}:token:day:${Math.floor(now / 86400)}`,
    ];

    await redis.del(...keys);
    this.logger.log(`Rate limit reset for user: ${userId}`);
  }
}
