# AI Platform 部署检查清单

## 📋 部署前准备

### 1. 服务器环境
- [ ] 已安装 Docker
- [ ] 已安装 Docker Compose
- [ ] 服务器内存 >= 2GB（推荐 4GB）
- [ ] 磁盘空间 >= 20GB

### 2. 配置文件检查

创建 `.env.deploy` 文件（在项目根目录）：

```bash
# 必须修改：数据库密码
POSTGRES_PASSWORD=YourStrongPassword123!

# 必须修改：JWT 密钥（至少32位随机字符串）
JWT_SECRET=your-random-secret-key-min-32-characters
JWT_REFRESH_SECRET=your-random-refresh-secret-key

# 必须修改：Kimi API Key
MOONSHOT_API_KEY=sk-your-moonshot-api-key-here

# 端口配置（如果80被占用，改为8080或其他）
HTTP_PORT=8080

# Worker 数量（根据服务器配置）
WORKER_REPLICAS=1

# 可选：配置域名后修改 CORS
# CORS_REFLECT=0
# CORS_ORIGIN=https://your-domain.com
```

### 3. 宝塔面板设置（如果使用）

如果使用宝塔面板 + Nginx 反向代理：

1. 创建网站，绑定域名
2. 设置反向代理：
   - 目标 URL: `http://127.0.0.1:8080`
   - 发送域名: `$host`

3. 配置 WebSocket 支持（用于流式输出）：
```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
```

## 🚀 部署步骤

### 第一步：上传代码到服务器

```bash
# 方式1：Git 克隆（推荐）
git clone <your-repo-url> /www/wwwroot/ai-platform
cd /www/wwwroot/ai-platform

# 方式2：手动上传
# 使用宝塔文件管理器或 SFTP 上传项目文件
```

### 第二步：执行部署脚本

```bash
cd /www/wwwroot/ai-platform

# 赋予执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

### 第三步：验证部署

```bash
# 查看运行状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f

# 测试 API 健康检查
curl http://localhost:8080/api/health

# 测试 API 文档
curl http://localhost:8080/docs
```

## 🔧 故障排查

### 问题1：数据库连接失败
```bash
# 检查数据库是否启动
docker compose -f docker-compose.prod.yml logs postgres

# 手动执行迁移
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### 问题2：API 启动失败
```bash
# 查看 API 日志
docker compose -f docker-compose.prod.yml logs -f api

# 重启 API 服务
docker compose -f docker-compose.prod.yml restart api
```

### 问题3：流式输出不工作
```bash
# 检查 Nginx 配置是否支持 WebSocket
# 确保有 proxy_set_header Upgrade $http_upgrade;
```

### 问题4：LLM API 调用失败
```bash
# 检查 API Key 是否配置正确
docker compose -f docker-compose.prod.yml exec api cat config/llm.yaml

# 测试 LLM 接口
curl -X POST http://localhost:8080/api/llm/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"model":"moonshot-v1-32k","messages":[{"role":"user","content":"Hello"}]}'
```

## 📝 首次使用

### 1. 注册管理员账号
```bash
# 调用注册 API
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password","displayName":"管理员"}'
```

### 2. 登录并获取 Token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

### 3. 创建会话并开始对话
```bash
# 创建会话
curl -X POST http://localhost:8080/api/chat/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"测试会话"}'

# 发送消息
curl -X POST http://localhost:8080/api/chat/sessions/<session-id>/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content":"你好"}'
```

## 🔒 安全配置

### 1. 修改默认密码
- [ ] 修改 POSTGRES_PASSWORD
- [ ] 修改 JWT_SECRET
- [ ] 配置强密码策略

### 2. 防火墙配置
```bash
# 开放必要端口
iptables -A INPUT -p tcp --dport 22 -j ACCEPT    # SSH
iptables -A INPUT -p tcp --dport 80 -j ACCEPT    # HTTP
iptables -A INPUT -p tcp --dport 443 -j ACCEPT   # HTTPS
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT  # App Port
```

### 3. HTTPS 配置（推荐）
使用宝塔面板的 SSL 功能，或配置 Nginx + Let's Encrypt。

## 📊 监控和维护

### 查看资源使用
```bash
# Docker 资源使用
docker stats

# 容器日志
docker compose -f docker-compose.prod.yml logs -f --tail=100
```

### 数据备份
```bash
# 备份数据库
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U app app > backup.sql

# 备份到远程（可选）
rsync -avz /www/wwwroot/ai-platform user@backup-server:/backups/
```

### 更新部署
```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy.sh
```

## 🎯 已完成功能

- ✅ 用户认证（注册/登录/JWT）
- ✅ LLM 网关（Kimi/OpenAI 支持）
- ✅ 流式输出（SSE）
- ✅ 会话管理
- ✅ 消息历史
- ✅ 限流控制（用户级）
- ✅ 成本统计
- ✅ Worker 异步处理
- ✅ pgvector 向量数据库支持

## 📅 待完成（第二阶段）

- [ ] RAG 知识库
- [ ] 文件上传/解析
- [ ] 管理后台
- [ ] 系统监控面板
