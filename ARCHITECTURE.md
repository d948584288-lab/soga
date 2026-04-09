# AI Platform - 企业级架构设计

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 前端                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   登录页    │ │  聊天主页   │ │  设置页     │ │ 管理后台  │ │
│  │  (Auth)     │ │  (SSE流式)  │ │ (Prompt)   │ │ (Admin)   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/WebSocket
┌─────────────────────────────▼───────────────────────────────────┐
│                      API Gateway (Nginx)                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      NestJS API 服务                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  LLM 网关   │ │  会话服务   │ │   RAG 服务  │ │ 任务队列  │ │
│  │  (多模型)   │ │  (CRUD)     │ │  (向量检索) │ │ (BullMQ)  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  用户服务   │ │ 限流/成本   │ │ 文件服务    │ │ Memory    │ │
│  │  (Auth/JWT) │ │ (Token统计) │ │ (本地存储)  │ │ (记忆)    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐ ┌──────────▼──────────┐ ┌───────▼────────┐
│   PostgreSQL   │ │       Redis         │ │    Worker      │
│   + pgvector   │ │  (缓存/队列/会话)    │ │   独立容器      │
│                │ │                     │ │                │
│ ┌────────────┐ │ │ ┌─────────────────┐ │ │ ┌────────────┐ │
│ │ users      │ │ │ │ sessions:temp   │ │ │ │ embedding  │ │
│ │ sessions   │ │ │ │ rate_limit      │ │ │ │ file_parse │ │
│ │ messages   │ │ │ │ bull:queues     │ │ │ │ long_text  │ │
│ │ prompts    │ │ │ └─────────────────┘ │ │ │ └────────────┘ │
│ │ documents  │ │ └─────────────────────┘ │                │
│ │ vectors    │ │                         │                │
│ │ costs      │ │                         │                │
│ └────────────┘ │                         │                │
└────────────────┘                         └────────────────┘
                              ┌─────────────────────────────┐
                              │                             │
                    ┌─────────▼──────────┐                  │
                    │   外部 LLM API     │                  │
                    │  (Kimi/OpenAI...)  │                  │
                    └────────────────────┘                  │
```

## 核心模块说明

### 1. LLM 网关 (llm/)
- **功能**: 统一接入多提供商 LLM API
- **文件**:
  - `llm-config.service.ts` - 读取 YAML 配置
  - `llm.service.ts` - 核心网关服务（fallback、成本计算）
  - `providers/moonshot.provider.ts` - Kimi 实现
  - `interfaces/llm-provider.interface.ts` - 接口定义
- **配置**: `api/config/llm.yaml`

### 2. 认证模块 (auth/)
- **功能**: JWT 认证、权限控制
- **文件**:
  - `auth.service.ts` - 注册/登录/刷新 Token
  - `auth.controller.ts` - API 端点
  - `guards/jwt.guard.ts` - JWT 验证
  - `guards/roles.guard.ts` - 角色权限

### 3. 聊天模块 (chat/)
- **功能**: 会话管理、消息处理、流式输出
- **文件**:
  - `services/chat.service.ts` - 核心聊天逻辑
  - `chat.controller.ts` - REST API + SSE
  - `dto/chat.dto.ts` - 数据传输对象

### 4. 限流模块 (rate-limit/)
- **功能**: 基于 Redis 的滑动窗口限流
- **策略**:
  - 每用户 20 请求/分钟
  - 每用户 1000 请求/天
  - Token 消耗统计

### 5. 成本统计 (costs/)
- **功能**: 记录每次 LLM 调用的成本
- **统计维度**:
  - 按用户
  - 按模型
  - 按天/月

### 6. Worker 进程 (worker/)
- **功能**: 异步处理任务队列
- **任务类型**:
  - `EMBEDDING` - 文档向量化
  - `FILE_PARSE` - 文件解析
  - `SUMMARY` - 摘要生成

## 数据库 Schema

### 核心表

```prisma
model User {
  id            String
  email         String    @unique
  passwordHash  String
  displayName   String?
  role          UserRole    // USER | ADMIN
  status        UserStatus  // ACTIVE | INACTIVE | BANNED
  sessions      Session[]
  costs         Cost[]
}

model Session {
  id            String
  userId        String
  title         String?
  model         String
  status        SessionStatus
  messageCount  Int
  totalTokens   Int
  messages      Message[]
}

model Message {
  id            String
  sessionId     String
  role          MessageRole  // USER | ASSISTANT | SYSTEM
  content       String
  contentType   ContentType  // TEXT | IMAGE | FILE | THINKING
  tokens        Int?
  model         String?
  latencyMs     Int?
}

model Prompt {
  id            String
  userId        String?
  name          String
  systemPrompt  String
  temperature   Float
  maxTokens     Int
  isDefault     Boolean
}

model Cost {
  id            String
  userId        String
  sessionId     String?
  model         String
  inputTokens   Int
  outputTokens  Int
  totalCost     Float    // 美元
  latencyMs     Int
}
```

## API 端点

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新 Token

### LLM
- `GET /api/llm/models` - 模型列表
- `POST /api/llm/chat/completions` - 非流式聊天

### 聊天
- `GET /api/chat/sessions` - 会话列表
- `POST /api/chat/sessions` - 创建会话
- `GET /api/chat/sessions/:id` - 会话详情
- `DELETE /api/chat/sessions/:id` - 删除会话
- `GET /api/chat/sessions/:id/messages` - 消息历史
- `POST /api/chat/sessions/:id/messages` - 发送消息（非流式）
- `POST /api/chat/sessions/:id/stream` - 流式聊天（SSE）⭐

### 健康检查
- `GET /api/health` - 服务健康状态

## 技术栈

### 后端
- **框架**: NestJS 11
- **数据库**: PostgreSQL 16 + pgvector
- **缓存/队列**: Redis 7 + BullMQ
- **ORM**: Prisma
- **认证**: JWT + bcrypt
- **配置**: YAML

### 前端
- **框架**: Next.js 15
- **样式**: Tailwind CSS v4
- **类型**: TypeScript
- **状态**: React Hooks
- **流式**: Fetch API + ReadableStream

### 部署
- **容器**: Docker + Docker Compose
- **网关**: Nginx
- **进程**: API + Worker 分离

## 高并发设计

### 1. 连接池
- PostgreSQL: 20 连接（API）+ 10 连接（Worker）
- Redis: 复用连接

### 2. 限流策略
- 滑动窗口算法
- Redis 原子操作（INCR + EXPIRE）

### 3. 流式输出
- SSE (Server-Sent Events)
- 支持 100 并发连接
- AbortController 取消支持

### 4. 异步处理
- BullMQ 任务队列
- Worker 独立进程/容器
- 支持水平扩展

## 成本计算

```typescript
// 计算示例：Kimi 32K
const inputTokens = 1000;
const outputTokens = 500;
const inputPrice = 0.000024;  // $/1K tokens
const outputPrice = 0.000024; // $/1K tokens

const cost = (inputTokens / 1000) * inputPrice + 
             (outputTokens / 1000) * outputPrice;
// = $0.000036
```

## 部署架构

```yaml
services:
  postgres:    # 数据库
  redis:       # 缓存/队列
  api:         # NestJS API
  worker:      # 异步任务处理器
  web:         # Next.js 前端
  gateway:     # Nginx 网关
```

## 下一步（第二阶段）

- [ ] RAG 知识库（文档上传、向量化、检索）
- [ ] 文件上传/解析（PDF/Word/TXT）
- [ ] 管理后台（用户管理、成本统计面板）
- [ ] Memory 长期记忆系统
- [ ] Agent 工作流
