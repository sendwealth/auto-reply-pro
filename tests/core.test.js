/**
 * Auto-Reply Pro 测试套件
 */

const assert = require('assert');
const ContextManager = require('../src/core/ContextManager');
const TemplateManager = require('../src/core/TemplateManager');

console.log('🧪 开始测试 Auto-Reply Pro...\n');

// 测试计数器
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${error.message}`);
    failed++;
  }
}

// ========== ContextManager 测试 ==========

console.log('📦 ContextManager 测试\n');

test('ContextManager - 创建实例', () => {
  const cm = new ContextManager();
  assert(cm instanceof ContextManager);
  assert(cm.sessions instanceof Map);
  assert(cm.userProfiles instanceof Map);
});

test('ContextManager - 获取上下文', async () => {
  const cm = new ContextManager();
  const message = {
    source: {
      platform: 'discord',
      channelId: '123',
      userId: 'user1'
    },
    context: {
      conversationId: 'conv1'
    }
  };

  const context = await cm.getContext(message);
  assert(context.session);
  assert(context.userProfile);
  assert(Array.isArray(context.history));
});

test('ContextManager - 更新上下文', async () => {
  const cm = new ContextManager();
  const message = {
    source: {
      platform: 'discord',
      channelId: '123',
      userId: 'user1'
    },
    context: {
      conversationId: 'conv1'
    },
    content: {
      text: '你好'
    }
  };

  const response = {
    content: '您好！有什么可以帮您？',
    intent: 'greeting'
  };

  await cm.getContext(message);
  await cm.updateContext(message, response);

  const context = await cm.getContext(message);
  assert(context.history.length === 1);
  assert(context.session.messageCount === 2); // getContext + updateContext
});

test('ContextManager - 获取统计信息', () => {
  const cm = new ContextManager();
  const stats = cm.getStats();

  assert(typeof stats.totalSessions === 'number');
  assert(typeof stats.activeSessions === 'number');
});

test('ContextManager - 清理过期会话', async () => {
  const cm = new ContextManager({ sessionTimeout: 100 }); // 100ms
  const message = {
    source: { platform: 'test', channelId: '1', userId: '1' },
    context: {}
  };

  await cm.getContext(message);
  
  // 等待会话过期
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const cleaned = cm.cleanupExpiredSessions();
  assert(cleaned === 1);
});

// ========== TemplateManager 测试 ==========

console.log('\n📦 TemplateManager 测试\n');

test('TemplateManager - 创建实例', () => {
  const tm = new TemplateManager();
  assert(tm instanceof TemplateManager);
  assert(tm.templates instanceof Map);
});

test('TemplateManager - 获取模板', () => {
  const tm = new TemplateManager();
  
  const greeting = tm.getTemplate('greeting', 'zh');
  assert(typeof greeting === 'string');
  assert(greeting.includes('您好'));
});

test('TemplateManager - 获取不存在的模板（返回fallback）', () => {
  const tm = new TemplateManager();
  
  const fallback = tm.getTemplate('nonexistent', 'zh');
  assert(typeof fallback === 'string');
  assert(fallback.includes('抱歉'));
});

test('TemplateManager - 渲染模板', () => {
  const tm = new TemplateManager();
  
  // 注册带变量的模板
  tm.registerTemplate('test', '你好，{{name}}！欢迎来到{{place}}。');
  
  const rendered = tm.render('test', { name: '张三', place: '北京' });
  assert(rendered === '你好，张三！欢迎来到北京。');
});

test('TemplateManager - 根据意图获取模板', () => {
  const tm = new TemplateManager();
  
  const pricing = tm.getTemplateForIntent('pricing', 'zh');
  assert(typeof pricing === 'string');
  assert(pricing.includes('¥'));
});

test('TemplateManager - 列出所有模板', () => {
  const tm = new TemplateManager();
  const templates = tm.listTemplates();
  
  assert(Array.isArray(templates));
  assert(templates.length > 0);
  assert(templates.includes('greeting'));
  assert(templates.includes('pricing'));
});

test('TemplateManager - 添加自定义模板', () => {
  const tm = new TemplateManager();
  
  tm.addCustomTemplate('custom', '这是自定义模板');
  const custom = tm.getTemplate('custom');
  
  assert(custom === '这是自定义模板');
});

// ========== 测试总结 ==========

console.log('\n' + '='.repeat(50));
console.log(`\n📊 测试结果:\n`);
console.log(`✅ 通过: ${passed}`);
console.log(`❌ 失败: ${failed}`);
console.log(`📈 成功率: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 所有测试通过！');
  process.exit(0);
} else {
  console.log('\n⚠️ 部分测试失败，需要修复');
  process.exit(1);
}
