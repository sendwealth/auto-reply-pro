/**
 * WebAdapter - Web Chat 平台适配器
 */

const express = require('express');

class WebAdapter {
  constructor(config) {
    this.config = {
      port: config.port || 3002,
      path: config.path || '/api/chat',
      ...config
    };

    this.app = null;
    this.server = null;
    this.messageHandler = null;
    this.isConnected = false;
  }

  /**
   * 启动 Web 服务器
   */
  async connect() {
    try {
      this.app = express();
      this.app.use(express.json());

      // CORS 支持
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
      });

      // 健康检查
      this.app.get('/health', (req, res) => {
        res.json({
          status: 'ok',
          platform: 'web',
          timestamp: new Date().toISOString()
        });
      });

      // 聊天接口
      this.app.post(this.config.path, async (req, res) => {
        try {
          const { message, userId, sessionId } = req.body;

          // 转换为统一消息格式
          const universalMessage = this.toUniversalMessage(message, userId, sessionId);

          // 调用消息处理器
          if (this.messageHandler) {
            const response = await this.messageHandler(universalMessage);
            res.json({
              success: true,
              response: response.content,
              timestamp: new Date().toISOString()
            });
          } else {
            res.json({
              success: false,
              error: 'No message handler configured'
            });
          }
        } catch (error) {
          console.error('❌ Web 消息处理失败:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      // 启动服务器
      this.server = this.app.listen(this.config.port, () => {
        this.isConnected = true;
        console.log('✅ Web 适配器已启动');
        console.log(`🌐 服务地址: http://localhost:${this.config.port}`);
        console.log(`💬 聊天接口: http://localhost:${this.config.port}${this.config.path}`);
      });

    } catch (error) {
      console.error('❌ Web 适配器启动失败:', error);
      throw error;
    }
  }

  /**
   * 设置消息处理器
   */
  onMessage(handler) {
    this.messageHandler = handler;
  }

  /**
   * 转换为统一消息格式
   */
  toUniversalMessage(message, userId, sessionId) {
    return {
      id: `web-${Date.now()}`,
      timestamp: new Date(),
      source: {
        platform: 'web',
        channelId: 'web-chat',
        userId: userId || 'anonymous',
        userName: 'Web User',
        metadata: {
          sessionId: sessionId
        }
      },
      content: {
        text: message,
        type: 'text'
      },
      context: {
        conversationId: sessionId || `session-${userId}`
      },
      flags: {
        priority: 'normal',
        requiresResponse: true,
        processed: false
      }
    };
  }

  /**
   * 发送回复（Web 通过 HTTP 响应返回）
   */
  async sendReply(originalMessage, replyContent) {
    // Web 适配器的回复通过 HTTP 响应返回，不需要单独发送
    console.log(`✅ Web 回复已准备: ${replyContent.substring(0, 50)}...`);
    return true;
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
      this.isConnected = false;
      console.log('🔌 Web 适配器已停止');
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      platform: 'web',
      connected: this.isConnected,
      port: this.config.port,
      path: this.config.path
    };
  }
}

module.exports = WebAdapter;
