/**
 * 使用 OpenClaw 内置的飞书能力发送消息
 */

async function sendFeishuMessage() {
  console.log('🚀 尝试通过 OpenClaw 发送飞书消息...\n');
  
  // 目标用户 ID
  const userId = 'ou_d5695b3a7239c8fb1a3af9a46140b27e';
  const message = 'hello';
  
  console.log(`目标用户: ${userId}`);
  console.log(`消息内容: ${message}\n`);
  
  try {
    // 使用 OpenClaw 的 message 工具
    const { message: messageTool } = require('openclaw');
    
    // 发送消息
    await messageTool({
      action: 'send',
      channel: 'feishu',
      target: `user:${userId}`,
      message: message
    });
    
    console.log('✅ 消息发送成功！');
    
  } catch (error) {
    console.error('❌ 发送失败:', error.message);
    console.log('\n尝试直接使用 fetch 调用 OpenClaw API...');
    
    // 备用方案：直接调用本地 API
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch('http://localhost:3002/api/send-feishu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          message: message
        })
      });
      
      const result = await response.json();
      console.log('结果:', result);
      
    } catch (e) {
      console.error('备用方案也失败:', e.message);
    }
  }
}

sendFeishuMessage();
