# 🎯 Auto-Reply Pro - 用户消息自动回复系统

## 📋 工作原理

```
用户（你）发送 "hello" 给机器人
         ↓
飞书接收消息
         ↓
OpenClaw 消息钩子触发
         ↓
调用 Auto-Reply Pro 处理
         ↓
生成智能回复
         ↓
回复发送给用户（你）
```

## 🚀 启动步骤

### 1️⃣ 启动 Auto-Reply Pro 服务
```bash
cd ~/clawd/products/auto-reply-pro
node src/enhanced-server.js
```

### 2️⃣ 配置 OpenClaw 消息监听

OpenClaw 会自动监听飞书消息，当收到消息时：
- 调用 `openclaw-hook.js` 的 `onMessageReceived()` 函数
- Auto-Reply Pro 生成回复
- 自动发送回复给用户

### 3️⃣ 测试

1. 用户（你）在飞书发送消息："hello"
2. Auto-Reply Pro 自动回复："Hello! I'm your intelligent customer service assistant..."
3. 你收到回复

## 📊 消息流程

### 用户发送
```
发送者: 你（ou_d5695b3a7239c8fb1a3af9a46140b27e）
接收者: 机器人
内容: "hello"
```

### Auto-Reply Pro 处理
```javascript
// 1. 收到消息
{
  userId: "ou_d5695b3a7239c8fb1a3af9a46140b27e",
  text: "hello",
  platform: "feishu"
}

// 2. 生成回复
{
  reply: "Hello! I'm your intelligent customer service assistant. How can I help you today?",
  intent: "greeting",
  confidence: 0.85
}

// 3. 发送回复
发送者: 机器人（Auto-Reply Pro）
接收者: 你
内容: "Hello! I'm your..."
```

## ✅ 关键点

1. **发送者是用户（你）**
   - 你在飞书发送消息给机器人
   - 机器人是接收方

2. **Auto-Reply Pro 自动回复**
   - 机器人收到消息后
   - Auto-Reply Pro 生成回复
   - 回复发送给你

3. **完整流程**
   - 你: "hello" → 机器人
   - 机器人: "Hello!..." → 你

## 🎯 测试命令

### 在飞书发送消息
```
hello
```

### 预期回复
```
Hello! I'm your intelligent customer service assistant. How can I help you today?
```

## 🔧 技术实现

### OpenClaw 钩子
```javascript
// 当收到用户消息时
async function onMessageReceived(message) {
  // 调用 Auto-Reply Pro
  const response = await handler.handleMessage({
    userId: message.userId,
    text: message.text
  });

  // 返回回复
  return { reply: response.reply };
}
```

### Auto-Reply Pro API
```javascript
// 调用 API
POST http://localhost:3002/api/chat
{
  "message": "hello",
  "userId": "ou_xxx"
}

// 返回回复
{
  "reply": "Hello! I'm your...",
  "intent": "greeting"
}
```

## 📞 支持

- **产品**: Auto-Reply Pro v1.0
- **开发者**: AI CEO 🍋
- **状态**: 🟢 生产就绪

---

**创建时间**: 2026-03-05 15:42
**方案**: 消息监听 + 自动回复
