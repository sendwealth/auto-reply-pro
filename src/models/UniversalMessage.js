// Universal Message Model - 统一消息模型
class UniversalMessage {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.timestamp = data.timestamp || new Date();

    // 来源信息
    this.source = {
      platform: data.platform,      // discord/github/email/web
      channelId: data.channelId,
      userId: data.userId,
      userName: data.userName,
      metadata: data.metadata || {}
    };

    // 消息内容
    this.content = {
      text: data.text,
      type: data.type || 'text',
      attachments: data.attachments || [],
      mentions: data.mentions || [],
      replyTo: data.replyTo
    };

    // 上下文信息
    this.context = {
      conversationId: data.conversationId || this.generateConversationId(),
      threadId: data.threadId,
      parentMessageId: data.parentMessageId,
      history: data.history || []
    };

    // 处理标记
    this.flags = {
      priority: data.priority || 'normal',
      requiresResponse: data.requiresResponse !== false,
      processed: false
    };
  }

  generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateConversationId() {
    return `conv_${this.source.platform}_${this.source.userId}`;
  }

  // 转换为 JSON
  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      source: this.source,
      content: this.content,
      context: this.context,
      flags: this.flags
    };
  }

  // 从 JSON 创建
  static fromJSON(json) {
    return new UniversalMessage(json);
  }
}

// 统一响应模型
class UniversalResponse {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.timestamp = new Date();

    this.target = {
      platform: data.platform,
      channelId: data.channelId,
      userId: data.userId,
      replyToMessageId: data.replyToMessageId
    };

    this.content = {
      text: data.text,
      type: data.type || 'text',
      attachments: data.attachments || [],
      metadata: data.metadata || {}
    };

    this.metadata = {
      strategy: data.strategy,
      aiModel: data.aiModel,
      confidence: data.confidence,
      processingTime: data.processingTime
    };
  }

  generateId() {
    return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 导出
module.exports = { UniversalMessage, UniversalResponse };
