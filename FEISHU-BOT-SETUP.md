/**
 * Auto-Reply Pro - 飞书机器人配置指南
 */

# 🤖 创建独立的 Auto-Reply Pro 飞书机器人

## 第一步：创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 点击"创建企业自建应用"
3. 填写应用信息：
   - 应用名称：Auto-Reply Pro
   - 应用描述：AI 驱动的智能消息平台
   - 应用图标：上传 Auto-Reply Pro logo

## 第二步：配置权限

### 必需权限
- ✅ `im:message` - 获取与发送消息
- ✅ `im:message:send_as_bot` - 以应用身份发消息
- ✅ `im:chat` - 获取群组信息
- ✅ `im:chat:readonly` - 读取群组信息

### 配置步骤
1. 进入应用后台
2. 点击"权限管理"
3. 搜索并添加上述权限
4. 发布版本并申请上线

## 第三步：配置消息接收

### 事件订阅
1. 进入"事件订阅"
2. 配置请求网址：
   ```
   https://your-domain.com/webhook/feishu
   ```
3. 添加事件：
   - `im.message.receive_v1` - 接收消息

### 消息处理流程
```
飞书 → 推送消息到 webhook
    ↓
Auto-Reply Pro 服务器接收
    ↓
调用 Auto-Reply Pro 处理
    ↓
通过飞书 API 回复
```

## 第四步：获取凭证

```bash
# .env 配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxx
FEISHU_VERIFICATION_TOKEN=xxxxxxxxxx
FEISHU_ENCRYPT_KEY=xxxxxxxxxxxxxxxxx
```

## 第五步：部署服务器

### 本地测试（使用 ngrok）
```bash
# 安装 ngrok
brew install ngrok

# 启动 Auto-Reply Pro
node src/feishu-bot-server.js

# 启动 ngrok
ngrok http 3002

# 将 ngrok 地址配置到飞书事件订阅
```

### 生产部署
```bash
# 部署到服务器
docker-compose up -d

# 配置域名和 SSL
# 更新飞书事件订阅地址
```

## 第六步：测试

1. 在飞书找到"Auto-Reply Pro"机器人
2. 发送消息："hello"
3. 收到 Auto-Reply Pro 的回复
4. 发送者显示为"Auto-Reply Pro"

## 🎯 效果展示

```
用户: hello

Auto-Reply Pro: Hello! I'm your intelligent customer service
                assistant. How can I help you today?
```

---

## 📋 快速配置清单

- [ ] 创建飞书应用
- [ ] 配置权限
- [ ] 设置事件订阅
- [ ] 获取应用凭证
- [ ] 部署服务器
- [ ] 测试消息收发

---

**配置时间**: 约 30 分钟
**难度**: ⭐⭐⭐ 中等
**效果**: ⭐⭐⭐⭐⭐ 完美
