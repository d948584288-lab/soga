import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

/**
 * 认证服务
 * 处理用户注册、登录、Token 刷新
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户注册
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName || dto.email.split('@')[0],
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    this.logger.log(`User registered: ${user.email}`);

    // 生成 Token
    return this.generateTokens(user);
  }

  /**
   * 用户登录
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 检查用户状态
    if (user.status === 'BANNED') {
      throw new UnauthorizedException('账号已被禁用');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('账号未激活');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`User logged in: ${user.email}`);

    // 生成 Token
    return this.generateTokens(user);
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          process.env.JWT_SECRET ||
          'your-secret-key',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  /**
   * 生成 Access Token 和 Refresh Token
   */
  private generateTokens(user: {
    id: string;
    email: string;
    displayName: string | null;
    role: string;
  }): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresInValue = (process.env.JWT_EXPIRES_IN ||
      '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const refreshExpiresInValue = (process.env.JWT_REFRESH_EXPIRES_IN ||
      '30d') as `${number}${'s' | 'm' | 'h' | 'd'}`;

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: expiresInValue,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET ||
        process.env.JWT_SECRET ||
        'your-secret-key',
      expiresIn: refreshExpiresInValue,
    });

    // 解析过期时间
    const expiresIn = this.parseExpiresIn(process.env.JWT_EXPIRES_IN || '7d');

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  /**
   * 解析过期时间为秒数
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60; // 默认 7 天

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return value * (multipliers[unit] || multipliers.d);
  }

  /**
   * 验证用户是否存在（用于 WS Guard 等）
   */
  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
      },
    });
  }
}
