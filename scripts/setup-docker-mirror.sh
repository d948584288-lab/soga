#!/bin/bash
# 切换 Docker 镜像为国内镜像源
# 用法: ./scripts/setup-docker-mirror.sh [mirror]
# 支持的镜像源: 1panel(默认), daocloud, dockerpull, cnb, aliyun

set -e

MIRROR=${1:-1panel}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 切换 Docker 镜像源为: $MIRROR${NC}"

case $MIRROR in
  1panel)
    PREFIX="docker.1panel.live"
    ;;
  daocloud)
    PREFIX="docker.m.daocloud.io"
    ;;
  dockerpull)
    PREFIX="dockerpull.com"
    ;;
  cnb)
    PREFIX="docker.cnb.cool"
    ;;
  aliyun)
    PREFIX="registry.cn-hangzhou.aliyuncs.com/dockerhub"
    ;;
  *)
    echo -e "${RED}❌ 不支持的镜像源: $MIRROR${NC}"
    echo "支持的镜像源: 1panel, daocloud, dockerpull, cnb, aliyun"
    exit 1
    ;;
esac

echo -e "${YELLOW}📦 镜像前缀: $PREFIX${NC}"

# 替换 docker-compose.prod.yml
sed -i "s|image: .*/postgres:16-alpine|image: $PREFIX/postgres:16-alpine|g" docker-compose.prod.yml
sed -i "s|image: .*/redis:7-alpine|image: $PREFIX/redis:7-alpine|g" docker-compose.prod.yml
sed -i "s|image: .*/nginx:1.27-alpine|image: $PREFIX/nginx:1.27-alpine|g" docker-compose.prod.yml

# 替换 Dockerfile
sed -i "s|FROM .*/node:22-alpine|FROM $PREFIX/node:22-alpine|g" api/Dockerfile
sed -i "s|FROM .*/node:22-alpine|FROM $PREFIX/node:22-alpine|g" web/Dockerfile

echo -e "${GREEN}✅ 镜像源切换完成！${NC}"
echo ""
echo "当前使用的镜像:"
grep -E "^\s+image:|^FROM" docker-compose.prod.yml api/Dockerfile web/Dockerfile | grep -v "^#" | sed 's/^/  /'
