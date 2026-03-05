#!/bin/bash
# Auto-Reply Pro 快速启动脚本

echo "🚀 Auto-Reply Pro 快速启动"
echo "================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 检查环境变量
if [ ! -f ".env" ]; then
    echo "⚙️  创建配置文件..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo "⚠️  请编辑 .env 文件配置必要的环境变量"
    echo ""
    echo "必需配置:"
    echo "  - DEEPSEEK_API_KEY"
    echo ""
    read -p "是否现在配置？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nano .env
    else
        echo "请稍后手动配置 .env 文件"
        exit 0
    fi
fi

echo ""
echo "🎯 选择启动模式:"
echo "  1) 完整模式（推荐）- Web Chat + 管理面板"
echo "  2) 基础模式 - 仅 Web Chat"
echo "  3) 测试模式 - 运行测试"
echo "  4) 演示模式 - 功能演示"
echo ""
read -p "请选择 (1-4): " mode

case $mode in
    1)
        echo ""
        echo "🚀 启动完整模式..."
        node src/index-full.js
        ;;
    2)
        echo ""
        echo "🚀 启动基础模式..."
        npm start
        ;;
    3)
        echo ""
        echo "🧪 运行测试..."
        npm test
        ;;
    4)
        echo ""
        echo "🎯 运行演示..."
        node demo-proactive-messaging.js
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac
