/**
 * Auto-Reply Pro - 主动消息发送演示
 * 展示如何在飞书、微信等平台主动发送消息
 */

const MessageScheduler = require('./src/scheduler/MessageScheduler');
const MessageGenerator = require('./src/generator/MessageGenerator');
const FeishuAdapter = require('./src/adapters/FeishuAdapter');
const TemplateManager = require('./src/core/TemplateManager');

console.log('🚀 Auto-Reply Pro - 主动消息发送演示\n');
console.log('='.repeat(60));

// ========== 初始化 ==========

console.log('\n📦 初始化组件...\n');

// 1. 创建模板管理器
const templateManager = new TemplateManager();

// 添加自定义模板
templateManager.addCustomTemplate('follow-up', {
  zh: '{{name}}您好！我是来自 CLAW.AI 的产品经理。想向您介绍我们的新产品 {{productName}}，{{purpose}}。如有兴趣，我们可以约个时间详细聊聊。'
});

templateManager.addCustomTemplate('notification', {
  zh: '📢 {{title}}\n\n{{content}}\n\n⏰ {{time}}'
});

// 2. 创建消息生成器
const generator = new MessageGenerator({
  aiProvider: 'deepseek',
  apiKey: process.env.DEEPSEEK_API_KEY,
  templateManager
});

// 3. 创建消息调度器
const scheduler = new MessageScheduler({
  maxConcurrent: 10,
  retryAttempts: 3
});

// 4. 创建飞书适配器（如果配置了）
const feishuAdapter = new FeishuAdapter({
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET
});

// 注册平台适配器
scheduler.registerPlatform('feishu', feishuAdapter);

console.log('✅ 所有组件初始化完成\n');

// ========== 场景1: AI 生成个性化消息 ==========

console.log('📋 场景1: AI 生成个性化跟进消息\n');
console.log('-'.repeat(60));

async function demo1_AIGeneration() {
  const recipients = [
    { id: 'ou_demo1', name: '张三', company: 'ABC科技', position: '产品经理', tags: ['AI', '效率工具'] },
    { id: 'ou_demo2', name: '李四', company: 'XYZ公司', position: '技术总监', tags: ['客服', '自动化'] }
  ];

  const variables = {
    purpose: '可以帮助您的团队节省90%的回复时间',
    productName: 'Auto-Reply Pro',
    action: '预约产品演示'
  };

  console.log('收件人:', recipients.map(r => r.name).join(', '));
  console.log('消息目的:', variables.purpose);
  console.log();

  const messages = await generator.generateBatch(recipients, null, variables);

  console.log('\n生成的消息:\n');
  messages.forEach((msg, index) => {
    console.log(`【${index + 1}】${msg.recipientName}:`);
    console.log(`${msg.message}\n`);
  });
}

// ========== 场景2: 模板批量发送 ==========

console.log('\n📋 场景2: 基于模板的批量通知\n');
console.log('-'.repeat(60));

function demo2_TemplateBatch() {
  const recipients = [
    { id: 'ou_demo3', name: '王五', company: '测试公司1' },
    { id: 'ou_demo4', name: '赵六', company: '测试公司2' }
  ];

  const template = 'follow-up';
  const variables = {
    productName: 'Auto-Reply Pro',
    purpose: '可以帮您自动化处理客户咨询'
  };

  console.log('使用模板:', template);
  console.log('收件人数量:', recipients.length);
  console.log();

  recipients.forEach(recipient => {
    const personalizedVars = { ...variables, ...recipient };
    const message = templateManager.render(template, personalizedVars);
    console.log(`【${recipient.name}】`);
    console.log(`${message}\n`);
  });
}

// ========== 场景3: 定时发送 ==========

console.log('\n📋 场景3: 定时发送任务\n');
console.log('-'.repeat(60));

function demo3_ScheduledSend() {
  const task = {
    platform: 'feishu',
    recipients: [
      { id: 'ou_demo5', name: '测试用户1', type: 'open_id' }
    ],
    message: '这是一条定时发送的测试消息，将在指定时间自动发送。',
    sendAt: new Date(Date.now() + 60000), // 1分钟后
    priority: 'normal'
  };

  const taskId = scheduler.scheduleMessage(task);

  console.log('任务ID:', taskId);
  console.log('平台:', task.platform);
  console.log('发送时间:', task.sendAt.toLocaleString('zh-CN'));
  console.log('优先级:', task.priority);

  const status = scheduler.getQueueStatus();
  console.log('\n队列状态:');
  console.log('- 待发送:', status.pending);
  console.log('- 已发送:', status.sent);
  console.log('- 总计:', status.total);
}

// ========== 场景4: 飞书实际发送（需要配置） ==========

console.log('\n📋 场景4: 飞书实际发送（需要配置）\n');
console.log('-'.repeat(60));

async function demo4_FeishuSend() {
  const status = feishuAdapter.getStatus();

  console.log('飞书适配器状态:');
  console.log('- 已配置:', status.configured ? '✅' : '❌');
  console.log('- Token有效:', status.tokenValid ? '✅' : '❌');

  if (!status.configured) {
    console.log('\n⚠️ 未配置飞书凭据，跳过实际发送演示');
    console.log('配置方法:');
    console.log('export FEISHU_APP_ID="your_app_id"');
    console.log('export FEISHU_APP_SECRET="your_app_secret"');
    return;
  }

  // 实际发送示例（取消注释以启用）
  /*
  const result = await feishuAdapter.sendTextMessage(
    'ou_xxxx', // 替换为实际的 open_id
    'open_id',
    '这是一条来自 Auto-Reply Pro 的测试消息！'
  );

  console.log('发送结果:', result);
  */
}

// ========== 运行演示 ==========

(async () => {
  try {
    await demo1_AIGeneration();
    demo2_TemplateBatch();
    demo3_ScheduledSend();
    await demo4_FeishuSend();

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ 演示完成！\n');

    console.log('📦 功能总结:');
    console.log('  ✅ AI 生成个性化消息');
    console.log('  ✅ 基于模板批量发送');
    console.log('  ✅ 定时任务调度');
    console.log('  ✅ 飞书平台集成');
    console.log('  ✅ 速率限制和重试');
    console.log('  ✅ 发送状态追踪');

    console.log('\n🎯 使用场景:');
    console.log('  1. 客户跟进 - 自动发送个性化跟进消息');
    console.log('  2. 营销触达 - 批量发送营销内容');
    console.log('  3. 团队通知 - 定时发送团队公告');
    console.log('  4. 社群运营 - 自动发送社群内容');

    console.log('\n💰 商业价值:');
    console.log('  - 节省时间: 90% 人工发送时间');
    console.log('  - 提升效率: 批量处理，自动化执行');
    console.log('  - 个性化: AI 生成，千人千面');
    console.log('  - 合规安全: 遵守平台规则，防止封号');

    console.log('\n📚 完整文档: PROACTIVE-MESSAGING-DESIGN.md\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ 演示失败:', error.message);
    process.exit(1);
  }
})();
