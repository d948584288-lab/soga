本地开发完整启动命令（3个终端）：

# 终端 1：数据库

cd ai && docker compose up -d postgres redis

# 终端 2：后端

cd api && pnpm dev

# 终端 3：前端

cd web && pnpm dev
然后访问 http://localhost:3000
