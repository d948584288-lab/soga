import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户类型
 */
export interface CurrentUserType {
  userId: string;
  email: string;
  role: string;
}

/**
 * 当前用户装饰器
 * 从请求对象中提取用户信息
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserType | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserType;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
