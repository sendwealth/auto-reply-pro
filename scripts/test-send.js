/**
 * 消息发送测试工具
 * 快速测试各平台消息发送功能
 */

const readline = require('readline');

console.log('🧪 Auto-Reply Pro 消息发送测试\n');
console.log('='.repeat(60));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 平台配置
const platforms = {
  1: { name: '飞书', adapter: 'FeishuAdapter', env: ['FEISHU_APP_ID', 'FEISHU_APP_SECRET'] },
  2: { name: '企业微信', adapter: 'WeChatAdapter', env: ['WECHAT_CORP_ID', 'WECHAT_AGENT_ID', 'WECHAT_SECRET'] },
  3: { name: '邮件', adapter: 'EmailAdapter', env: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] },
  4: { name: 'Discord', adapter: 'DiscordAdapter', env: ['DISCORD_BOT_TOKEN'] },
  5: { name: 'Web Chat', adapter: 'WebAdapter', env: [] }
};

// 检查环境变量
function checkPlatformEnv(platform) {
  const config = platforms[platform];
  if (!config) return false;

  if (config.env.length === 0) return true;

  const missing = config.env.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.log(`\n⚠️  ${config.name} 未配置以下环境变量:`);
    missing.forEach(key => console.log(`  - ${key}`));
    return false;
  }

  return true;
}

// 测试飞书
async function testFeishu() {
  const FeishuAdapter = require('../src/adapters/FeishuAdapter');

  console.log('\n📱 飞书消息发送测试\n');

  const adapter = new FeishuAdapter({
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET
  });

  rl.question('请输入接收者 ID (open_id): ', async (receiveId) => {
    rl.question('请输入消息内容: ', async (message) => {
      try {
        console.log('\n⏳ 发送中...');
        const result = await adapter.sendTextMessage(receiveId, 'open_id', message);
        console.log('✅ 发送成功！');
        console.log('消息 ID:', result.messageId);
      } catch (error) {
        console.log('❌ 发送失败:', error.message);
      }
      rl.close();
    });
  });
}

// 测试企业微信
async function testWeChat() {
  const WeChatAdapter = require('../src/adapters/WeChatAdapter');

  console.log('\n📱 企业微信消息发送测试\n');

  const adapter = new WeChatAdapter({
    corpId: process.env.WECHAT_CORP_ID,
    agentId: process.env.WECHAT_AGENT_ID,
    secret: process.env.WECHAT_SECRET
  });

  rl.question('请输入接收者 ID (多个用 | 分隔): ', async (toUser) => {
    rl.question('请输入消息内容: ', async (message) => {
      try {
        console.log('\n⏳ 发送中...');
        const result = await adapter.sendTextMessage(toUser, message);
        console.log('✅ 发送成功！');
        console.log('消息 ID:', result.messageId);
      } catch (error) {
        console.log('❌ 发送失败:', error.message);
      }
      rl.close();
    });
  });
}

// 测试邮件
async function testEmail() {
  const EmailAdapter = require('../src/adapters/EmailAdapter');

  console.log('\n📧 邮件发送测试\n');

  const adapter = new EmailAdapter({
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM
  });

  rl.question('请输入收件人邮箱: ', async (to) => {
    rl.question('请输入邮件主题: ', async (subject) => {
      rl.question('请输入邮件内容: ', async (content) => {
        try {
          console.log('\n⏳ 发送中...');
          await adapter.connect();
          const result = await adapter.sendEmail(to, subject, content);
          console.log('✅ 发送成功！');
          console.log('消息 ID:', result.messageId);
        } catch (error) {
          console.log('❌ 发送失败:', error.message);
        }
        rl.close();
      });
    });
  });
}

// 测试 Web Chat
async function testWebChat() {
  console.log('\n💬 Web Chat 测试\n');
  console.log('请使用 curl 或 Postman 测试:');
  console.log('\ncurl -X POST http://localhost:3002/api/chat \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"message":"你好","userId":"test"}\'');
  rl.close();
}

// 主菜单
function showMenu() {
  console.log('\n🎯 选择要测试的平台:\n');
  Object.entries(platforms).forEach(([key, value]) => {
    const configured = checkPlatformEnv(parseInt(key));
    const status = configured ? '✅' : '❌';
    console.log(`  ${key}) ${status} ${value.name}`);
  });
  console.log('  0) 退出');
  console.log('');
}

// 主函数
function main() {
  // 加载环境变量
  require('dotenv').config();

  showMenu();

  rl.question('请选择 (0-5): ', async (choice) => {
    const platform = parseInt(choice);

    if (platform === 0) {
      console.log('\n👋 再见！');
      rl.close();
      return;
    }

    if (!platforms[platform]) {
      console.log('\n❌ 无效选择');
      rl.close();
      return;
    }

    if (!checkPlatformEnv(platform)) {
      console.log('\n💡 请先在 .env 文件中配置相应的环境变量');
      rl.close();
      return;
    }

    switch (platform) {
      case 1:
        await testFeishu();
        break;
      case 2:
        await testWeChat();
        break;
      case 3:
        await testEmail();
        break;
      case 4:
        console.log('\n⚠️  Discord 测试需要运行 Bot 服务');
        rl.close();
        break;
      case 5:
        await testWebChat();
        break;
    }
  });
}

main();
