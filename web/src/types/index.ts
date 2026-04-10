/**
 * 统一类型导出
 * 注意: Session 和 Message 类型在 chat.ts 中定义
 */

export * from "./chat"

// 额外类型定义（不在 chat.ts 中的）
export interface User {
  id: string
  email: string
  displayName: string | null
  avatar?: string
  role?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: User
}
