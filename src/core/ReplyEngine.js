// Auto-Reply Pro - 核心引擎
// 文件: src/core/ReplyEngine.js

class ReplyEngine {
  constructor() {
    this.templates = new Map();
    this.platforms = new Map();
    this.aiEnabled = false;
  }

  /**
   * 注册平台适配器
   */
  registerPlatform(platform, adapter) {
    this.platforms.set(platform, adapter);
    console.log(`✅ 平台已注册: ${platform}`);
  }

  /**
   * 添加回复模板
   * @param {Object} template - 模板配置
   * @example
   * {
   *   id: 'welcome',
   *   name: '欢迎消息',
   *   triggers: ['keyword:hello', 'keyword:hi'],
   *   template: '你好 {username}！欢迎来到我们的社区。',
   *   platforms: ['discord', 'github']
   * }
   */
  addTemplate(template) {
    const id = template.id || `template-${Date.now()}`;
    this.templates.set(id, template);
    console.log(`✅ 模板已添加: ${template.name}`);
    return id;
  }

  /**
   * 处理消息并生成回复
   */
  async processMessage(message) {
    console.log(`📨 处理消息: [${message.platform}] ${message.content.substring(0, 50)}...`);

    // 1. 查找匹配的模板
    const matchedTemplate = this.findMatchingTemplate(message);

    if (!matchedTemplate) {
      console.log('ℹ️  未找到匹配的模板');
      return null;
    }

    // 2. 生成回复
    let reply;
    if (this.aiEnabled && matchedTemplate.useAI) {
      reply = await this.generateAIReply(message, matchedTemplate);
    } else {
      reply = this.generateTemplateReply(message, matchedTemplate);
    }

    // 3. 发送回复
    await this.sendReply(message, reply);

    return reply;
  }

  /**
   * 查找匹配的模板
   */
  findMatchingTemplate(message) {
    for (const [id, template] of this.templates) {
      // 检查平台
      if (template.platforms && !template.platforms.includes(message.platform)) {
        continue;
      }

      // 检查触发条件
      if (!template.triggers || template.triggers.length === 0) {
        continue;
      }

      for (const trigger of template.triggers) {
        if (trigger.startsWith('keyword:')) {
          const keyword = trigger.substring(8).toLowerCase();
          if (message.content.toLowerCase().includes(keyword)) {
            return template;
          }
        }

        if (trigger.startsWith('regex:')) {
          const pattern = trigger.substring(6);
          const regex = new RegExp(pattern, 'i');
          if (regex.test(message.content)) {
            return template;
          }
        }
      }
    }

    return null;
  }

  /**
   * 基于模板生成回复
   */
  generateTemplateReply(message, template) {
    let reply = template.template;

    // 变量替换
    reply = reply.replace(/{username}/g, message.username || message.author);
    reply = reply.replace(/{platform}/g, message.platform);
    reply = reply.replace(/{channel}/g, message.channelName || '');
    reply = reply.replace(/{date}/g, new Date().toLocaleDateString());
    reply = reply.replace(/{time}/g, new Date().toLocaleTimeString());

    return {
      content: reply,
      templateId: template.id,
      type: 'template'
    };
  }

  /**
   * 使用 AI 生成回复
   */
  async generateAIReply(message, template) {
    // TODO: 集成 OpenAI API
    console.log('🤖 AI 生成回复中...');

    // 暂时返回模板回复
    return this.generateTemplateReply(message, template);
  }

  /**
   * 发送回复
   */
  async sendReply(originalMessage, reply) {
    try {
      const adapter = this.platforms.get(originalMessage.platform);

      if (!adapter) {
        console.error(`❌ 未找到平台适配器: ${originalMessage.platform}`);
        return;
      }

      await adapter.sendReply(originalMessage.channelId, reply.content);

      console.log(`✅ 回复已发送: [${originalMessage.platform}]`);

      // 记录统计
      this.recordStats(originalMessage, reply);

    } catch (error) {
      console.error('❌ 发送回复失败:', error.message);
    }
  }

  /**
   * 记录统计数据
   */
  recordStats(message, reply) {
    // TODO: 存储到数据库
    const stats = {
      timestamp: new Date().toISOString(),
      platform: message.platform,
      templateId: reply.templateId,
      type: reply.type,
      responseTime: Date.now() - new Date(message.timestamp).getTime()
    };

    console.log('📊 统计:', stats);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalTemplates: this.templates.size,
      totalPlatforms: this.platforms.size,
      aiEnabled: this.aiEnabled
    };
  }
}

module.exports = ReplyEngine;
