# Auto-Reply Pro - 消息监听与自动回复方案

## 🎯 需求

用户发送消息给机器人 → Auto-Reply Pro 自动回复

## 📋 技术方案

### 方案概述

```
用户发送消息
    ↓
飞书接收消息 → OpenClaw 消息钩子
    ↓
触发 Auto-Reply Pro 处理
    ↓
生成智能回复
    ↓
回复用户
```

### 实现步骤

#### 1. 创建消息处理脚本

位置: `~/clawd/products/auto-reply-pro/scripts/message-handler.js`

功能:
- 接收来自 OpenClaw 的消息
- 调用 Auto-Reply Pro API 生成回复
- 返回回复内容

#### 2. 配置 OpenClaw 消息钩子

在 OpenClaw 中配置消息监听：
- 监听飞书消息
- 调用 Auto-Reply Pro 处理
- 发送回复

#### 3. 启动服务

```bash
# 启动 Auto-Reply Pro
node src/enhanced-server.js

# 配置消息监听
# OpenClaw 会自动调用 Auto-Reply Pro
```

## 🔧 核心代码

### 消息处理流程

```javascript
// 1. 收到消息
{
  from: "ou_d5695b3a7239c8fb1a3af9a46140b27e",
  message: "hello",
  platform: "feishu"
}

// 2. 调用 Auto-Reply Pro
POST http://localhost:3002/api/chat
{
  "message": "hello",
  "userId": "ou_d5695b3a7239c8fb1a3af9a46140b27e",
  "channelId": "feishu"
}

// 3. 获取回复
{
  "reply": "Hello! I'm your intelligent customer service assistant...",
  "intent": "greeting"
}

// 4. 发送回复给用户
```

## ✅ 测试方法

1. 用户发送消息给机器人："hello"
2. Auto-Reply Pro 自动回复："Hello! I'm your..."
3. 用户收到回复

## 🚀 部署

1. 启动 Auto-Reply Pro 服务
2. 配置 OpenClaw 消息监听
3. 测试自动回复

---

**创建时间**: 2026-03-05 15:42
**开发者**: AI CEO 🍋
