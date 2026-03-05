# Auto-Reply Pro - 环境配置指南

**更新时间**: 2026-03-05 11:55
**版本**: v1.0
**完成度**: 90%

---

## 🚀 快速配置

### 1. 复制配置文件

```bash
cd ~/clawd/products/auto-reply-pro
cp .env.example .env
nano .env
```

### 2. 配置必需项

```bash
# AI 配置（必需）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Web 服务端口
PORT=3002
DASHBOARD_PORT=3003
```

---

## 📦 平台配置

### 飞书（推荐）

**获取凭据**:
1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 获取 App ID 和 App Secret
4. 配置应用权限：`contact:user.base:readonly`, `im:message`, `im:message:send_as_bot`

**配置**:
```bash
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**测试**:
```javascript
const FeishuAdapter = require('./src/adapters/FeishuAdapter');
const adapter = new FeishuAdapter({
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET
});

await adapter.sendTextMessage('ou_xxxx', 'open_id', '测试消息');
```

---

### 企业微信

**获取凭据**:
1. 访问 [企业微信管理后台](https://work.weixin.qq.com/)
2. 应用管理 → 创建应用
3. 获取 AgentId 和 Secret
4. 获取企业的 CorpID

**配置**:
```bash
WECHAT_CORP_ID=wwxxxxxxxxxxxxxxxx
WECHAT_AGENT_ID=1000001
WECHAT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**测试**:
```javascript
const WeChatAdapter = require('./src/adapters/WeChatAdapter');
const adapter = new WeChatAdapter({
  corpId: process.env.WECHAT_CORP_ID,
  agentId: process.env.WECHAT_AGENT_ID,
  secret: process.env.WECHAT_SECRET
});

await adapter.sendTextMessage('user1|user2', '测试消息');
```

---

### Discord

**获取凭据**:
1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 创建新应用
3. Bot → Add Bot
4. 复制 Token

**配置**:
```bash
DISCORD_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**邀请机器人**:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot
```

---

### 邮件（SMTP）

**Gmail 配置**:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Auto-Reply Pro <your_email@gmail.com>"
```

**QQ邮箱配置**:
```bash
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your_qq@qq.com
SMTP_PASS=your_authorization_code
SMTP_FROM="Auto-Reply Pro <your_qq@qq.com>"
```

**注意**: Gmail 需要开启"两步验证"并生成"应用专用密码"

---

## 🤖 AI 配置

### DeepSeek（推荐）

**获取 API Key**:
1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册账号
3. 创建 API Key

**配置**:
```bash
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**优势**:
- 价格便宜（¥1/百万tokens）
- 中文能力强
- API 兼容 OpenAI

### OpenAI（可选）

**配置**:
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
```

---

## 🎯 启动服务

### 基础模式（仅自动回复）

```bash
npm start
# 访问: http://localhost:3002/api/chat
```

### 完整模式（推荐）

```bash
node src/index-full.js
# Web Chat: http://localhost:3002/api/chat
# 管理面板: http://localhost:3003
```

### 测试模式

```bash
npm test
```

---

## 📊 验证配置

### 检查配置

```bash
# 检查环境变量
node -e "console.log(process.env)"

# 检查飞书连接
node -e "
const FeishuAdapter = require('./src/adapters/FeishuAdapter');
const adapter = new FeishuAdapter();
adapter.getTenantToken().then(console.log);
"
```

### 测试发送

```bash
# 运行演示
node demo-proactive-messaging.js

# 测试 API
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好","userId":"test"}'
```

---

## 🔧 高级配置

### 速率限制

```bash
# 每分钟最大发送数
RATE_LIMIT_FEISHU=300
RATE_LIMIT_WECHAT=100
RATE_LIMIT_EMAIL=60
```

### 消息队列

```bash
# Redis 配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 日志

```bash
# 日志级别
LOG_LEVEL=info

# 日志文件
LOG_FILE=/var/log/auto-reply-pro.log
```

---

## 🐛 常见问题

### 1. 飞书 Token 获取失败

**原因**: App ID 或 Secret 错误

**解决**:
- 检查凭据是否正确
- 确认应用状态是否启用
- 查看应用权限配置

### 2. 企业微信发送失败

**原因**: 用户 ID 不存在或权限不足

**解决**:
- 确认用户 ID 格式正确（用 | 分隔）
- 检查应用是否可见
- 确认发送权限

### 3. AI 生成失败

**原因**: API Key 无效或余额不足

**解决**:
- 检查 API Key 是否正确
- 确认账户余额充足
- 查看错误日志

### 4. 邮件发送失败

**原因**: SMTP 认证失败

**解决**:
- 检查邮箱和密码
- Gmail 需使用应用专用密码
- 检查 SMTP 服务器地址

---

## 📚 完整配置示例

```bash
# .env 完整示例

# ===== 必需配置 =====
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3002
DASHBOARD_PORT=3003

# ===== 飞书 =====
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===== 企业微信 =====
WECHAT_CORP_ID=wwxxxxxxxxxxxxxxxx
WECHAT_AGENT_ID=1000001
WECHAT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===== Discord =====
DISCORD_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ===== 邮件 =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Auto-Reply Pro <your_email@gmail.com>"

# ===== 高级配置 =====
LOG_LEVEL=info
RATE_LIMIT_FEISHU=300
RATE_LIMIT_WECHAT=100
```

---

## 🎯 下一步

1. ✅ 配置环境变量
2. ✅ 启动服务
3. ✅ 访问管理面板
4. ✅ 发送测试消息
5. ✅ 开始使用

---

**配置完成后**: 访问 http://localhost:3003 查看管理面板

**需要帮助**: 查看 `QUICK-START-GUIDE.md` 或 `PROACTIVE-MESSAGING-DESIGN.md`
