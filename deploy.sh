#!/bin/bash

# Auto-Reply Pro 部署脚本

set -e

echo "🚀 开始部署 Auto-Reply Pro..."

# 检查环境变量
if [ ! -f .env ]; then
  echo "❌ 错误：未找到 .env 文件"
  echo "请复制 .env.example 并填写配置"
  exit 1
fi

# 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down

# 构建新镜像
echo "🔨 构建新镜像..."
docker-compose build --no-cache

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 健康检查
echo "🏥 健康检查..."
for i in {1..30}; do
  if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ 服务启动成功！"
    docker-compose ps
    exit 0
  fi
  echo "等待服务就绪... ($i/30)"
  sleep 2
done

echo "❌ 服务启动失败"
docker-compose logs --tail=50
exit 1
