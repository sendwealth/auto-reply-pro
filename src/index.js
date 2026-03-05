/**
 * Auto-Reply Pro - 主入口文件
 * 集成所有模块，启动服务
 */

const CoreEngine = require('./CoreEngine');
const ContextManager = require('./core/ContextManager');
const TemplateManager = require('./core/TemplateManager');
const DiscordAdapter = require('./adapters/BasePlatformAdapter');
const WebAdapter = require('./adapters/WebAdapter');

// 配置
const config = {
  // Discord 配置（如果需要）
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    enabled: false // 根据需要启用
  },

  // Web 配置
  web: {
    port: process.env.PORT || 3002,
    enabled: true
  },

  // AI 配置
  ai: {
    provider: 'deepseek',
    apiKey: process.env.DEEPSEEK_API_KEY
  }
};

// 创建核心引擎
const engine = new CoreEngine({
  name: 'Auto-Reply Pro',
  version: '1.0.0'
});

// 创建上下文管理器
const contextManager = new ContextManager({
  maxHistoryLength: 10,
  sessionTimeout: 3600000 // 1小时
});

// 创建模板管理器
const templateManager = new TemplateManager();

// 设置到引擎
engine.setContextManager(contextManager);

console.log('🚀 Auto-Reply Pro 正在启动...\n');

// ========== 简单的 AI 回复策略 ==========

class SimpleAIStrategy {
  constructor(templateManager) {
    this.templateManager = templateManager;
  }

  async generateReply(message, context) {
    const text = message.content.text.toLowerCase();

    // 意图识别
    let intent = 'general';

    if (text.includes('价格') || text.includes('多少钱') || text.includes('pricing')) {
      intent = 'pricing';
    } else if (text.includes('功能') || text.includes('feature')) {
      intent = 'features';
    } else if (text.includes('支持') || text.includes('帮助') || text.includes('support')) {
      intent = 'support';
    } else if (text.includes('演示') || text.includes('demo')) {
      intent = 'demo';
    } else if (text.includes('你好') || text.includes('hi') || text.includes('hello')) {
      intent = 'greeting';
    } else if (text.includes('谢谢') || text.includes('thanks')) {
      intent = 'thanks';
    } else if (text.includes('再见') || text.includes('bye')) {
      intent = 'goodbye';
    }

    // 获取模板
    const reply = this.templateManager.getTemplateForIntent(intent);

    return {
      content: reply,
      intent: intent,
      confidence: 0.8
    };
  }
}

// 注册策略
const strategy = new SimpleAIStrategy(templateManager);
engine.registerStrategy(strategy);

// ========== 平台适配器 ==========

// Web 适配器（默认启用）
if (config.web.enabled) {
  const webAdapter = new WebAdapter(config.web);

  webAdapter.onMessage(async (message) => {
    try {
      const context = await contextManager.getContext(message);
      const response = await strategy.generateReply(message, context);
      await contextManager.updateContext(message, response);
      return response;
    } catch (error) {
      console.error('❌ 消息处理失败:', error);
      return {
        content: templateManager.getTemplate('fallback'),
        intent: 'error',
        confidence: 0
      };
    }
  });

  webAdapter.connect().then(() => {
    console.log('✅ Web 平台已就绪\n');
  }).catch(err => {
    console.error('❌ Web 平台启动失败:', err);
  });
}

// Discord 适配器（可选）
if (config.discord.enabled && config.discord.token) {
  const discordAdapter = new DiscordAdapter(config.discord);

  discordAdapter.onMessage(async (message) => {
    try {
      const context = await contextManager.getContext(message);
      const response = await strategy.generateReply(message, context);
      await contextManager.updateContext(message, response);
      await discordAdapter.sendReply(message, response.content);
    } catch (error) {
      console.error('❌ Discord 消息处理失败:', error);
    }
  });

  discordAdapter.connect().then(() => {
    console.log('✅ Discord 平台已就绪\n');
  }).catch(err => {
    console.error('❌ Discord 平台启动失败:', err);
  });
}

// ========== 优雅退出 ==========

process.on('SIGINT', async () => {
  console.log('\n\n🛑 正在关闭服务...');

  // 保存上下文数据
  const contextData = contextManager.export();
  console.log('💾 上下文数据已保存');

  console.log('👋 Auto-Reply Pro 已停止');
  process.exit(0);
});

// ========== 导出 ==========

module.exports = {
  engine,
  contextManager,
  templateManager
};
