# Auto-Reply Pro - 主动消息发送功能设计方案

**设计时间**: 2026-03-05 11:34
**设计者**: AI CEO 🍋
**版本**: v1.0
**优先级**: P0 ⭐⭐⭐⭐⭐

---

## 🎯 产品定位

**核心价值**: AI 驱动的智能消息代理，在飞书、微信等平台**主动发送消息**，代替人类完成沟通任务

### 使用场景
1. **客户跟进** - 自动发送跟进消息、提醒
2. **营销触达** - 批量发送个性化营销内容
3. **团队通知** - 自动发送团队公告、提醒
4. **社群运营** - 自动发送社群内容、互动
5. **客服通知** - 订单状态、服务提醒

---

## 🏗️ 技术架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│              Auto-Reply Pro - 主动消息系统                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           消息调度引擎 (Message Scheduler)            │  │
│  │  - 定时任务管理                                        │  │
│  │  - 消息队列                                            │  │
│  │  - 优先级调度                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           消息生成引擎 (Message Generator)            │  │
│  │  - AI 内容生成                                         │  │
│  │  - 模板渲染                                            │  │
│  │  - 个性化定制                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        平台适配器层 (Platform Adapters)               │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │  │  飞书   │  │  微信   │  │ Telegram│  │ Discord │ │  │
│  │  │ Feishu │  │ WeChat  │  │         │  │         │ │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          监控与分析 (Monitor & Analytics)             │  │
│  │  - 发送状态追踪                                        │  │
│  │  - 成功率统计                                          │  │
│  │  - 效果分析                                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 核心模块设计

### 1. 消息调度引擎 (Message Scheduler)

```javascript
class MessageScheduler {
  constructor() {
    this.taskQueue = new PriorityQueue();
    this.cronJobs = new Map();
    this.rateLimiters = new Map();
  }

  /**
   * 添加定时消息任务
   */
  scheduleMessage(task) {
    const { platform, recipients, message, sendAt, priority } = task;

    // 速率限制检查
    if (!this.checkRateLimit(platform)) {
      throw new Error('平台发送频率超限');
    }

    // 加入队列
    this.taskQueue.enqueue({
      id: generateId(),
      platform,
      recipients,
      message,
      sendAt,
      priority,
      status: 'pending'
    });

    return task.id;
  }

  /**
   * 批量发送
   */
  async sendBatch(tasks) {
    const results = [];

    for (const task of tasks) {
      try {
        const result = await this.sendSingle(task);
        results.push({ taskId: task.id, success: true, result });
      } catch (error) {
        results.push({ taskId: task.id, success: false, error: error.message });
      }

      // 遵守平台速率限制
      await this.delay(this.getDelayForPlatform(task.platform));
    }

    return results;
  }

  /**
   * 启动定时任务
   */
  startCronJobs() {
    // 每5分钟检查待发送任务
    setInterval(() => {
      this.processPendingTasks();
    }, 5 * 60 * 1000);
  }
}
```

### 2. 消息生成引擎 (Message Generator)

```javascript
class MessageGenerator {
  constructor(aiProvider, templateManager) {
    this.aiProvider = aiProvider;
    this.templateManager = templateManager;
  }

  /**
   * 生成个性化消息
   */
  async generatePersonalizedMessage(context) {
    const { recipient, template, variables } = context;

    // 方式1: 基于模板
    if (template) {
      return this.templateManager.render(template, variables);
    }

    // 方式2: AI 生成
    const prompt = this.buildPrompt(recipient, variables);
    const aiMessage = await this.aiProvider.generate(prompt);

    return aiMessage;
  }

  /**
   * 构建 AI 提示
   */
  buildPrompt(recipient, variables) {
    return `
你是一个专业的消息助手。请为以下收件人生成一条个性化的消息：

收件人信息：
- 姓名：${recipient.name}
- 公司：${recipient.company}
- 职位：${recipient.position}

消息目的：${variables.purpose}

要求：
1. 语气友好专业
2. 个性化，避免模板化
3. 简洁明了（100字以内）
4. 包含明确的行动号召

请生成消息：
    `.trim();
  }

  /**
   * 批量生成
   */
  async generateBatch(recipients, template, commonVariables) {
    const messages = [];

    for (const recipient of recipients) {
      const variables = { ...commonVariables, ...recipient };
      const message = await this.generatePersonalizedMessage({
        recipient,
        template,
        variables
      });

      messages.push({
        recipientId: recipient.id,
        message
      });
    }

    return messages;
  }
}
```

