/**
 * Auto-Reply Pro - 消息路由器
 * 根据用户意图决定使用哪个 AI 回复
 */

class MessageRouter {
  constructor() {
    this.autoReplyProEndpoint = 'http://localhost:3002/api/chat';
    this.triggers = [
      'auto-reply',
      '自动回复',
      '@auto',
      '用 auto-reply',
      '让 auto-reply'
    ];
  }

  /**
   * 判断是否应该使用 Auto-Reply Pro
   */
  shouldUseAutoReplyPro(message) {
    const lowerMessage = message.toLowerCase();

    // 检查触发词
    for (const trigger of this.triggers) {
      if (lowerMessage.includes(trigger.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * 提取实际消息内容
   */
  extractMessage(message) {
    let cleaned = message;

    // 移除触发词
    for (const trigger of this.triggers) {
      const regex = new RegExp(trigger + '[::：]?\\s*', 'i');
      cleaned = cleaned.replace(regex, '');
    }

    return cleaned.trim();
  }

  /**
   * 路由消息
   */
  async route(message, userId) {
    // 检查是否应该使用 Auto-Reply Pro
    if (this.shouldUseAutoReplyPro(message)) {
      const actualMessage = this.extractMessage(message);

      console.log('\n🔀 消息路由');
      console.log('   原始消息:', message);
      console.log('   路由到: Auto-Reply Pro');
      console.log('   实际内容:', actualMessage);

      // 调用 Auto-Reply Pro
      const fetch = require('node-fetch');
      const response = await fetch(this.autoReplyProEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: actualMessage,
          userId: userId,
          channelId: 'feishu'
        })
      });

      const data = await response.json();

      return {
        useAutoReplyPro: true,
        reply: data.reply,
        intent: data.intent,
        confidence: data.confidence,
        product: 'Auto-Reply Pro',
        version: '1.0.0'
      };
    }

    // 使用默认处理（OpenClaw AI）
    return {
      useAutoReplyPro: false,
      reply: null
    };
  }
}

module.exports = MessageRouter;
