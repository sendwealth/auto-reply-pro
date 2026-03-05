/**
 * Auto-Reply Pro - OpenClaw 集成钩子
 * 当收到用户消息时自动调用
 */

const MessageHandler = require('./message-handler');

// 创建消息处理器
const handler = new MessageHandler('http://localhost:3002');

/**
 * 消息钩子函数
 * OpenClaw 在收到消息时会调用此函数
 */
async function onMessageReceived(message) {
  console.log('\n🔔 OpenClaw 钩子触发：收到用户消息');
  console.log('   用户:', message.userId || message.from);
  console.log('   内容:', message.text || message.content);

  try {
    // 调用 Auto-Reply Pro 生成回复
    const response = await handler.handleMessage({
      userId: message.userId || message.from,
      platform: message.platform || 'feishu',
      text: message.text || message.content
    });

    // 返回回复内容
    // OpenClaw 会自动发送给用户
    return {
      reply: response.reply,
      product: 'Auto-Reply Pro',
      version: '1.0.0'
    };

  } catch (error) {
    console.error('❌ 处理失败:', error.message);
    return {
      reply: '抱歉，处理消息时出现错误。',
      error: error.message
    };
  }
}

// 导出钩子函数
module.exports = {
  onMessageReceived
};

// 说明
console.log('🤖 Auto-Reply Pro - OpenClaw 钩子已加载');
console.log('');
console.log('功能:');
console.log('  ✅ 监听用户消息');
console.log('  ✅ 调用 Auto-Reply Pro 处理');
console.log('  ✅ 自动回复用户');
console.log('');
console.log('使用方法:');
console.log('  1. 用户发送消息给机器人');
console.log('  2. OpenClaw 自动调用 onMessageReceived()');
console.log('  3. Auto-Reply Pro 生成回复');
console.log('  4. 回复自动发送给用户');
console.log('');