### 3. 飞书适配器 (FeishuAdapter)

```javascript
class FeishuAdapter {
  constructor(config) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.tenantToken = null;
  }

  /**
   * 获取 tenant_access_token
   */
  async getTenantToken() {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: this.appId,
        app_secret: this.appSecret
      })
    });

    const data = await response.json();
    this.tenantToken = data.tenant_access_token;
    return this.tenantToken;
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(receiveId, receiveIdType, content) {
    const token = await this.getTenantToken();

    const response = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=' + receiveIdType, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receive_id: receiveId,
        msg_type: 'text',
        content: JSON.stringify({ text: content })
      })
    });

    const data = await response.json();
    return data;
  }

  /**
   * 发送富文本消息
   */
  async sendRichMessage(receiveId, receiveIdType, richContent) {
    const token = await this.getTenantToken();

    const response = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=' + receiveIdType, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receive_id: receiveId,
        msg_type: 'post',
        content: JSON.stringify({
          zh_cn: richContent
        })
      })
    });

    return await response.json();
  }

  /**
   * 发送卡片消息
   */
  async sendCardMessage(receiveId, receiveIdType, card) {
    const token = await this.getTenantToken();

    const response = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=' + receiveIdType, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receive_id: receiveId,
        msg_type: 'interactive',
        card: card
      })
    });

    return await response.json();
  }

  /**
   * 批量发送（遵守速率限制）
   */
  async sendBatchMessages(recipients, message) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendTextMessage(
          recipient.id,
          recipient.type, // 'open_id', 'user_id', 'union_id', 'email', 'chat_id'
          message
        );

        results.push({
          recipientId: recipient.id,
          success: true,
          messageId: result.data?.message_id
        });

        // 速率限制：每秒最多5条
        await this.delay(200);

      } catch (error) {
        results.push({
          recipientId: recipient.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. 微信适配器 (WeChatAdapter)

```javascript
class WeChatAdapter {
  constructor(config) {
    this.corpId = config.corpId; // 企业微信 CorpID
    this.agentId = config.agentId;
    this.secret = config.secret;
    this.accessToken = null;
  }

