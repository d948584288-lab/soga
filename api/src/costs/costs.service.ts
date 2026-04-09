import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 成本统计服务
 * 记录和查询 LLM 调用成本
 */
@Injectable()
export class CostsService {
  private readonly logger = new Logger(CostsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 记录成本
   */
  async recordCost(data: {
    userId: string;
    sessionId?: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    latencyMs: number;
  }) {
    return this.prisma.cost.create({
      data,
    });
  }

  /**
   * 获取用户成本统计
   */
  async getUserCosts(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where = {
      userId,
      createdAt: {
        gte: options?.startDate,
        lte: options?.endDate,
      },
    };

    const [items, total, aggregations] = await Promise.all([
      this.prisma.cost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          session: {
            select: { title: true },
          },
        },
      }),
      this.prisma.cost.count({ where }),
      this.prisma.cost.aggregate({
        where,
        _sum: {
          totalCost: true,
          inputTokens: true,
          outputTokens: true,
        },
        _count: true,
      }),
    ]);

    return {
      items,
      total,
      summary: {
        totalCost: aggregations._sum.totalCost || 0,
        totalTokens: (aggregations._sum.inputTokens || 0) + (aggregations._sum.outputTokens || 0),
        requestCount: aggregations._count,
      },
    };
  }

  /**
   * 获取系统整体成本统计（管理员用）
   */
  async getSystemStats(options?: { startDate?: Date; endDate?: Date }) {
    const where = {
      createdAt: {
        gte: options?.startDate,
        lte: options?.endDate,
      },
    };

    const [modelStats, dailyStats, totals] = await Promise.all([
      // 按模型统计
      this.prisma.cost.groupBy({
        by: ['model'],
        where,
        _sum: {
          totalCost: true,
          inputTokens: true,
          outputTokens: true,
        },
        _count: true,
      }),
      // 按天统计（最近30天）
      this.prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          SUM(total_cost) as cost,
          SUM(input_tokens + output_tokens) as tokens,
          COUNT(*) as requests
        FROM costs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
      // 总计
      this.prisma.cost.aggregate({
        where,
        _sum: {
          totalCost: true,
          inputTokens: true,
          outputTokens: true,
        },
        _count: true,
      }),
    ]);

    return {
      totals: {
        totalCost: totals._sum.totalCost || 0,
        totalTokens: (totals._sum.inputTokens || 0) + (totals._sum.outputTokens || 0),
        requestCount: totals._count,
      },
      byModel: modelStats.map((m) => ({
        model: m.model,
        cost: m._sum.totalCost || 0,
        tokens: (m._sum.inputTokens || 0) + (m._sum.outputTokens || 0),
        requests: m._count,
      })),
      daily: dailyStats,
    };
  }

  /**
   * 获取用户月度成本（用于限额检查）
   */
  async getUserMonthlyCost(userId: string, year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 1);

    const result = await this.prisma.cost.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        totalCost: true,
      },
    });

    return result._sum.totalCost || 0;
  }
}
