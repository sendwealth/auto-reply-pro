/**
 * Auto-Reply Pro - 消息处理器
 * 接收用户消息，生成智能回复
 */

class MessageHandler {
  constructor(apiEndpoint = 'http://localhost:3002') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * 处理收到的消息
   * @param {Object} message - 消息对象
   * @returns {Object} - 回复对象
   */
  async handleMessage(message) {
    console.log('\n' + '='.repeat(60));
    console.log('📨 Auto-Reply Pro - 收到用户消息');
    console.log('='.repeat(60));
    console.log(`用户 ID: ${message.userId}`);
    console.log(`平台: ${message.platform}`);
    console.log(`消息内容: "${message.text}"`);
    console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('='.repeat(60) + '\n');

    try {
      // 调用 Auto-Reply Pro API 生成回复
      const response = await this.callAutoReplyAPI(message);

      console.log('✅ Auto-Reply Pro 已生成回复');
      console.log(`回复内容: "${response.reply}"`);
      console.log(`意图: ${response.intent}`);
      console.log(`置信度: ${response.confidence}\n`);

      return {
        success: true,
        reply: response.reply,
        intent: response.intent,
        confidence: response.confidence,
        product: 'Auto-Reply Pro',
        version: '1.0.0'
      };

    } catch (error) {
      console.error('❌ 处理失败:', error.message);
      return {
        success: false,
        reply: '抱歉，处理消息时出现错误。请稍后再试。',
        error: error.message
      };
    }
  }

  /**
   * 调用 Auto-Reply Pro API
   */
  async callAutoReplyAPI(message) {
    const fetch = require('node-fetch');

    const response = await fetch(`${this.apiEndpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message.text,
        userId: message.userId,
        channelId: message.platform
      })
    });

    if (!response.ok) {
      throw new Error(`API 调用失败: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '未知错误');
    }

    return {
      reply: data.reply,
      intent: data.intent,
      confidence: data.confidence
    };
  }
}

module.exports = MessageHandler;

// 如果直接运行此脚本，启动监听
if (require.main === module) {
  const handler = new MessageHandler();

  console.log('🤖 Auto-Reply Pro 消息处理器已启动');
  console.log('等待消息...\n');

  // 导出处理函数供 OpenClaw 调用
  module.exports.handleMessage = handler.handleMessage.bind(handler);
}
