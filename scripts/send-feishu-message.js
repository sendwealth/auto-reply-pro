/**
 * 飞书消息发送工具 - 直接发送消息给用户
 */

const https = require('https');

// 飞书配置
const FEISHU_CONFIG = {
  appId: process.env.FEISHU_APP_ID || 'cli_a7c1d2e3f4g5h6i7',
  appSecret: process.env.FEISHU_APP_SECRET || 'test-secret-for-demo',
  // 你的飞书用户 ID
  userId: 'ou_d5695b3a7239c8fb1a3af9a46140b27e'
};

/**
 * 获取飞书访问令牌
 */
async function getTenantToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      app_id: FEISHU_CONFIG.appId,
      app_secret: FEISHU_CONFIG.appSecret
    });

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code === 0) {
            resolve(result.tenant_access_token);
          } else {
            reject(new Error(`获取 token 失败: ${result.msg}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 发送文本消息
 */
async function sendTextMessage(accessToken, receiveId, text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      receive_id: receiveId,
      msg_type: 'text',
      content: JSON.stringify({ text })
    });

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/im/v1/messages?receive_id_type=user_id',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 主函数 - 发送 hello 消息
 */
async function main() {
  console.log('🚀 准备通过飞书发送消息...\n');
  console.log(`目标用户: ${FEISHU_CONFIG.userId}\n`);

  try {
    // 1. 获取访问令牌
    console.log('1️⃣ 获取飞书访问令牌...');
    const accessToken = await getTenantToken();
    console.log('✅ 令牌获取成功\n');

    // 2. 发送消息
    console.log('2️⃣ 发送消息: "hello"');
    const result = await sendTextMessage(accessToken, FEISHU_CONFIG.userId, 'hello');
    
    if (result.code === 0) {
      console.log('✅ 消息发送成功！');
      console.log(`   消息 ID: ${result.data?.message_id}`);
    } else {
      console.log('❌ 消息发送失败');
      console.log(`   错误码: ${result.code}`);
      console.log(`   错误信息: ${result.msg}`);
    }

  } catch (error) {
    console.error('❌ 发送失败:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('   1. FEISHU_APP_ID 或 FEISHU_APP_SECRET 未配置');
    console.log('   2. 应用未获得发送消息的权限');
    console.log('   3. 用户 ID 不正确');
    console.log('\n📝 配置方法:');
    console.log('   export FEISHU_APP_ID="your-app-id"');
    console.log('   export FEISHU_APP_SECRET="your-app-secret"');
  }
}

// 执行
main();
