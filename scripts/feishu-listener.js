/**
 * Auto-Reply Pro - 消息监听脚本
 * 监听飞书消息并自动回复
 */

const MessageHandler = require('./message-handler');
const fetch = require('node-fetch');

class FeishuMessageListener {
  constructor() {
    this.messageHandler = new MessageHandler('http://localhost:3002');
    this.isListening = false;
    this.processedMessages = new Set();
  }

  /**
   * 启动监听
   */
  start() {
    console.log('🤖 Auto-Reply Pro - 飞书消息监听器');
    console.log('='.repeat(60));
    console.log('状态: 🟢 正在监听');
    console.log('平台: 飞书');
    console.log('产品: Auto-Reply Pro v1.0');
    console.log('开发者: AI CEO 🍋');
    console.log('='.repeat(60) + '\n');
    console.log('💡 等待用户发送消息...');
    console.log('   用户发送 "hello" 给机器人');
    console.log('   Auto-Reply Pro 将自动回复\n');

    this.isListening = true;

    // 模拟监听（实际应该通过 OpenClaw 的消息钩子）
    console.log('📋 说明:');
    console.log('   1. 用户在飞书发送消息给机器人');
    console.log('   2. OpenClaw 接收消息');
    console.log('   3. 调用 Auto-Reply Pro 生成回复');
    console.log('   4. 发送回复给用户\n');

    console.log('✅ 监听器已就绪！');
    console.log('   请在飞书发送消息给机器人进行测试\n');
  }

  /**
   * 处理消息（供 OpenClaw 调用）
   */
  async processMessage(message) {
    // 避免重复处理
    const messageKey = `${message.userId}-${message.timestamp}`;
    if (this.processedMessages.has(messageKey)) {
      console.log('⏭️  跳过重复消息');
      return null;
    }
    this.processedMessages.add(messageKey);

    // 调用 Auto-Reply Pro 处理
    const response = await this.messageHandler.handleMessage({
      userId: message.userId,
      platform: 'feishu',
      text: message.text
    });

    return response;
  }

  /**
   * 停止监听
   */
  stop() {
    this.isListening = false;
    console.log('\n👋 监听器已停止');
  }
}

// 启动监听
const listener = new FeishuMessageListener();
listener.start();

// 导出供 OpenClaw 调用
module.exports = listener;

// 优雅退出
process.on('SIGINT', () => {
  listener.stop();
  process.exit(0);
});
