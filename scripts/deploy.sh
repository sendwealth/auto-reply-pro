#!/bin/bash

# Auto-Reply Pro - 生产部署脚本

set -e

echo "🚀 Auto-Reply Pro 生产部署"
echo "============================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 Node.js
echo "📦 检查 Node.js 版本..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo "请先安装 Node.js 16 或更高版本"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js 版本过低: $(node -v)${NC}"
    echo "请升级到 Node.js 16 或更高版本"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# 检查依赖
echo ""
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm ci --production
fi

echo -e "${GREEN}✅ 依赖已就绪${NC}"

# 检查环境变量
echo ""
echo "🔐 检查环境配置..."
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        echo "复制生产环境配置..."
        cp .env.production .env
    else
        echo -e "${YELLOW}⚠️  未找到 .env 文件${NC}"
        echo "正在创建默认配置..."
        cat > .env << 'EOF'
# Auto-Reply Pro 配置
API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ENABLE_AUTH=true
DEEPSEEK_API_KEY=your_key_here
LOG_LEVEL=info
EOF
    fi
fi

echo -e "${GREEN}✅ 环境配置完成${NC}"

# 生成 API Key（如果需要）
if grep -q "change_this_to_your_secure_key" .env 2>/dev/null; then
    echo ""
    echo "🔑 生成安全密钥..."
    
    API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # 更新 .env 文件
    sed -i "s|sk_live_change_this_to_your_secure_key|$API_KEY|g" .env
    sed -i "s|change_this_to_your_jwt_secret_minimum_32_characters|$JWT_SECRET|g" .env
    
    echo -e "${GREEN}✅ 密钥已生成${NC}"
fi

# 创建必要目录
echo ""
echo "📁 创建目录..."
mkdir -p logs data

echo -e "${GREEN}✅ 目录创建完成${NC}"

# 检查端口
echo ""
echo "🔌 检查端口..."
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  端口 $port 已被占用${NC}"
        return 1
    else
        echo -e "${GREEN}✅ 端口 $port 可用${NC}"
        return 0
    fi
}

check_port 3002 || true
check_port 3003 || true

# 启动选项
echo ""
echo "🚀 启动选项:"
echo "1) 前台运行（开发测试）"
echo "2) 后台运行（生产环境）"
echo "3) 使用 PM2 运行（推荐）"
echo "4) 使用 Docker 运行"
echo "5) 仅检查环境"
echo ""
read -p "请选择 (1-5): " choice

case $choice in
    1)
        echo ""
        echo "启动服务（前台）..."
        node src/index-secure.js
        ;;
    2)
        echo ""
        echo "启动服务（后台）..."
        nohup node src/index-secure.js > logs/app.log 2>&1 &
        PID=$!
        echo $PID > logs/app.pid
        echo -e "${GREEN}✅ 服务已启动 (PID: $PID)${NC}"
        echo "日志: logs/app.log"
        echo "停止: kill $PID"
        ;;
    3)
        echo ""
        if ! command -v pm2 &> /dev/null; then
            echo "安装 PM2..."
            npm install -g pm2
        fi
        
        echo "使用 PM2 启动..."
        pm2 start src/index-secure.js --name auto-reply-pro
        pm2 save
        pm2 startup
        
        echo -e "${GREEN}✅ PM2 启动完成${NC}"
        echo "查看状态: pm2 status"
        echo "查看日志: pm2 logs auto-reply-pro"
        ;;
    4)
        echo ""
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ Docker 未安装${NC}"
            exit 1
        fi
        
        echo "构建 Docker 镜像..."
        docker build -t auto-reply-pro:latest .
        
        echo "启动容器..."
        docker-compose up -d
        
        echo -e "${GREEN}✅ Docker 容器已启动${NC}"
        echo "查看日志: docker-compose logs -f"
        ;;
    5)
        echo ""
        echo -e "${GREEN}✅ 环境检查完成${NC}"
        echo ""
        echo "配置文件: .env"
        echo "启动命令: node src/index-secure.js"
        echo ""
        grep -E "^(API_KEY|DEEPSEEK)" .env | head -2
        ;;
    *)
        echo -e "${RED}无效选择${NC}"
        exit 1
        ;;
esac
