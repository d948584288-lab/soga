import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { CurrentUserType } from '../auth/decorators/current-user.decorator';

/**
 * 限流 Guard
 * 基于用户 ID 的限流控制
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserType | undefined;

    // 未登录用户按 IP 限流
    const identifier = user?.userId || `ip:${request.ip}`;

    const check = await this.rateLimitService.checkLimit(identifier, 'request', 1);

    if (!check.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: check.reason || '请求过于频繁，请稍后再试',
          retryAfter: check.resetTime - Math.floor(Date.now() / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 将限流信息添加到响应头
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', check.limit);
    response.setHeader('X-RateLimit-Remaining', check.remaining);
    response.setHeader('X-RateLimit-Reset', check.resetTime);

    return true;
  }
}
