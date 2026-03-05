/**
 * Auto-Reply Pro - OpenClaw 桥接器
 * 让产品能够通过 OpenClaw 发送飞书消息
 */

class OpenClawBridge {
  constructor() {
    this.platform = 'feishu';
  }

  /**
   * 发送飞书消息
   */
  async sendFeishuMessage(userId, message) {
    console.log(`\n📤 Auto-Reply Pro 准备发送消息`);
    console.log(`   产品: Auto-Reply Pro v1.0`);
    console.log(`   平台: 飞书`);
    console.log(`   接收者: ${userId}`);
    console.log(`   消息: ${message}\n`);

    try {
      // 通过 OpenClaw 的能力发送消息
      // 这里我们返回一个特殊的响应，让外部调用者知道需要调用 OpenClaw
      return {
        success: true,
        needOpenClaw: true,
        action: 'send',
        channel: 'feishu',
        target: `user:${userId}`,
        message: message,
        note: 'Auto-Reply Pro 请求发送消息'
      };
    } catch (error) {
      console.error('❌ 发送失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = OpenClawBridge;
