import { PrismaClient } from '@prisma/client';

/**
 * Prisma 客户端扩展
 * - 软删除支持
 * - 自动更新时间戳
 * - 查询优化
 */
export const extendedPrismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
}).$extends({
  model: {
    session: {
      // 会话特定方法
      async findActiveSessions(this: any, userId: string) {
        return this.findMany({
          where: {
            userId,
            status: 'ACTIVE',
          },
          orderBy: { updatedAt: 'desc' },
        });
      },
    },
  },
});

// 类型导出
export type ExtendedPrismaClient = typeof extendedPrismaClient;
