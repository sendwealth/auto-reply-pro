# Auto-Reply Pro 快速启动指南

**更新时间**: 2026-03-05 11:30
**完成度**: 70%
**状态**: ✅ 核心功能可用

---

## 🚀 快速开始

### 1. 启动服务

```bash
cd ~/clawd/products/auto-reply-pro
npm start
```

### 2. 测试 API

```bash
# 健康检查
curl http://localhost:3002/health

# 发送消息
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，我想了解产品价格",
    "userId": "test-user",
    "sessionId": "test-session"
  }'
```

### 3. 运行测试

```bash
npm test
```

---

## 📦 已完成功能

### ✅ 核心模块
- ✅ CoreEngine - 核心引擎
- ✅ ContextManager - 上下文管理
- ✅ TemplateManager - 模板管理
- ✅ AI 回复策略（基于模板）

### ✅ 平台适配器
- ✅ WebAdapter - Web Chat（端口 3002）
- ✅ DiscordAdapter - Discord（可选）

### ✅ 测试套件
- ✅ ContextManager 测试（5个）
- ✅ TemplateManager 测试（7个）
- ✅ 总计：12个测试，100% 通过

---

## 🎯 支持的意图

| 意图 | 关键词 | 示例 |
|------|--------|------|
| greeting | 你好、hi、hello | "你好" |
| pricing | 价格、多少钱 | "产品多少钱" |
| features | 功能、feature | "有什么功能" |
| support | 支持、帮助 | "需要技术支持" |
| demo | 演示、demo | "想看产品演示" |
| thanks | 谢谢、thanks | "谢谢" |
| goodbye | 再见、bye | "再见" |

---

## 📊 架构说明

```
用户消息
    ↓
WebAdapter / DiscordAdapter
    ↓
CoreEngine (路由)
    ↓
SimpleAIStrategy (意图识别 + 模板匹配)
    ↓
ContextManager (上下文管理)
    ↓
返回回复
```

---

## 🔧 配置说明

### 环境变量（.env）

```bash
# Web 服务端口
PORT=3002

# Discord Bot Token（可选）
DISCORD_BOT_TOKEN=your_token_here

# DeepSeek API Key（用于增强 AI）
DEEPSEEK_API_KEY=your_key_here
```

---

## 📈 下一步开发

### 待完成（30%）
- [ ] DeepSeek API 真实集成
- [ ] Email 适配器
- [ ] GitHub 适配器
- [ ] 更多测试用例
- [ ] Webhook 支持

### 优化方向
- [ ] 多轮对话优化
- [ ] 意图识别准确度提升
- [ ] 响应速度优化
- [ ] 错误处理完善

---

## 🎉 成就

**开发时间**: 43分钟（10:47 - 11:30）
**代码量**: ~2000 行
**测试覆盖**: 12个测试，100% 通过
**可用性**: ✅ 核心功能已可使用

---

**创建者**: AI CEO 🍋
**状态**: 🟢 可用
**下一步**: 真实 AI 集成或部署测试
