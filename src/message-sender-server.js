/**
 * Auto-Reply Pro - 完整消息发送服务器
 * 提供 Web 界面和消息发送功能
 */

const express = require('express');
const http = require('http');
const path = require('path');
const ContextManager = require('./core/ContextManager');
const TemplateManager = require('./core/TemplateManager');
const MessageScheduler = require('./scheduler/MessageScheduler');
const MessageGenerator = require('./generator/MessageGenerator');
const { getLogger } = require('./middleware/logger');
const { getValidationMiddleware } = require('./middleware/validation');

// 配置
const config = {
  port: process.env.PORT || 3003,
  enableAuth: process.env.ENABLE_AUTH !== 'false',
  apiKey: process.env.API_KEY || 'demo-key'
};

// 初始化
const logger = getLogger({ level: 'info' });
const contextManager = new ContextManager();
const templateManager = new TemplateManager();
const messageScheduler = new MessageScheduler();
const messageGenerator = new MessageGenerator({
  templateManager
});

const validation = getValidationMiddleware();

console.log('🚀 Auto-Reply Pro - 消息发送服务器启动中...\n');

// ========== Express 应用 ==========

const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(validation.sanitizeMiddleware());

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ========== 路由 ==========

// 首页 - 消息发送界面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/message-sender.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Auto-Reply Pro',
    version: '1.0.0',
    feature: 'Message Sender',
    timestamp: new Date().toISOString()
  });
});

// ========== 核心：消息发送 API ==========

app.post('/api/send-message', async (req, res) => {
  try {
    const { platform = 'feishu', userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message are required'
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('📤 Auto-Reply Pro - 发送消息请求');
    console.log('='.repeat(60));
    console.log(`平台: ${platform}`);
    console.log(`接收者: ${userId}`);
    console.log(`消息: "${message}"`);
    console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('='.repeat(60) + '\n');

    // 返回发送请求
    // 注意：实际的发送需要通过外部调用 OpenClaw 完成
    const sendRequest = {
      success: true,
      product: 'Auto-Reply Pro',
      version: '1.0.0',
      action: 'send_message',
      platform: platform,
      target: userId,
      message: message,
      timestamp: new Date().toISOString(),
      note: '消息已准备好发送'
    };

    logger.info('Message send request', sendRequest);

    // 保存发送历史
    const history = {
      id: Date.now(),
      platform,
      userId,
      message,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    res.json({
      ...sendRequest,
      historyId: history.id,
      webUI: `http://localhost:${config.port}`,
      instruction: '请在下方点击"确认发送"按钮完成发送'
    });

  } catch (error) {
    logger.logError(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取发送历史
app.get('/api/history', (req, res) => {
  res.json({
    success: true,
    history: [] // 可以从数据库获取
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    product: 'Auto-Reply Pro'
  });
});

// ========== 启动服务 ==========

const server = http.createServer(app);

server.listen(config.port, () => {
  console.log('✅ Auto-Reply Pro 消息发送器已启动');
  console.log('');
  console.log('🌐 Web 界面:');
  console.log(`   http://localhost:${config.port}`);
  console.log('');
  console.log('📝 使用方法:');
  console.log('   1. 打开浏览器访问上述地址');
  console.log('   2. 输入接收者 ID');
  console.log('   3. 输入消息内容');
  console.log('   4. 点击"发送消息"按钮');
  console.log('');
  console.log('='.repeat(60));
  console.log('');
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n👋 Auto-Reply Pro 正在关闭...');
  server.close(() => {
    console.log('✅ 服务已停止');
    process.exit(0);
  });
});

module.exports = { app, server };
