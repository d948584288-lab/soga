#!/bin/bash
# 宝塔服务器一键部署脚本
# 用于部署 AI Platform（NestJS + Next.js + PostgreSQL + Redis）

set -e  # 遇到错误立即退出

echo "🚀 开始部署 AI Platform..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 .env.deploy 是否存在
if [ ! -f ".env.deploy" ]; then
    echo -e "${RED}❌ 错误: .env.deploy 文件不存在${NC}"
    echo ""
    echo -e "${YELLOW}请创建 .env.deploy 文件：${NC}"
    cat << 'EXAMPLE'
# =====================================
# 生产环境配置 - 务必修改密码和 API Key
# =====================================

# 数据库配置
POSTGRES_PASSWORD=YourStrongPassword123!

# JWT 密钥（至少32位随机字符串）
JWT_SECRET=your-random-jwt-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-random-jwt-refresh-secret-key

# Kimi API Key（必填）
MOONSHOT_API_KEY=sk-your-moonshot-api-key

# 端口（宝塔可能需要避免80端口冲突）
HTTP_PORT=8080

# Worker 数量（根据服务器配置调整）
WORKER_REPLICAS=1

# 如果你有域名，修改 CORS 配置
# CORS_REFLECT=0
# CORS_ORIGIN=https://your-domain.com
EXAMPLE
    echo ""
    exit 1
fi

# 检查关键配置
if ! grep -q "MOONSHOT_API_KEY" .env.deploy || grep -q "MOONSHOT_API_KEY=sk-your" .env.deploy; then
    echo -e "${RED}❌ 错误: 请配置 MOONSHOT_API_KEY${NC}"
    exit 1
fi

if ! grep -q "JWT_SECRET" .env.deploy || grep -q "JWT_SECRET=change-this" .env.deploy; then
    echo -e "${RED}❌ 错误: 请配置 JWT_SECRET${NC}"
    exit 1
fi

if ! grep -q "POSTGRES_PASSWORD" .env.deploy || grep -q "POSTGRES_PASSWORD=staging_app_change_me" .env.deploy; then
    echo -e "${RED}❌ 错误: 请修改默认的 POSTGRES_PASSWORD${NC}"
    exit 1
fi

# 检查 docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/engine/install/"
    exit 1
fi

# 检查 docker compose 是否可用
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker Compose 未安装${NC}"
    exit 1
fi

# 拉取最新代码
echo -e "${BLUE}📥 拉取最新代码...${NC}"
git pull origin main

# 停止旧容器
echo -e "${BLUE}🛑 停止旧容器...${NC}"
docker compose -f docker-compose.prod.yml \
  --env-file deploy/staging.defaults.env \
  --env-file .env.deploy \
  down --remove-orphans || true

# 清理旧的镜像（可选，节省空间）
echo -e "${BLUE}🧹 清理旧镜像...${NC}"
docker system prune -f || true

# 构建并启动所有服务
echo -e "${BLUE}🏗️  构建并启动服务...${NC}"
docker compose -f docker-compose.prod.yml \
  --env-file deploy/staging.defaults.env \
  --env-file .env.deploy \
  up -d --build

# 等待服务启动
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 15

# 执行数据库迁移
echo -e "${BLUE}🔄 执行数据库迁移...${NC}"
docker compose -f docker-compose.prod.yml \
  --env-file deploy/staging.defaults.env \
  --env-file .env.deploy \
  exec -T api npx prisma migrate deploy || true

# 检查服务状态
echo -e "${BLUE}🔍 检查服务状态...${NC}"
docker compose -f docker-compose.prod.yml ps

# 健康检查
echo ""
echo -e "${BLUE}🏥 健康检查...${NC}"
HTTP_PORT=$(grep -E "^HTTP_PORT=" .env.deploy 2>/dev/null | cut -d '=' -f2 | tr -d ' ' || echo "")
HTTP_PORT=${HTTP_PORT:-8080}

HEALTH_URL="http://localhost:${HTTP_PORT}/api/health"
echo "检查地址: $HEALTH_URL"

# 重试健康检查
for i in {1..5}; do
    if curl -s "$HEALTH_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 部署成功！${NC}"
        echo ""
        echo -e "${GREEN}🌐 服务访问地址:${NC}"
        echo "   - 首页: http://47.115.77.202:${HTTP_PORT}"
        echo "   - API文档: http://47.115.77.202:${HTTP_PORT}/docs"
        echo "   - 健康检查: http://47.115.77.202:${HTTP_PORT}/api/health"
        echo ""
        break
    else
        if [ $i -eq 5 ]; then
            echo -e "${YELLOW}⚠️  健康检查未通过，请查看日志${NC}"
        else
            echo "  第 $i 次尝试失败，继续等待..."
            sleep 5
        fi
    fi
done

# 显示常用命令
echo -e "${BLUE}📋 常用命令:${NC}"
echo "  查看日志:   docker compose -f docker-compose.prod.yml logs -f"
echo "  API日志:   docker compose -f docker-compose.prod.yml logs -f api"
echo "  Worker日志: docker compose -f docker-compose.prod.yml logs -f worker"
echo "  停止服务:   docker compose -f docker-compose.prod.yml down"
echo "  重启服务:   docker compose -f docker-compose.prod.yml restart"
echo "  进入数据库: docker compose -f docker-compose.prod.yml exec postgres psql -U app -d app"
echo ""
echo -e "${GREEN}🎉 部署流程执行完毕${NC}"
