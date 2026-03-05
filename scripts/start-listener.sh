#!/bin/bash

# Auto-Reply Pro - 消息监听启动脚本

echo "🚀 Auto-Reply Pro - 启动消息监听系统"
echo "============================================================"
echo ""

# 检查服务
if ! curl -s http://localhost:3002/health > /dev/null 2>&1; then
  echo "⚠️  Auto-Reply Pro 服务未运行，正在启动..."

  # 停止旧服务
  pkill -f "enhanced-server\|simple-server" 2>/dev/null || true
  sleep 2

  # 启动服务
  cd ~/clawd/products/auto-reply-pro
  node src/enhanced-server.js > logs/service.log 2>&1 &
  sleep 3

  echo "✅ Auto-Reply Pro 服务已启动"
else
  echo "✅ Auto-Reply Pro 服务运行中"
fi

echo ""
echo "🤖 消息监听系统"
echo "============================================================"
echo ""
echo "工作原理:"
echo "  1. 用户（你）在飞书发送消息给机器人"
echo "  2. OpenClaw 接收消息"
echo "  3. 调用 Auto-Reply Pro 生成回复"
echo "  4. 自动回复发送给用户（你）"
echo ""
echo "测试方法:"
echo "  👤 你发送: hello"
echo "  🤖 机器人回复: Hello! I'm your intelligent..."
echo ""
echo "✅ 系统已就绪，等待消息..."
echo ""
echo "💡 提示:"
echo "   - OpenClaw 会自动监听飞书消息"
echo "   - 当你发送消息时，Auto-Reply Pro 会自动回复"
echo "   - 无需手动操作，全自动运行"
echo ""
