/**
 * Auto-Reply Pro - 消息发送脚本
 * 通过 Auto-Reply Pro 产品发送消息给用户
 */

// 目标用户
const TARGET_USER = 'ou_d5695b3a7239c8fb1a3af9a46140b27e';
const MESSAGE = 'hello';

console.log('🤖 Auto-Reply Pro - 消息发送任务');
console.log('='.repeat(60));
console.log(`\n产品: Auto-Reply Pro v1.0`);
console.log(`任务: 发送消息给用户`);
console.log(`接收者: ${TARGET_USER}`);
console.log(`消息内容: "${MESSAGE}"\n`);

// 返回需要发送的消息信息
const sendRequest = {
  success: true,
  product: 'Auto-Reply Pro',
  version: '1.0.0',
  action: 'send_message',
  platform: 'feishu',
  target: TARGET_USER,
  message: MESSAGE,
  timestamp: new Date().toISOString()
};

console.log('✅ 消息请求已准备');
console.log('\n请求信息:');
console.log(JSON.stringify(sendRequest, null, 2));

// 导出请求信息
module.exports = sendRequest;