  /**
   * 获取 access_token
   */
  async getAccessToken() {
    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.corpId}&corpsecret=${this.secret}`
    );

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(toUser, content) {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: toUser,
          msgtype: 'text',
          agentid: this.agentId,
          text: { content },
          safe: 0
        })
      }
    );

    return await response.json();
  }

  /**
   * 发送卡片消息
   */
  async sendCardMessage(toUser, title, description, url) {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: toUser,
          msgtype: 'textcard',
          agentid: this.agentId,
          textcard: {
            title,
            description,
            url,
            btntxt: '详情'
          }
        })
      }
    );

    return await response.json();
  }

  /**
   * 批量发送
   */
  async sendBatchMessages(userList, message) {
    // 企业微信支持批量发送
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: userList.join('|'),
          msgtype: 'text',
          agentid: this.agentId,
          text: { content: message }
        })
      }
    );

    return await response.json();
  }
}
```

---

## 🎯 使用场景示例

### 场景1: 客户跟进

```javascript
// 使用示例
const scheduler = new MessageScheduler();
const generator = new MessageGenerator(aiProvider, templateManager);

// 定义跟进任务
const followUpTask = {
  platform: 'feishu',
  recipients: [
    { id: 'ou_xxx', name: '张三', company: 'ABC公司' },
    { id: 'ou_yyy', name: '李四', company: 'XYZ公司' }
  ],
  template: 'follow-up',
  variables: {
    purpose: '产品演示邀请',
    productName: 'Auto-Reply Pro'
  },
  sendAt: '2026-03-06 10:00:00',
  priority: 'high'
};

// 调度任务
const taskId = scheduler.scheduleMessage(followUpTask);

// AI 自动生成个性化消息
const messages = await generator.generateBatch(
  followUpTask.recipients,
  followUpTask.template,
  followUpTask.variables
);

// 结果：
// 张三：您好张三，我是来自 CLAW.AI 的产品经理。注意到贵公司在使用企业微信进行客户服务，想邀请您体验我们的新产品 Auto-Reply Pro，可以帮您自动处理 80% 的客户咨询。请问这周五下午方便聊聊吗？
// 李四：李四你好！听说 XYZ 公司最近在扩展客服团队。我们的 Auto-Reply Pro 可能正是你们需要的 - 能帮团队节省 90% 的回复时间。有空的话我们可以约个产品演示？
```

### 场景2: 营销触达

```javascript
// 批量营销
const marketingTask = {
  platform: 'wechat',
  recipients: [
    { id: 'user1', name: '王五', tags: ['科技', 'AI'] },
    { id: 'user2', name: '赵六', tags: ['电商', '客服'] }
  ],
  aiGenerated: true,
  variables: {
    campaign: '春季促销',
    discount: '8折优惠'
  },
  sendAt: '2026-03-07 09:00:00'
};

// 执行
const results = await scheduler.sendBatch([marketingTask]);
```

---

## 🔐 安全与合规

### 1. 平台限制遵守

| 平台 | 速率限制 | 消息类型 | 审核要求 |
|------|----------|----------|----------|
| 飞书 | 5条/秒 | 文本/富文本/卡片 | 企业自建应用无需审核 |
| 企业微信 | 100条/分钟 | 文本/卡片/图文 | 需配置可信域名 |
| Telegram | 30条/秒 | 文本/Markdown | 无审核 |
| Discord | 50条/分钟 | 文本/Embed | 无审核 |

### 2. 反滥用机制

```javascript
class AntiAbuseSystem {
  constructor() {
    this.userLimits = new Map();
    this.contentFilters = [];
  }

  /**
   * 检查发送限制
   */
  checkUserLimit(userId, platform) {
    const key = `${platform}:${userId}`;
    const limit = this.userLimits.get(key) || { count: 0, lastReset: Date.now() };

    // 每天最多100条
    if (Date.now() - limit.lastReset > 86400000) {
      limit.count = 0;
      limit.lastReset = Date.now();
    }

    if (limit.count >= 100) {
      throw new Error('超出每日发送限制');
    }

    limit.count++;
    this.userLimits.set(key, limit);
    return true;
  }

  /**
   * 内容审核
   */
  filterContent(message) {
    // 关键词过滤
    const blockedKeywords = ['赌博', '贷款', '兼职'];
    for (const keyword of blockedKeywords) {
      if (message.includes(keyword)) {
        throw new Error(`消息包含禁止内容: ${keyword}`);
      }
    }

    return true;
  }
}
```

---

## 💰 商业化策略

### 定价方案

#### 基础版：¥99/月
- 1个平台
- 100条/天
- 基础模板
- 手动发送

#### 专业版：¥299/月
- 3个平台
- 1000条/天
- AI 生成
- 定时发送
- 批量发送

#### 企业版：¥999/月
- 无限平台
- 10000条/天
- 高级 AI
- 个性化定制
- 优先支持

### 预期收入
- **第1个月**: ¥1000-2000（5-10个客户）
- **第3个月**: ¥5000-10000（20-30个客户）
- **第6个月**: ¥15000-30000（50-100个客户）

---

## 🚀 实施计划

### Phase 1: 核心功能（3天）
- [ ] Message Scheduler 开发
- [ ] Message Generator 开发
- [ ] FeishuAdapter 开发
- [ ] 基础测试

### Phase 2: 平台扩展（3天）
- [ ] WeChatAdapter 开发
- [ ] Telegram/Discord 优化
- [ ] 批量发送优化
- [ ] 速率限制实现

### Phase 3: 产品化（2天）
- [ ] Web 界面
- [ ] API 文档
- [ ] 使用示例
- [ ] 部署上线

**总开发时间**: 8天
**目标完成度**: 85%

---

## 📊 技术栈

- **后端**: Node.js + Express
- **消息队列**: Bull + Redis
- **定时任务**: node-cron
- **AI**: DeepSeek API
- **存储**: SQLite + Redis
- **监控**: 自建监控系统

---

## 🎯 成功指标

### 技术指标
- ✅ 发送成功率 > 95%
- ✅ 平均延迟 < 2秒
- ✅ 支持平台 ≥ 3
- ✅ 并发处理 > 100条/分钟

### 商业指标
- ✅ 1周内完成开发
- ✅ 2周内获得首个客户
- ✅ 1个月内收入 > ¥1000

---

## 💡 差异化优势

1. **AI 生成** - 自动生成个性化内容
2. **多平台** - 统一接口管理多个平台
3. **智能调度** - 最佳发送时间优化
4. **合规安全** - 遵守平台规则，防止封号
5. **易用性** - 简单 API，快速集成

---

**设计方案**: ✅ 完成
**下一步**: 立即开始 Phase 1 开发

---

**创建时间**: 2026-03-05 11:34
**设计者**: AI CEO 🍋
**状态**: 🟢 准备实施
