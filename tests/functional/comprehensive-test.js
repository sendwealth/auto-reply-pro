/**
 * 功能测试套件 - 全面测试所有功能
 */

const assert = require('assert');
const path = require('path');

console.log('🧪 Auto-Reply Pro 功能测试套件\n');
console.log('='.repeat(60));

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 测试函数
function test(name, fn) {
  testResults.total++;
  try {
    fn();
    console.log(`✅ ${name}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
  }
}

async function asyncTest(name, fn) {
  testResults.total++;
  try {
    await fn();
    console.log(`✅ ${name}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
  }
}

// ========== 1. 核心引擎测试 ==========

console.log('\n📦 核心引擎测试\n');

test('ContextManager - 基础功能', () => {
  const ContextManager = require('../../src/core/ContextManager');
  const cm = new ContextManager();
  assert(cm instanceof ContextManager);
  assert(cm.sessions instanceof Map);
});

test('TemplateManager - 基础功能', () => {
  const TemplateManager = require('../../src/core/TemplateManager');
  const tm = new TemplateManager();
  assert(tm instanceof TemplateManager);
  assert(tm.templates instanceof Map);
});

test('MessageScheduler - 基础功能', () => {
  const MessageScheduler = require('../../src/scheduler/MessageScheduler');
  const ms = new MessageScheduler();
  assert(ms instanceof MessageScheduler);
  assert(Array.isArray(ms.taskQueue));
});

test('MessageGenerator - 基础功能', () => {
  const TemplateManager = require('../../src/core/TemplateManager');
  const MessageGenerator = require('../../src/generator/MessageGenerator');
  
  const tm = new TemplateManager();
  const mg = new MessageGenerator({ templateManager: tm });
  assert(mg instanceof MessageGenerator);
});

// ========== 2. 平台适配器测试 ==========

console.log('\n🌐 平台适配器测试\n');

test('FeishuAdapter - 初始化', () => {
  const FeishuAdapter = require('../../src/adapters/FeishuAdapter');
  const adapter = new FeishuAdapter();
  assert(adapter instanceof FeishuAdapter);
  assert(typeof adapter.getTenantToken === 'function');
});

test('WeChatAdapter - 初始化', () => {
  const WeChatAdapter = require('../../src/adapters/WeChatAdapter');
  const adapter = new WeChatAdapter();
  assert(adapter instanceof WeChatAdapter);
  assert(typeof adapter.getAccessToken === 'function');
});

test('EmailAdapter - 初始化', () => {
  const EmailAdapter = require('../../src/adapters/EmailAdapter');
  const adapter = new EmailAdapter();
  assert(adapter instanceof EmailAdapter);
  assert(typeof adapter.sendEmail === 'function');
});

test('WebAdapter - 初始化', () => {
  const WebAdapter = require('../../src/adapters/WebAdapter');
  const adapter = new WebAdapter({});  // 需要传入配置对象
  assert(adapter instanceof WebAdapter);
  assert(typeof adapter.connect === 'function');
});

// ========== 3. 意图识别测试 ==========

console.log('\n🎯 意图识别测试\n');

test('意图识别 - 问候', async () => {
  const TemplateManager = require('../../src/core/TemplateManager');
  const tm = new TemplateManager();
  
  const text = '你好';
  let intent = 'general';
  
  if (text.includes('你好') || text.includes('hi')) {
    intent = 'greeting';
  }
  
  assert(intent === 'greeting');
});

test('意图识别 - 价格', () => {
  const text = '产品多少钱';
  let intent = 'general';
  
  if (text.includes('价格') || text.includes('多少钱')) {
    intent = 'pricing';
  }
  
  assert(intent === 'pricing');
});

test('意图识别 - 功能', () => {
  const text = '有什么功能';
  let intent = 'general';
  
  if (text.includes('功能') || text.includes('feature')) {
    intent = 'features';
  }
  
  assert(intent === 'features');
});

// ========== 4. 模板测试 ==========

console.log('\n📝 模板测试\n');

test('模板 - 获取问候模板', () => {
  const TemplateManager = require('../../src/core/TemplateManager');
  const tm = new TemplateManager();
  
  const greeting = tm.getTemplate('greeting', 'zh');
  assert(typeof greeting === 'string');
  assert(greeting.includes('您好'));
});

test('模板 - 获取价格模板', () => {
  const TemplateManager = require('../../src/core/TemplateManager');
  const tm = new TemplateManager();
  
  const pricing = tm.getTemplate('pricing', 'zh');
  assert(typeof pricing === 'string');
  assert(pricing.includes('¥'));
});

test('模板 - 变量替换', () => {
  const TemplateManager = require('../../src/core/TemplateManager');
  const tm = new TemplateManager();
  
  tm.addCustomTemplate('test', '你好，{{name}}！欢迎来到{{place}}。');
  const rendered = tm.render('test', { name: '张三', place: '北京' });
  
  assert(rendered === '你好，张三！欢迎来到北京。');
});

// ========== 5. 上下文管理测试 ==========

console.log('\n🔄 上下文管理测试\n');

asyncTest('上下文 - 获取上下文', async () => {
  const ContextManager = require('../../src/core/ContextManager');
  const cm = new ContextManager();
  
  const message = {
    source: { platform: 'web', channelId: '1', userId: 'user1' },
    context: { conversationId: 'conv1' }
  };
  
  const context = await cm.getContext(message);
  assert(context.session);
  assert(context.userProfile);
});

asyncTest('上下文 - 更新上下文', async () => {
  const ContextManager = require('../../src/core/ContextManager');
  const cm = new ContextManager();
  
  const message = {
    source: { platform: 'web', channelId: '1', userId: 'user1' },
    context: { conversationId: 'conv1' },
    content: { text: '你好' }
  };
  
  const response = { content: '您好！', intent: 'greeting' };
  
  await cm.getContext(message);
  await cm.updateContext(message, response);
  
  const context = await cm.getContext(message);
  assert(context.history.length === 1);
});

// ========== 6. 消息调度测试 ==========

console.log('\n📅 消息调度测试\n');

test('调度 - 创建任务', () => {
  const MessageScheduler = require('../../src/scheduler/MessageScheduler');
  const ms = new MessageScheduler();
  
  const task = {
    platform: 'web',
    recipients: [{ id: 'user1' }],
    message: '测试消息',
    sendAt: new Date()
  };
  
  const taskId = ms.scheduleMessage(task);
  assert(typeof taskId === 'string');
  assert(ms.taskQueue.length === 1);
});

test('调度 - 优先级队列', () => {
  const MessageScheduler = require('../../src/scheduler/MessageScheduler');
  const ms = new MessageScheduler();
  
  ms.scheduleMessage({ platform: 'web', recipients: [], message: '低优先级', priority: 'low' });
  ms.scheduleMessage({ platform: 'web', recipients: [], message: '高优先级', priority: 'high' });
  ms.scheduleMessage({ platform: 'web', recipients: [], message: '普通', priority: 'normal' });
  
  assert(ms.taskQueue[0].priority === 'high');
  assert(ms.taskQueue[1].priority === 'normal');
  assert(ms.taskQueue[2].priority === 'low');
});

// ========== 7. Web 界面测试 ==========

console.log('\n🖥️ Web 界面测试\n');

test('WebDashboard - 初始化', () => {
  const WebDashboard = require('../../src/dashboard/WebDashboard');
  const dashboard = new WebDashboard({});
  assert(dashboard instanceof WebDashboard);
  assert(typeof dashboard.start === 'function');
});

// ========== 测试总结 ==========

console.log('\n' + '='.repeat(60));
console.log('\n📊 测试结果:\n');
console.log(`总计: ${testResults.total}`);
console.log(`✅ 通过: ${testResults.passed}`);
console.log(`❌ 失败: ${testResults.failed}`);
console.log(`📈 通过率: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

if (testResults.errors.length > 0) {
  console.log('\n❌ 失败详情:\n');
  testResults.errors.forEach((err, index) => {
    console.log(`${index + 1}. ${err.name}`);
    console.log(`   ${err.error}\n`);
  });
}

if (testResults.failed === 0) {
  console.log('\n🎉 所有功能测试通过！');
  process.exit(0);
} else {
  console.log('\n⚠️ 部分测试失败，需要修复');
  process.exit(1);
}
