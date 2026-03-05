// Core Engine - 核心引擎
const { UniversalMessage, UniversalResponse } = require('./models/UniversalMessage');
const { PlatformRegistry } = require('./adapters/BasePlatformAdapter');

class AutoReplyEngine {
  constructor(config) {
    this.config = config;
    this.platformRegistry = new PlatformRegistry();
    this.aiProviders = new Map();
    this.strategies = [];
    this.contextManager = null;
    this.messageRouter = null;
    this.storage = null;

    this.stats = {
      messagesReceived: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      averageProcessingTime: 0
    };
  }

  // 注册平台适配器
  registerPlatform(name, adapter) {
    this.platformRegistry.register(name, adapter);
    console.log(`✅ 平台适配器已注册: ${name}`);
  }

  // 注册 AI 提供商
  registerAIProvider(name, provider) {
    this.aiProviders.set(name, provider);
    console.log(`✅ AI 提供商已注册: ${name}`);
  }

  // 注册策略
  registerStrategy(strategy) {
    this.strategies.push(strategy);
    // 按优先级排序
    this.strategies.sort((a, b) => b.priority - a.priority);
    console.log(`✅ 策略已注册: ${strategy.name} (优先级: ${strategy.priority})`);
  }

  // 设置上下文管理器
  setContextManager(manager) {
    this.contextManager = manager;
  }

  // 设置消息路由器
  setMessageRouter(router) {
    this.messageRouter = router;
  }

  // 设置存储层
  setStorage(storage) {
    this.storage = storage;
  }

  // 消息处理主流程
  async handleMessage(message) {
    const startTime = Date.now();
    this.stats.messagesReceived++;

    try {
      console.log(`\n📨 收到消息 [${message.source.platform}]: ${message.content.text}`);

      // 1. 加载上下文
      const context = await this.loadContext(message);

      // 2. 路由到合适的策略
      const strategy = this.routeMessage(message, context);

      // 3. 生成回复
      const response = await strategy.generateReply(message, context);

      // 4. 发送回复
      if (message.flags.requiresResponse) {
        await this.sendResponse(message, response);
      }

      // 5. 更新上下文
      await this.updateContext(message, response);

      // 6. 记录日志
      await this.logInteraction(message, response);

      // 更新统计
      this.stats.messagesProcessed++;
      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime(processingTime);

      console.log(`✅ 消息处理完成 (${processingTime}ms)`);

      return response;

    } catch (error) {
      this.stats.messagesFailed++;
      console.error('❌ 消息处理失败:', error);
      await this.handleError(message, error);
      throw error;
    }
  }

  // 加载上下文
  async loadContext(message) {
    if (!this.contextManager) {
      return this.getDefaultContext(message);
    }

    try {
      return await this.contextManager.getContext(
        message.context.conversationId
      );
    } catch (error) {
      console.warn('加载上下文失败，使用默认上下文:', error.message);
      return this.getDefaultContext(message);
    }
  }

  // 获取默认上下文
  getDefaultContext(message) {
    return {
      conversationId: message.context.conversationId,
      userId: message.source.userId,
      platform: message.source.platform,
      history: [],
      userProfile: {},
      state: {},
      metadata: {}
    };
  }

  // 路由消息
  routeMessage(message, context) {
    if (!this.messageRouter) {
      // 默认路由：选择第一个匹配的策略
      for (const strategy of this.strategies) {
        if (strategy.shouldHandle(message, context)) {
          return strategy;
        }
      }
      // 返回默认策略
      return this.getDefaultStrategy();
    }

    return this.messageRouter.route(message, this.strategies, context);
  }

  // 获取默认策略
  getDefaultStrategy() {
    return {
      name: 'default',
      priority: 0,
      shouldHandle: () => true,
      generateReply: async (message) => {
        return new UniversalResponse({
          platform: message.source.platform,
          channelId: message.source.channelId,
          userId: message.source.userId,
          text: '感谢您的消息！我们已收到并会尽快回复。',
          strategy: 'default'
        });
      }
    };
  }

  // 发送响应
  async sendResponse(message, response) {
    const adapter = this.platformRegistry.get(message.source.platform);

    if (!adapter) {
      throw new Error(`未找到平台适配器: ${message.source.platform}`);
    }

    await adapter.sendMessage(response);
  }

  // 更新上下文
  async updateContext(message, response) {
    if (!this.contextManager) {
      return;
    }

    try {
      await this.contextManager.updateContext(
        message.context.conversationId,
        message,
        response
      );
    } catch (error) {
      console.warn('更新上下文失败:', error.message);
    }
  }

  // 记录交互
  async logInteraction(message, response) {
    if (!this.storage) {
      return;
    }

    try {
      await this.storage.saveInteraction({
        message: message.toJSON(),
        response: response.toJSON(),
        timestamp: new Date()
      });
    } catch (error) {
      console.warn('记录交互失败:', error.message);
    }
  }

  // 错误处理
  async handleError(message, error) {
    console.error(`处理消息失败 [${message.id}]:`, error);

    // 可以发送错误通知
    // 可以记录到错误日志系统
  }

  // 更新平均处理时间
  updateAverageProcessingTime(newTime) {
    const alpha = 0.1; // 平滑系数
    this.stats.averageProcessingTime =
      this.stats.averageProcessingTime * (1 - alpha) + newTime * alpha;
  }

  // 启动引擎
  async start() {
    console.log('🚀 Auto-Reply Pro 引擎启动中...');

    // 初始化所有平台适配器
    for (const [name, adapter] of this.platformRegistry.adapters) {
      try {
        const config = this.config.platforms?.[name] || {};
        await adapter.initialize(config);

        // 设置消息监听
        adapter.onMessage((message) => {
          this.handleMessage(message).catch(err => {
            console.error('处理消息失败:', err);
          });
        });

        console.log(`✅ 平台 ${name} 已启动`);
      } catch (error) {
        console.error(`❌ 平台 ${name} 启动失败:`, error);
      }
    }

    console.log('✅ Auto-Reply Pro 引擎已启动');
    console.log(`📊 已注册 ${this.platformRegistry.getPlatformNames().length} 个平台`);
    console.log(`📊 已注册 ${this.strategies.length} 个策略`);
  }

  // 关闭引擎
  async shutdown() {
    console.log('🛑 Auto-Reply Pro 引擎关闭中...');

    // 关闭所有平台适配器
    for (const [name, adapter] of this.platformRegistry.adapters) {
      try {
        await adapter.shutdown();
        console.log(`✅ 平台 ${name} 已关闭`);
      } catch (error) {
        console.error(`❌ 平台 ${name} 关闭失败:`, error);
      }
    }

    console.log('✅ Auto-Reply Pro 引擎已关闭');
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      platforms: this.platformRegistry.getPlatformNames(),
      strategies: this.strategies.map(s => s.name),
      aiProviders: Array.from(this.aiProviders.keys())
    };
  }

  // 健康检查
  async healthCheck() {
    const platforms = {};

    for (const [name, adapter] of this.platformRegistry.adapters) {
      try {
        platforms[name] = await adapter.healthCheck();
      } catch (error) {
        platforms[name] = {
          status: 'error',
          error: error.message
        };
      }
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      stats: this.stats,
      platforms
    };
  }
}

// 导出
module.exports = AutoReplyEngine;
